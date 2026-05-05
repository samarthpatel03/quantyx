# Central config — all constants live here

FEATURES = [
    'Close', 'High', 'Low', 'Open', 'Volume',
    'SMA_20', 'SMA_50', 'RSI', 'MACD',
    'Signal_Line', 'MACD_Histogram', 'bb_Width',
    'Momentum', 'Volatility'
]

MODEL_PARAMS = {
    'n_estimators': 100,
    'random_state': 42
}

DATA_PERIOD_DAYS = 1095   # 3 years
TRAIN_SPLIT_RATIO = 0.80