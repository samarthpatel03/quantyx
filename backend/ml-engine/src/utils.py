import matplotlib.pyplot as plt
import numpy as np


def plot_price_with_sma(df, ticker):
    """Plot closing price with SMA 20 and SMA 50."""
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.plot(df['Close'], label='Close Price', alpha=0.7)
    ax.plot(df['SMA_20'], label='SMA 20', alpha=0.8)
    ax.plot(df['SMA_50'], label='SMA 50', alpha=0.8)
    ax.set_title(f'{ticker} — Price with Moving Averages')
    ax.set_xlabel('Date')
    ax.set_ylabel('Price')
    ax.legend()
    return fig


def plot_rsi(df, ticker):
    """Plot RSI indicator with overbought/oversold lines."""
    fig, ax = plt.subplots(figsize=(14, 3))
    ax.plot(df['RSI'], color='purple', label='RSI')
    ax.axhline(70, color='red', linestyle='--', label='Overbought (70)')
    ax.axhline(30, color='green', linestyle='--', label='Oversold (30)')
    ax.set_title(f'{ticker} — RSI')
    ax.legend()
    return fig


def plot_strategy_returns(cumulative_market, cumulative_strategy):
    """Plot ML strategy vs buy and hold returns."""
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.plot(cumulative_market, label='Buy & Hold', color='blue')
    ax.plot(cumulative_strategy, label='ML Strategy', color='green')
    ax.set_title('Strategy Returns — ML Model vs Buy & Hold')
    ax.set_xlabel('Trading Days')
    ax.set_ylabel('Cumulative Return')
    ax.legend()
    return fig


def plot_feature_importance(model, features):
    """Plot Random Forest feature importance."""
    importance = model.feature_importances_
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(features, importance)
    ax.set_xlabel('Importance Score')
    ax.set_title('Random Forest — Feature Importance')
    ax.invert_yaxis()
    return fig