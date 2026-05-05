# Quantitative Market Analysis

A machine learning project that predicts stock market movement direction
using technical indicators, news sentiment analysis, and quantitative techniques.
Includes a live web application for real-time trading signals on any NSE stock.

## Current Project — Stock Movement Prediction
Predicting whether a stock will go UP or DOWN the next trading day using
historical price data, technical indicators, and real-time news sentiment.

## Tech Stack
- Python
- Pandas, NumPy
- Scikit-learn, XGBoost
- yfinance
- Matplotlib, Seaborn
- Streamlit
- VADER Sentiment Analyzer
- Joblib

## Project Structure
```
quantitative-market-analysis/
│
├── src/
│   ├── __init__.py
│   ├── config.py          # Central config — FEATURES list, model params
│   ├── data_loader.py     # Data download
│   ├── features.py        # Feature engineering
│   ├── model.py           # Training, prediction, walk-forward validation
│   ├── sentiment.py       # News sentiment analysis
│   └── utils.py           # Visualization helpers
│
├── stock_prediction.ipynb # Research notebook
├── app.py                 # Streamlit web app
├── requirements.txt       # Dependencies
└── README.md
```

## Features Engineered
| Indicator | Type | Purpose |
|-----------|------|---------|
| SMA 20, SMA 50 | Trend | Identifies Golden/Death Cross |
| RSI | Momentum | Overbought/Oversold signals |
| MACD & Histogram | Trend + Momentum | Momentum phase detection |
| Signal Line | Trend | MACD trigger line |
| Bollinger Band Width | Volatility | Market squeeze detection |
| Momentum | Momentum | 10-day price change |
| Volatility | Risk | Rolling standard deviation of returns |
| News Sentiment | Sentiment | VADER analysis of Yahoo Finance headlines |

## Sentiment Analysis
Fetches latest stock-specific news from Yahoo Finance and analyzes sentiment
using VADER. Combines ML prediction with sentiment for stronger signals:
- **STRONG BUY** — Model predicts UP + positive/neutral sentiment
- **WEAK BUY** — Model predicts UP but sentiment is negative
- **STRONG SELL** — Model predicts DOWN + negative/neutral sentiment
- **WEAK SELL** — Model predicts DOWN but sentiment is positive

## Exploratory Data Analysis
- Price trend with Golden Cross & Death Cross analysis
- RSI overbought/oversold signals (21 overbought, 15 oversold instances)
- MACD Histogram momentum phases
- Daily return distribution with fat tail analysis
- Feature correlation heatmap with multicollinearity analysis
- Bollinger Bands with support/resistance zones

## Model Comparison
| Model | Accuracy |
|-------|----------|
| Logistic Regression | 47.83% |
| XGBoost | 49.46% |
| **Random Forest** | **52–56%** ✅ |

Logistic Regression underperforming below random chance confirms stock direction
is a non-linear problem. Random Forest was selected as the final model.

## Strategy Results

Results vary by stock. Best results observed on PERSISTENT.NS — the only stock where
the strategy generated a positive return in a declining market:

| Metric | RELIANCE.NS | HDFCBANK.NS | PERSISTENT.NS |
|--------|-------------|-------------|---------------|
| Test Period | 2024–2025 | 2024–2025 | 2024–2025 |
| Buy & Hold Return | -3.05% | -18.69% | -3.86% |
| ML Strategy Return | -0.11% | -7.25% | **+7.43%** ✅ |
| Outperformance | +2.94% | +11.44% | **+11.29%** |
| Sharpe — Buy & Hold | -0.154 | -1.635 | -0.062 |
| Sharpe — ML Strategy | -0.984 ❌ | -1.082 | **+0.721** ✅ |
| Sharpe Improvement | -0.830 | +0.553 | **+0.783** |
| Max Drawdown — Buy & Hold | -18.07% | -27.53% | -30.74% |
| Max Drawdown — ML Strategy | -10.74% | -15.60% | **-11.06%** |
| Drawdown Reduction | +7.33% | +11.93% | **+19.68%** ✅ |

PERSISTENT.NS is the strongest result across all three metrics — positive ML return,
positive Sharpe ratio (0.721), and the largest drawdown reduction (19.68pp). This
suggests the model has genuine predictive power on mid-cap technology stocks where
price action is more technically driven compared to large-caps.

The strategy goes to cash on predicted DOWN days rather than taking short positions.
Short selling was tested but reduced performance due to model uncertainty on large-cap
stocks — consistent with EMH findings. The model's primary value is **capital
preservation in bear markets**, not return generation. On PERSISTENT.NS however, it
demonstrated the ability to generate positive returns even in a declining market.

## Walk-forward Validation
To assess whether model accuracy is genuine or a product of a lucky train/test
window, walk-forward validation was implemented. The model is trained on past
data only and tested on the immediately following period — simulating real
trading conditions. This is the correct evaluation method for time-series models;
standard k-fold cross-validation cannot be used as it would leak future data
into training.

Results across three NSE stocks (5 folds, ~115 trading days per fold):

| Stock | WF Average | Best Fold | Worst Fold | Fold Variance |
|-------|-----------|-----------|------------|---------------|
| RELIANCE.NS | 48.3% | 52.2% | 46.1% | 6.1pp |
| BALRAMCHIN.NS | 50.1% | 55.7% | 46.1% | 9.6pp |
| PERSISTENT.NS | 50.3% | 57.4% | 40.0% | 17.4pp |

**Key finding:** Walk-forward accuracy averages near 50% across stocks regardless
of market cap, but fold-level variance increases significantly for mid-cap stocks
(PERSISTENT: 17.4pp range vs RELIANCE: 6.1pp). This suggests mid-cap stocks
have exploitable inefficiencies in specific market regimes, but a static model
averages them out. Large-cap stocks like Reliance behave consistently with the
Efficient Market Hypothesis — technical indicators alone have little predictive
power on heavily-covered stocks.

## Key Findings
- Volume is the most important predictive feature (9.09% importance)
- Volatility and Bollinger Band Width outperform price-based features
- Model shows asymmetric performance — better at identifying DOWN days (61%) than UP days (44%)
- This defensive bias translates to real value: max drawdown reduced by 19.68pp on PERSISTENT.NS
- Logistic Regression underperformed below random chance — confirming stock direction is a non-linear problem
- Efficient Market Hypothesis limits accuracy on large-caps — RELIANCE walk-forward average was 48.3%
- Model has genuine predictive power on mid-cap technology stocks — PERSISTENT.NS generated +7.43% return vs -3.86% buy and hold
- Accuracy alone is a misleading metric — what matters is whether the model is right on the high-impact days
- Sentiment analysis strengthens signals when aligned with model prediction
- Walk-forward validation reveals the model is regime-dependent — it finds edge in specific market conditions but cannot sustain it uniformly
- Short selling tested but reverted — added risk without consistent improvement on large-cap stocks
- PERSISTENT.NS is the only stock where all three metrics improved: positive return, positive Sharpe (0.721), and largest drawdown reduction (19.68pp)

## Confusion Matrix Insights
- True Negatives (DOWN correctly predicted): 58/95 = 61%
- True Positives (UP correctly predicted): 39/89 = 44%
- Model has defensive bias — better at avoiding losses than catching gains

## Experiments Conducted
| Experiment | Result |
|------------|--------|
| 5-day prediction horizon | Lower strategy returns |
| 10-year data period | Regime change hurt performance |
| Threshold filtering (55%) | Reduced trades, lower returns |
| Ensemble (all 3 models) | Underperformed standalone RF |
| Nifty 50 index | Buy & Hold outperformed in bull market |
| Walk-forward validation (5 folds) | Confirmed regime-dependence; 46–57% per fold |
| Short selling on DOWN signals | Reduced performance — reverted to cash strategy |
| Sharpe ratio + max drawdown | Max drawdown reduction confirmed as primary value metric |

## Web Application
Built with Streamlit — enter any NSE ticker for live predictions.

**Features:**
- Dynamic model training per stock — no single pre-trained model
- `@st.cache_data` caching — data and model are cached for 1 hour, so repeated
  predictions on the same ticker return instantly without re-downloading or retraining
- Input validation — detects missing `.NS`/`.BO` suffix and suggests the correct ticker
- STRONG/WEAK BUY or SELL signal with adjusted confidence
- Real-time news sentiment from Yahoo Finance via yfinance
- Walk-forward validation results displayed per fold
- Price chart with moving averages
- RSI indicator chart
- Current technical indicator values
- Strategy performance vs buy and hold

**Run locally:**
```bash
pip install -r requirements.txt
streamlit run app.py
```

**Note:** Run after 3:30 PM IST for accurate next-day predictions.

## Engineering Improvements
The following improvements were made beyond the initial research prototype:

- **Caching** — `@st.cache_data(ttl=3600)` wraps data download and model training,
  eliminating redundant computation on repeated predictions for the same ticker.
- **Input validation** — ticker input is normalised (stripped, uppercased) and
  validated for the `.NS`/`.BO` suffix with an auto-correct suggestion.
- **Walk-forward validation** — added to `src/model.py` to replace reliance on
  a single train/test split accuracy number.
- **Type hints** — all `src/` functions are fully annotated for readability and
  maintainability.
- **Centralised config** — `src/config.py` holds `FEATURES` and `MODEL_PARAMS`
  as single sources of truth, eliminating duplicate definitions across modules.

## Limitations
- Technical indicators based on historical patterns only
- Sentiment analysis limited to English language news
- Model performance varies with market regime changes — walk-forward validation
  confirms accuracy ranges from 46% to 57% depending on the period
- Transaction costs not accounted for in strategy returns
- Not suitable for live trading without proper risk management

## Future Work
- ~~Add news sentiment analysis~~ ✅ Completed
- ~~Walk-forward validation~~ ✅ Completed
- ~~Sharpe ratio and maximum drawdown metrics~~ ✅ Completed
- Include fundamental indicators (P/E ratio, EPS)
- Replace raw OHLCV price levels with normalised returns and ratios
- Implement regime detection to activate model only in high-confidence periods
- Expand to Hindi financial news sources
- Deploy to Streamlit Cloud for public access

## Author
Samarth Patel
github.com/samarthpatel03