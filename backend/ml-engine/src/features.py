import pandas as pd
import numpy as np

def calculate_features(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate all technical indicators from OHLCV data."""
    
    df = df.copy()
    
    # Moving Averages
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    
    # RSI
    daily_change = df['Close'].diff()
    gain = daily_change.clip(lower=0)
    loss = daily_change.clip(upper=0).abs()
    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()
    RS = avg_gain / avg_loss
    df['RSI'] = 100 - (100 / (1 + RS))
    
    # MACD
    ema_12 = df['Close'].ewm(span=12).mean()
    ema_26 = df['Close'].ewm(span=26).mean()
    df['MACD'] = ema_12 - ema_26
    df['Signal_Line'] = df['MACD'].ewm(span=9).mean()
    df['MACD_Histogram'] = df['MACD'] - df['Signal_Line']
    
    # Bollinger Bands
    std_20 = df['Close'].rolling(20).std()
    df['bb_Width'] = (4 * std_20) / df['SMA_20']
    
    # Momentum and Volatility
    df['Momentum'] = df['Close'] - df['Close'].shift(10)
    df['Volatility'] = df['Close'].pct_change().rolling(20).std()
    
    # Target Variable
    df['Target'] = (df['Close'].shift(-1) > df['Close']).astype(int)
    
    # Drop NaN rows
    df.dropna(inplace=True)
    
    return df
