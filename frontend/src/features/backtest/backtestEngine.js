export function runBacktest(config) {
  console.log("Backtesting engine - coming soon");
  return {
    trades: [],
    finalValue: config.initialCash,
    totalReturn: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    winRate: 0,
  };
}

export function calculateMetrics(results) {
  return {
    totalReturn: 0,
    annualizedReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
  };
}
