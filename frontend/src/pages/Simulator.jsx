import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Search, X } from "lucide-react";
import { usePaperPortfolio } from "../features/simulator/usePaperPortfolio";
import { BUY, SELL } from "../constants/trading";
import { fetchCurrentPrice, fetchQuotes, normalizeSymbol } from "../services/apiClient";
import { formatPrice } from "../lib/market/priceUtils";
import { NSE_STOCKS } from "@/lib/nseStocks";
import { DEFAULT_SYMBOLS } from "@/lib/api";

export default function Simulator() {
  const { portfolio, summary, error, trade, resetPortfolio, updatePrices, currentPrices } = usePaperPortfolio();

  // Watchlist state
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem("quantyx_watchlist");
      return saved ? JSON.parse(saved).map(normalizeSymbol).filter(Boolean) : DEFAULT_SYMBOLS.slice(0, 8);
    } catch {
      return DEFAULT_SYMBOLS.slice(0, 8);
    }
  });

  const [watchlistQuotes, setWatchlistQuotes] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Trade form state
  const [tradeForm, setTradeForm] = useState({
    type: BUY,
    symbol: "",
    quantity: "",
    price: "",
  });

  const [priceLoading, setPriceLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem("quantyx_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // Fetch watchlist quotes
  useEffect(() => {
    const fetchWatchlistData = async () => {
      try {
        const quotes = await fetchQuotes(watchlist);
        setWatchlistQuotes(quotes);
      } catch (err) {
        console.error("Failed to fetch watchlist:", err);
      }
    };

    fetchWatchlistData();
    const interval = setInterval(fetchWatchlistData, 30000);
    return () => clearInterval(interval);
  }, [watchlist]);

  // Fetch prices for positions
  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = Object.keys(portfolio.positions);
      if (symbols.length === 0) return;

      const prices = {};
      for (const symbol of symbols) {
        try {
          const price = await fetchCurrentPrice(symbol);
          if (price) prices[symbol] = price;
        } catch (err) {
          console.error(`Failed to fetch price for ${symbol}:`, err);
        }
      }
      updatePrices(prices);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [portfolio.positions, updatePrices]);

  const handleInputChange = (field, value) => {
    setTradeForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
  };

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setTradeForm((prev) => ({
      ...prev,
      symbol: stock.symbol,
      price: stock.price?.toString() || "",
    }));
    setShowSearch(false);
  };

  const handleFetchPrice = async () => {
    if (!tradeForm.symbol) return;

    setPriceLoading(true);
    try {
      const price = await fetchCurrentPrice(tradeForm.symbol);
      if (price) {
        handleInputChange("price", price.toString());
      }
    } catch (err) {
      console.error("Failed to fetch price:", err);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleTrade = () => {
    const { type, symbol, quantity, price } = tradeForm;

    if (!symbol.trim()) return;

    const qty = parseInt(quantity, 10);
    const prc = parseFloat(price);

    if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc <= 0) return;

    const success = trade({
      type,
      symbol: symbol.trim().toUpperCase(),
      quantity: qty,
      price: prc,
    });

    if (success) {
      setSuccessMessage(`${type} order executed successfully!`);
      setTradeForm({
        type: BUY,
        symbol: "",
        quantity: "",
        price: "",
      });
      setSelectedStock(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset your portfolio? This cannot be undone.")) {
      resetPortfolio();
      setSuccessMessage("Portfolio reset successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist((prev) => [...prev, symbol]);
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist((prev) => prev.filter((s) => s !== symbol));
  };

  const filteredStocks = NSE_STOCKS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Watchlist Sidebar (Desktop) ─────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border/50 bg-card/20 h-full overflow-hidden">
        <div className="p-3 border-b border-border/30">
          <h2 className="font-semibold text-sm mb-2">Watchlist</h2>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-full px-3 py-2 text-xs bg-muted/40 hover:bg-muted/60 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-3 h-3" />
            Add Stock
          </button>
        </div>

        {showSearch && (
          <div className="p-2 border-b border-border/30">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stocks..."
              className="w-full px-3 py-1.5 rounded-lg bg-muted/40 border border-border/30 text-xs focus:outline-none focus:border-primary/40"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {showSearch ? (
            <div className="p-2 space-y-1">
              {filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    addToWatchlist(stock.symbol);
                    setSearch("");
                    setShowSearch(false);
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-muted/30 rounded text-xs transition-colors"
                >
                  <div className="font-mono font-semibold">{stock.symbol}</div>
                  <div className="text-muted-foreground truncate">{stock.name}</div>
                </button>
              ))}
            </div>
          ) : (
            watchlistQuotes.map((stock) => (
              <WatchlistItem
                key={stock.symbol}
                stock={stock}
                isSelected={selectedStock?.symbol === stock.symbol}
                onSelect={() => handleStockSelect(stock)}
                onRemove={() => removeFromWatchlist(stock.symbol)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Paper Trading</h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                Practice with ₹1,00,000 virtual cash
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-xs sm:text-sm self-start sm:self-auto"
            >
              Reset Portfolio
            </button>
          </div>

          {/* Portfolio Summary */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Portfolio Summary</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <SummaryCard
                label="Total Value"
                value={formatPrice(summary.totalValue)}
                change={summary.totalReturnPercent}
              />
              <SummaryCard label="Cash" value={formatPrice(summary.cash)} />
              <SummaryCard label="Positions" value={formatPrice(summary.positionsValue)} />
              <SummaryCard
                label="Total P&L"
                value={formatPrice(summary.totalPnL)}
                change={summary.totalReturnPercent}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
              <InfoItem label="Unrealized" value={formatPrice(summary.unrealizedPnL)} />
              <InfoItem label="Realized" value={formatPrice(summary.realizedPnL)} />
              <InfoItem label="Positions" value={summary.positionCount} />
            </div>
          </div>

          {/* Trade Form */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Place Trade</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-xs sm:text-sm">
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleInputChange("type", BUY)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                      tradeForm.type === BUY
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => handleInputChange("type", SELL)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
                      tradeForm.type === SELL
                        ? "bg-red-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              {/* Symbol */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Symbol</label>
                <input
                  type="text"
                  placeholder="e.g., RELIANCE.NS"
                  value={tradeForm.symbol}
                  onChange={(e) => handleInputChange("symbol", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  placeholder="10"
                  min="1"
                  step="1"
                  value={tradeForm.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">Price</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="100.00"
                    min="0"
                    step="0.01"
                    value={tradeForm.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleFetchPrice}
                    disabled={priceLoading || !tradeForm.symbol}
                    className="px-3 sm:px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 text-sm"
                  >
                    {priceLoading ? "..." : "Fetch"}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleTrade}
              className="w-full mt-4 sm:mt-6 px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base"
            >
              Execute Trade
            </button>
          </div>

          {/* Positions */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Open Positions</h2>
            {Object.keys(portfolio.positions).length === 0 ? (
              <p className="text-muted-foreground text-xs sm:text-sm text-center py-6 sm:py-8">
                No open positions. Start trading to build your portfolio!
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="text-left border-b border-border">
                      <tr>
                        <th className="pb-2 sm:pb-3 font-medium">Symbol</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right">Qty</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right hidden sm:table-cell">Avg</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right hidden sm:table-cell">Current</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right">P&L</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right">P&L %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(portfolio.positions).map(([symbol, position]) => {
                        const currentPrice = currentPrices[symbol] || position.avgPrice;
                        const pnl = (currentPrice - position.avgPrice) * position.quantity;
                        const pnlPercent =
                          ((currentPrice - position.avgPrice) / position.avgPrice) * 100;

                        return (
                          <tr key={symbol} className="border-b border-border/50">
                            <td className="py-2 sm:py-3 font-medium">{symbol}</td>
                            <td className="py-2 sm:py-3 text-right">{position.quantity}</td>
                            <td className="py-2 sm:py-3 text-right hidden sm:table-cell">
                              {formatPrice(position.avgPrice)}
                            </td>
                            <td className="py-2 sm:py-3 text-right hidden sm:table-cell">
                              {formatPrice(currentPrice)}
                            </td>
                            <td
                              className={`py-2 sm:py-3 text-right ${
                                pnl >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {formatPrice(pnl)}
                            </td>
                            <td
                              className={`py-2 sm:py-3 text-right ${
                                pnlPercent >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {pnlPercent >= 0 ? "+" : ""}
                              {pnlPercent.toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Trade History */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Trade History</h2>
            {portfolio.trades.length === 0 ? (
              <p className="text-muted-foreground text-xs sm:text-sm text-center py-6 sm:py-8">
                No trades yet. Your trading history will appear here.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="text-left border-b border-border">
                      <tr>
                        <th className="pb-2 sm:pb-3 font-medium">Time</th>
                        <th className="pb-2 sm:pb-3 font-medium">Type</th>
                        <th className="pb-2 sm:pb-3 font-medium">Symbol</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right">Qty</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right hidden sm:table-cell">Price</th>
                        <th className="pb-2 sm:pb-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...portfolio.trades].reverse().map((trade) => (
                        <tr key={trade.id} className="border-b border-border/50">
                          <td className="py-2 sm:py-3 text-muted-foreground whitespace-nowrap">
                            {new Date(trade.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-2 sm:py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                trade.type === BUY
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                              }`}
                            >
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 font-medium">{trade.symbol}</td>
                          <td className="py-2 sm:py-3 text-right">{trade.quantity}</td>
                          <td className="py-2 sm:py-3 text-right hidden sm:table-cell">
                            {formatPrice(trade.price)}
                          </td>
                          <td className="py-2 sm:py-3 text-right">{formatPrice(trade.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function SummaryCard({ label, value, change }) {
  return (
    <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg sm:text-2xl font-bold">{value}</p>
      {change !== undefined && (
        <p className={`text-xs sm:text-sm mt-1 ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </p>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm sm:text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function WatchlistItem({ stock, isSelected, onSelect, onRemove }) {
  const up = stock.change >= 0;
  return (
    <div
      className={`relative group border-b border-border/20 transition-all ${
        isSelected ? "bg-muted/40 border-l-2 border-l-primary" : "hover:bg-muted/20"
      }`}
    >
      <button onClick={onSelect} className="w-full text-left px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-semibold">{stock.symbol}</span>
          {up ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="font-mono text-xs text-muted-foreground">
            ₹{stock.price?.toLocaleString("en-IN")}
          </span>
          <span className={`font-mono text-xs ${up ? "text-green-500" : "text-red-500"}`}>
            {up ? "+" : ""}
            {stock.changePercent}%
          </span>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-opacity"
      >
        <X className="w-3 h-3 text-red-500" />
      </button>
    </div>
  );
}
