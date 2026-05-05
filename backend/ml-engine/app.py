import streamlit as st
import datetime
import matplotlib.pyplot as plt
import sys
sys.path.append('.')

from src.model import walk_forward_validation
from src.data_loader import download_stock_data
from src.features import calculate_features
from src.config import FEATURES
from src.model import (train_test_split_timeseries, train_random_forest,
                       evaluate_model, calculate_strategy_returns,
                       predict_next_day, predict_with_sentiment)
from src.model import (train_test_split_timeseries, train_random_forest,
                       evaluate_model, calculate_strategy_returns,
                       predict_next_day, predict_with_sentiment,
                       walk_forward_validation, calculate_risk_metrics)

@st.cache_data(ttl=3600)
def load_and_prepare(ticker: str, start_date: str, end_date: str):
    df_raw = download_stock_data(ticker, start_date, end_date)
    df = calculate_features(df_raw)
    return df

@st.cache_data(ttl=3600)
def train_model_cached(ticker: str, _df):
    # ticker is only here so the cache key is ticker-specific
    X_train, X_test, y_train, y_test, split = train_test_split_timeseries(_df, FEATURES)
    model = train_random_forest(X_train, y_train)
    return model, X_train, X_test, y_train, y_test, split


from src.utils import plot_price_with_sma, plot_rsi
from src.sentiment import get_news_sentiment, interpret_sentiment
import warnings
warnings.filterwarnings('ignore')

# ── Page config ──────────────────────────────────────────────
st.set_page_config(page_title="Quantitative Market Analysis",
                   page_icon="📈", layout="wide")

# ── Sidebar ───────────────────────────────────────────────────
with st.sidebar:
    st.title("About")
    st.write("""
    **Quantitative Market Analysis**
    
    Predicts next day's price direction for any stock
    using machine learning and technical indicators.
    
    **Model:** Random Forest Classifier  
    **Indicators Used:**
    - SMA 20 & SMA 50
    - RSI
    - MACD & Signal Line
    - Bollinger Band Width
    - Momentum
    - Volatility
    """)
    st.divider()
    st.write("**How to use:**")
    st.write("1. Enter any NSE ticker (e.g. RELIANCE.NS)")
    st.write("2. Click Predict")
    st.write("3. Run after 3:30 PM IST for best results")
    st.divider()
    st.caption("Built by Samarth Patel")
    st.caption("github.com/samarthpatel03")

# ── Main ──────────────────────────────────────────────────────
st.title("📈 Stock Movement Predictor")
st.subheader("Predict whether a stock will go UP or DOWN tomorrow")

ticker = st.text_input("Enter NSE Stock Ticker", value="RELIANCE.NS")
ticker = ticker.strip().upper()

# Warn if user forgot .NS suffix
if ticker and not ticker.endswith(".NS") and not ticker.endswith(".BO"):
    st.warning(
        f"⚠️ Looks like you entered '{ticker}' — NSE tickers need a '.NS' suffix "
        f"(e.g. '{ticker}.NS'). BSE tickers use '.BO'."
    )
    auto_ticker = ticker + ".NS"
    if st.button(f"Use {auto_ticker} instead?"):
        ticker = auto_ticker

# ── Predict Button ────────────────────────────────────────────
if st.button("Predict"):
    with st.spinner("Downloading data and training model..."):
        try:
            # Download data
            yesterday = (datetime.datetime.today() -
                        datetime.timedelta(days=1)).strftime('%Y-%m-%d')
            start_date = (datetime.datetime.today() -
                         datetime.timedelta(days=1095)).strftime('%Y-%m-%d')

            df = load_and_prepare(ticker, start_date, yesterday)

            if df.empty:
                st.error("No data found. Please check the ticker symbol.")
                st.stop()

            if len(df) < 100:
                st.error("Not enough data to train. Try a different ticker.")
                st.stop()

            model, X_train, X_test, y_train, y_test, split = train_model_cached(ticker, df)
            predictions, accuracy, report = evaluate_model(model, X_test, y_test)

            wf_accuracies, wf_avg = walk_forward_validation(df, FEATURES)

            st.divider()
            st.subheader("Walk-forward Validation")
            st.caption("Trains on past data only and tests on future — more realistic than a single train/test split.")

            wf_cols = st.columns(len(wf_accuracies) + 1)
            for i, acc in enumerate(wf_accuracies):
                wf_cols[i].metric(f"Fold {i+1}", f"{acc*100:.1f}%")
            wf_cols[-1].metric("Average", f"{wf_avg*100:.1f}%", 
                    delta="vs single split" if abs(wf_avg - accuracy) > 0.02 else None)

            # Strategy returns
            buy_hold, strategy = calculate_strategy_returns(df, predictions, split)

            # Risk metrics
            risk = calculate_risk_metrics(df, predictions, split)

            # Predict tomorrow
            sentiment_score, headlines = get_news_sentiment(ticker)
            prediction, final_confidence, final_signal = predict_with_sentiment(
            model, df, FEATURES, sentiment_score)

            # ── Results ──────────────────────────────────────
            st.divider()
            st.subheader(f"Tomorrow's Prediction for {ticker}")

            col1, col2, col3 = st.columns(3)
            col1.metric("Last Close", f"₹{df['Close'].iloc[-1]:.2f}")
            col2.metric("Model Accuracy", f"{accuracy*100:.1f}%")
            col3.metric("Data Points", f"{len(df)}")

            st.divider()

            if prediction == 1:
                st.success(f"📈 {final_signal}")
                st.metric("Confidence", f"{final_confidence*100:.0f}%")
            else:
                st.error(f"📉 {final_signal}")
                st.metric("Confidence", f"{final_confidence*100:.0f}%")

            # ── Technical Indicators ─────────────────────────
            st.divider()
            st.subheader("Current Technical Indicators")
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("RSI", f"{df['RSI'].iloc[-1]:.2f}")
            c2.metric("MACD", f"{df['MACD'].iloc[-1]:.2f}")
            c3.metric("BB Width", f"{df['bb_Width'].iloc[-1]:.4f}")
            c4.metric("Momentum", f"{df['Momentum'].iloc[-1]:.2f}")

            # ── Strategy Returns ──────────────────────────────
            st.divider()
            st.subheader("Strategy Performance")

            s1, s2, s3 = st.columns(3)
            s1.metric("Buy & Hold Return", f"{buy_hold:.2f}%")
            s2.metric("ML Strategy Return", f"{strategy:.2f}%")
            s3.metric("Outperformance", f"{strategy - buy_hold:.2f}%",
                    delta=f"{strategy - buy_hold:.2f}%")
            
            st.caption("⚠️ Strategy goes to cash on predicted DOWN days. Short selling was tested but reduced performance due to model uncertainty on large-cap stocks — consistent with EMH findings.")

            st.divider()

            # Risk metrics table
            r1, r2, r3 = st.columns(3)
            r1.metric("Sharpe — Buy & Hold",  f"{risk['sharpe_market']:.3f}")
            r2.metric("Sharpe — ML Strategy", f"{risk['sharpe_strategy']:.3f}",
                    delta=f"{risk['sharpe_strategy'] - risk['sharpe_market']:.3f}")
            r3.metric("Sharpe Improvement", 
                    "Better ✅" if risk['sharpe_strategy'] > risk['sharpe_market'] else "Worse ❌")

            r4, r5, r6 = st.columns(3)
            r4.metric("Max Drawdown — Buy & Hold",  f"{risk['mdd_market']:.2f}%")
            r5.metric("Max Drawdown — ML Strategy", f"{risk['mdd_strategy']:.2f}%",
                    delta=f"{risk['mdd_strategy'] - risk['mdd_market']:.2f}%",
                    delta_color="inverse")  # inverse because less negative = better
            r6.metric("Drawdown Reduction",
                    "Better ✅" if risk['mdd_strategy'] > risk['mdd_market'] else "Worse ❌")

            st.caption("Sharpe ratio is annualised (×√252). Higher is better. Max drawdown is peak-to-trough decline. Less negative is better.")

            # ── Charts ────────────────────────────────────────
            st.divider()
            st.subheader("Price Chart with Moving Averages")
            fig1 = plot_price_with_sma(df, ticker)
            st.pyplot(fig1)

            st.subheader("RSI Indicator")
            fig2 = plot_rsi(df, ticker)
            st.pyplot(fig2)
            

            # ── Sentiment Analysis ────────────────────────────────────────
            st.divider()
            st.subheader("News Sentiment Analysis")

            col_s1, col_s2 = st.columns(2)
            col_s1.metric("Sentiment Score", f"{sentiment_score:.4f}")
            sentiment_label = interpret_sentiment(sentiment_score)
            col_s2.metric("Market Sentiment", sentiment_label)

            if headlines:
                st.write("**Latest Headlines:**")
                for h in headlines[:5]:
                    color = "🟢" if h['sentiment'] > 0.05 else "🔴" if h['sentiment'] < -0.05 else "⚪"
                    st.write(f"{color} {h['headline']}")
            else:
                st.write("No recent news found.")

            # ── Recent Data ───────────────────────────────────
            st.divider()
            st.subheader("Recent Data")
            st.dataframe(df[['Close', 'SMA_20', 'SMA_50',
                             'RSI', 'MACD', 'bb_Width']].tail(10))

            st.caption(f"Data as of: {df.index[-1].date()}")
            st.caption("⚠️ Run after 3:30 PM IST for accurate next-day prediction.")
            st.caption("⚠️ This is not financial advice.")

        except Exception as e:
            st.error(f"Error: {str(e)}")