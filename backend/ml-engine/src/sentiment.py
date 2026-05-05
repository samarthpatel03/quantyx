import yfinance as yf
from typing import Tuple, List
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def get_news_sentiment(
    ticker: str,
    api_key: str = None,
    days: int = 30
) -> Tuple[float, List[dict]]:
    """
    Fetch stock specific news from yfinance and calculate sentiment score.
    Returns average sentiment score between -1 and +1.
    """
    try:
        stock = yf.Ticker(ticker)
        news = stock.news
        
        if not news:
            return 0.0, []
        
        headlines = []
        scores = []
        
        for article in news[:20]:
            # Extract title from nested content structure
            content = article.get('content', {})
            title = content.get('title', '')
            published = content.get('pubDate', 'N/A')
            
            if title:
                score = analyzer.polarity_scores(title)
                scores.append(score['compound'])
                headlines.append({
                    'headline': title,
                    'sentiment': score['compound'],
                    'published': published
                })
        
        avg_sentiment = sum(scores) / len(scores) if scores else 0.0
        return avg_sentiment, headlines
    
    except Exception as e:
        print(f"Error fetching news: {e}")
        return 0.0, []


def interpret_sentiment(score: float) -> str:
    """Convert sentiment score to human readable label."""
    if score >= 0.05:
        return "Positive 😊"
    elif score <= -0.05:
        return "Negative 😟"
    else:
        return "Neutral 😐"