import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier
import pandas as pd
from typing import Tuple, List
import joblib


def train_test_split_timeseries(
    df: pd.DataFrame,
    features: List[str],
    target: str = 'Target',
    split_ratio: float = 0.80
) -> Tuple:
    """Chronological train/test split — no shuffling."""
    X = df[features]
    y = df[target]
    
    split = int(len(df) * split_ratio)
    
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    
    return X_train, X_test, y_train, y_test, split


def train_random_forest(
    X_train: pd.DataFrame,
    y_train: pd.Series
) -> RandomForestClassifier:
    """Train Random Forest classifier."""
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model


def evaluate_model(
    model: RandomForestClassifier,
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> Tuple[np.ndarray, float, str]:
    """Evaluate model and return metrics."""
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    report = classification_report(y_test, predictions)
    return predictions, accuracy, report


def calculate_strategy_returns(df, predictions, split):
    """Calculate ML strategy returns vs buy and hold."""
    test_returns = df['Close'].pct_change().iloc[split+1:].values
    pred_aligned = predictions[:len(test_returns)]
    
    strategy_returns = test_returns * pred_aligned
    cumulative_market = (1 + test_returns).cumprod()
    cumulative_strategy = (1 + strategy_returns).cumprod()
    
    buy_hold = (cumulative_market[-1] - 1) * 100
    strategy = (cumulative_strategy[-1] - 1) * 100
    
    return buy_hold, strategy


def predict_next_day(model, df, features):
    """Predict tomorrow's direction using latest data."""
    latest = df[features].iloc[-1:]
    prediction = model.predict(latest)[0]
    confidence = model.predict_proba(latest)[0]
    return prediction, confidence

def predict_with_sentiment(model, df, features, sentiment_score):
    """
    Predict tomorrow's direction adjusted by news sentiment.
    """
    latest = df[features].iloc[-1:]
    prediction = model.predict(latest)[0]
    confidence = model.predict_proba(latest)[0]
    
    # Sentiment adjustment
    if prediction == 1:  # model says UP
        if sentiment_score < -0.2:  # but news is very negative
            final_signal = "WEAK BUY — Model bullish but sentiment negative"
            final_confidence = confidence[1] * 0.8  # reduce confidence
        else:
            final_signal = "STRONG BUY — Model bullish and sentiment confirms"
            final_confidence = confidence[1]
    else:  # model says DOWN
        if sentiment_score > 0.2:  # but news is very positive
            final_signal = "WEAK SELL — Model bearish but sentiment positive"
            final_confidence = confidence[0] * 0.8
        else:
            final_signal = "STRONG SELL — Model bearish and sentiment confirms"
            final_confidence = confidence[0]
    
    return prediction, final_confidence, final_signal

def save_model(model, path='best_model.joblib'):
    """Save trained model to disk."""
    joblib.dump(model, path)


def load_model(path='best_model.joblib'):
    """Load saved model from disk."""
    return joblib.load(path)

def walk_forward_validation(df, features, n_splits=5, target='Target'):
    """
    Simulates real trading: trains on past data, tests on future data.
    Rolls forward in equal-sized windows.
    Returns average accuracy across all folds.
    """
    total_len = len(df)
    fold_size = total_len // (n_splits + 1)  # +1 because first fold is train-only
    
    accuracies = []
    
    for i in range(1, n_splits + 1):
        train_end = fold_size * i
        test_end  = train_end + fold_size
        
        if test_end > total_len:
            break
        
        X_train = df[features].iloc[:train_end]
        y_train = df[target].iloc[:train_end]
        X_test  = df[features].iloc[train_end:test_end]
        y_test  = df[target].iloc[train_end:test_end]
        
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        acc = accuracy_score(y_test, preds)
        accuracies.append(acc)
    
    avg_accuracy = sum(accuracies) / len(accuracies)
    return accuracies, avg_accuracy

def calculate_risk_metrics(df: pd.DataFrame, predictions: np.ndarray, split: int) -> dict:
    """
    Calculate Sharpe ratio and maximum drawdown for ML strategy vs buy and hold.
    """
    test_returns = df['Close'].pct_change().iloc[split+1:].values
    pred_aligned = predictions[:len(test_returns)]

    strategy_returns = test_returns * pred_aligned

    # ── Sharpe Ratio ─────────────────────────────────────────
    # Annualised: multiply daily Sharpe by sqrt(252 trading days)
    def sharpe(returns):
        if returns.std() == 0:
            return 0.0
        return (returns.mean() / returns.std()) * np.sqrt(252)

    sharpe_market   = sharpe(test_returns)
    sharpe_strategy = sharpe(strategy_returns)

    # ── Maximum Drawdown ──────────────────────────────────────
    # Largest peak-to-trough decline in cumulative returns
    def max_drawdown(returns):
        cumulative = (1 + returns).cumprod()
        rolling_max = np.maximum.accumulate(cumulative)
        drawdowns = (cumulative - rolling_max) / rolling_max
        return drawdowns.min() * 100  # as percentage

    mdd_market   = max_drawdown(test_returns)
    mdd_strategy = max_drawdown(strategy_returns)

    return {
        'sharpe_market':   round(sharpe_market, 3),
        'sharpe_strategy': round(sharpe_strategy, 3),
        'mdd_market':      round(mdd_market, 2),
        'mdd_strategy':    round(mdd_strategy, 2),
    }