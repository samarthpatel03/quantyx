import { executeTrade as coreExecuteTrade, getPortfolioSummary } from "./paperPortfolio.js";
import { BUY, SELL } from "../../constants/trading.js";

export function executeTrade(portfolio, tradeParams) {
  return coreExecuteTrade(portfolio, tradeParams);
}

export function buyStock(portfolio, symbol, quantity, price) {
  return executeTrade(portfolio, { type: BUY, symbol, quantity, price });
}

export function sellStock(portfolio, symbol, quantity, price) {
  return executeTrade(portfolio, { type: SELL, symbol, quantity, price });
}

export function getFormattedSummary(portfolio, currentPrices = {}) {
  const summary = getPortfolioSummary(portfolio, currentPrices);
  return {
    ...summary,
    totalValueFormatted: `₹${summary.totalValue.toFixed(2)}`,
    cashFormatted: `₹${summary.cash.toFixed(2)}`,
    unrealizedPnLFormatted: `₹${summary.unrealizedPnL.toFixed(2)}`,
    realizedPnLFormatted: `₹${summary.realizedPnL.toFixed(2)}`,
    totalPnLFormatted: `₹${summary.totalPnL.toFixed(2)}`,
  };
}
