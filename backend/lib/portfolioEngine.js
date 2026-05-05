// Trading constants
const BUY = "BUY";
const SELL = "SELL";

export { BUY, SELL };

export function createPortfolio({ userId, initialCash }) {
  if (typeof initialCash !== "number" || initialCash < 0) {
    throw new Error("initialCash must be a non-negative number");
  }
  return {
    userId,
    cash: initialCash,
    positions: {},
    trades: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function executeTrade(portfolio, trade) {
  const validationError = validateTrade(portfolio, trade);
  if (validationError) return { error: validationError, portfolio };

  const { type, symbol, quantity, price } = trade;
  if (type === BUY) return executeBuy(portfolio, symbol, quantity, price);
  else if (type === SELL) return executeSell(portfolio, symbol, quantity, price);
  return { error: "Invalid trade type", portfolio };
}

function validateTrade(portfolio, trade) {
  const { type, symbol, quantity, price } = trade;
  if (!type || !symbol) return "Trade must have type and symbol";
  if (!isValidSymbol(symbol)) return "Invalid symbol format. Use format like 'RELIANCE.NS'";
  if (typeof quantity !== "number" || quantity <= 0 || !Number.isInteger(quantity)) {
    return "Quantity must be a positive integer";
  }
  if (typeof price !== "number" || price <= 0) return "Price must be a positive number";

  if (type === BUY) {
    const totalCost = quantity * price;
    if (portfolio.cash < totalCost) {
      return `Insufficient cash. Need ₹${totalCost.toFixed(2)}, have ₹${portfolio.cash.toFixed(2)}`;
    }
  } else if (type === SELL) {
    const position = portfolio.positions[symbol];
    if (!position || position.quantity < quantity) {
      const available = position ? position.quantity : 0;
      return `Insufficient shares. Trying to sell ${quantity}, have ${available}`;
    }
  }
  return null;
}

function isValidSymbol(symbol) {
  return (
    typeof symbol === "string" &&
    symbol.length > 0 &&
    (symbol.endsWith(".NS") || symbol.endsWith(".BO") || symbol.startsWith("^"))
  );
}

function executeBuy(portfolio, symbol, quantity, price) {
  const totalCost = quantity * price;
  const currentPosition = portfolio.positions[symbol];
  const newQuantity = (currentPosition?.quantity || 0) + quantity;
  const currentValue = (currentPosition?.quantity || 0) * (currentPosition?.avgPrice || 0);
  const newAvgPrice = (currentValue + totalCost) / newQuantity;

  const tradeRecord = {
    id: generateTradeId(),
    type: BUY,
    symbol,
    quantity,
    price,
    total: totalCost,
    timestamp: Date.now(),
  };

  return {
    portfolio: {
      ...portfolio,
      cash: portfolio.cash - totalCost,
      positions: {
        ...portfolio.positions,
        [symbol]: { symbol, quantity: newQuantity, avgPrice: newAvgPrice },
      },
      trades: [...portfolio.trades, tradeRecord],
      updatedAt: Date.now(),
    },
  };
}

function executeSell(portfolio, symbol, quantity, price) {
  const totalRevenue = quantity * price;
  const currentPosition = portfolio.positions[symbol];
  const newQuantity = currentPosition.quantity - quantity;

  const tradeRecord = {
    id: generateTradeId(),
    type: SELL,
    symbol,
    quantity,
    price,
    total: totalRevenue,
    realizedPnL: (price - currentPosition.avgPrice) * quantity,
    timestamp: Date.now(),
  };

  const newPositions = { ...portfolio.positions };
  if (newQuantity === 0) {
    delete newPositions[symbol];
  } else {
    newPositions[symbol] = { ...currentPosition, quantity: newQuantity };
  }

  return {
    portfolio: {
      ...portfolio,
      cash: portfolio.cash + totalRevenue,
      positions: newPositions,
      trades: [...portfolio.trades, tradeRecord],
      updatedAt: Date.now(),
    },
  };
}

export function getPortfolioValue(portfolio, currentPrices = {}) {
  let positionsValue = 0;
  for (const [symbol, position] of Object.entries(portfolio.positions)) {
    const currentPrice = currentPrices[symbol] || position.avgPrice;
    positionsValue += position.quantity * currentPrice;
  }
  return portfolio.cash + positionsValue;
}

export function getUnrealizedPnL(portfolio, currentPrices = {}) {
  const breakdown = {};
  let total = 0;

  for (const [symbol, position] of Object.entries(portfolio.positions)) {
    const currentPrice = currentPrices[symbol] || position.avgPrice;
    const pnl = (currentPrice - position.avgPrice) * position.quantity;
    const pnlPercent = ((currentPrice - position.avgPrice) / position.avgPrice) * 100;

    breakdown[symbol] = {
      pnl,
      pnlPercent,
      currentValue: currentPrice * position.quantity,
      investedValue: position.avgPrice * position.quantity,
    };
    total += pnl;
  }
  return { total, breakdown };
}

export function getRealizedPnL(portfolio) {
  return portfolio.trades
    .filter((trade) => trade.type === SELL)
    .reduce((sum, trade) => sum + (trade.realizedPnL || 0), 0);
}

function generateTradeId() {
  return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getPortfolioSummary(portfolio, currentPrices = {}) {
  const totalValue = getPortfolioValue(portfolio, currentPrices);
  const unrealizedPnL = getUnrealizedPnL(portfolio, currentPrices);
  const realizedPnL = getRealizedPnL(portfolio);
  
  const initialValue = portfolio.trades.length > 0
    ? portfolio.trades[0].total + portfolio.cash
    : portfolio.cash;

  const totalReturn = totalValue - initialValue;
  const totalReturnPercent = initialValue > 0 ? (totalReturn / initialValue) * 100 : 0;

  return {
    totalValue,
    cash: portfolio.cash,
    positionsValue: totalValue - portfolio.cash,
    unrealizedPnL: unrealizedPnL.total,
    realizedPnL,
    totalPnL: unrealizedPnL.total + realizedPnL,
    totalReturn,
    totalReturnPercent,
    positionCount: Object.keys(portfolio.positions).length,
    tradeCount: portfolio.trades.length,
  };
}
