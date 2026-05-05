"""
Flask API for Quantyx ML Analyzer
Wraps the quantitative-market-analysis model
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from src.model import walk_forward_validation
import sys
sys.path.append('./src')

from src.model import (
    train_test_split_timeseries, train_random_forest,
    predict_next_day, predict_with_sentiment, calculate_risk_metrics
)
from src.data_loader import download_stock_data
from src.features import calculate_features
from src.sentiment import get_news_sentiment
from src.config import FEATURES

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_stock():
    """
    Analyze a stock and predict next-day direction
    
    Expects JSON:
    {
      "symbol": "TCS.NS",
      "start_date": "2023-01-01",
      "end_date": "2024-12-31",
      "use_sentiment": true/false
    }
    
    Returns:
    {
      "prediction": "UP" | "DOWN",
      "confidence": 0.75,
      "accuracy": 0.68,
      "risk_metrics": {...},
      "sentiment": {...}
    }
    """
    try:
        data = request.json
        symbol = data.get('symbol')
        start_date = data.get('start_date', '2023-01-01')
        end_date = data.get('end_date', '2024-12-31')
        use_sentiment = data.get('use_sentiment', False)
        
        if not symbol:
            return jsonify({"error": "Missing symbol"}), 400
        
        # Download and prepare data
        df_raw = download_stock_data(symbol, start_date, end_date)
        if df_raw is None or df_raw.empty:
            return jsonify({"error": "Failed to download data"}), 404
        
        df = calculate_features(df_raw)
        
        # Train model
        X_train, X_test, y_train, y_test, split_idx = train_test_split_timeseries(df, FEATURES)
        model = train_random_forest(X_train, y_train)

        
        # Predict
        if use_sentiment:
            sentiment_score, headlines = get_news_sentiment(symbol)
            prediction, confidence, signal = predict_with_sentiment(model, df, FEATURES, sentiment_score)
            sentiment_data = {"score": sentiment_score, "headlines": headlines, "signal": signal}
        else:
            prediction, confidence = predict_next_day(model, df, FEATURES)
            signal = "UP" if prediction == 1 else "DOWN"
            sentiment_data = None
        
        # Calculate accuracy on test set
        y_pred = model.predict(X_test)
        accuracy = (y_pred == y_test).mean()
        
        # Risk metrics
        y_pred = model.predict(X_test)
        accuracy = float((y_pred == y_test.values).mean())
        risk = calculate_risk_metrics(df, y_pred, split_idx)
        
        wf_accuracies, wf_avg = walk_forward_validation(df, FEATURES)
        
        return jsonify({
            "prediction": "UP" if prediction == 1 else "DOWN",
            "confidence": float(confidence),
            "accuracy": float(accuracy),
            "risk_metrics": {
                "volatility": float(risk.get('volatility', 0)),
                "sharpe_ratio": float(risk.get('sharpe_ratio', 0)),
                "max_drawdown": float(risk.get('max_drawdown', 0)),
            },
            "sentiment": sentiment_data,
            "current_price": float(df['Close'].iloc[-1]),
            "walk_forward": {
    "fold_accuracies": wf_accuracies,
    "average": round(wf_avg, 4)
}
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
