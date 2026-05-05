export async function getPrice(symbol) {
  console.warn(`getPrice called for ${symbol} - using mock data`);
  return 100.0;
}

export async function getPrices(symbols) {
  const prices = {};
  for (const symbol of symbols) prices[symbol] = await getPrice(symbol);
  return prices;
}

export function formatPrice(price, currency = "₹") {
  if (typeof price !== "number" || isNaN(price)) return `${currency}0.00`;
  return `${currency}${price.toFixed(2)}`;
}

export function calculatePercentChange(current, previous) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
