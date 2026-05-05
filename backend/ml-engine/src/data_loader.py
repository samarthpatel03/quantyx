import pandas as pd
import yfinance as yf

def download_stock_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Download OHLCV data for a given ticker and date range."""
    df = yf.download(ticker, start=start_date, end=end_date, auto_adjust=True)
    df.columns = df.columns.droplevel(1)
    return df