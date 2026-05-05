import { useState } from "react";
import { BookOpen, AlertTriangle, TrendingUp, Shield, Target, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

function ExpandableSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg text-left">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 pt-2 space-y-3 border-t border-border/50">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  return (
    <div className="min-h-full overflow-auto p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <BookOpen className="w-6 h-6" />
            <h1 className="text-3xl font-bold">Learn to Invest</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Simple guides to understanding the market and managing risks
          </p>
        </div>

        {/* Risk Warning */}
        <div className="glass rounded-xl p-6 border-2 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">⚠️ Important Risk Disclaimer</h3>
              <p className="text-sm leading-relaxed">
                Stock market investing carries <strong>real financial risk</strong>. You can lose money. 
                Never invest more than you can afford to lose. This platform is for <strong>educational purposes</strong> only.
                Always do your own research and consult a certified financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Learning Sections */}
        <div className="space-y-4">
          
          {/* Stock Market Basics */}
          <ExpandableSection title="What is the Stock Market?" icon={TrendingUp} defaultOpen={true}>
            <p className="text-sm leading-relaxed">
              The stock market is where shares of publicly traded companies are bought and sold. 
              When you buy a stock, you own a small piece of that company.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>NSE (National Stock Exchange):</strong> India's largest stock exchange</p>
              <p><strong>BSE (Bombay Stock Exchange):</strong> Asia's oldest stock exchange</p>
              <p><strong>NIFTY 50:</strong> Index tracking 50 largest companies on NSE</p>
              <p><strong>SENSEX:</strong> Index tracking 30 largest companies on BSE</p>
            </div>
          </ExpandableSection>

          {/* Market Timings */}
          <ExpandableSection title="Market Hours & Trading" icon={Target}>
            <div className="space-y-2 text-sm">
              <p><strong>Trading Hours:</strong> 9:15 AM - 3:30 PM (Mon-Fri, IST)</p>
              <p><strong>Pre-Market:</strong> 9:00 AM - 9:15 AM</p>
              <p><strong>Post-Market:</strong> 3:40 PM - 4:00 PM</p>
              <p className="text-muted-foreground mt-3">
                Markets are closed on weekends and public holidays. Price movements during these times 
                are reflected when the market reopens.
              </p>
            </div>
          </ExpandableSection>

          {/* Types of Orders */}
          <ExpandableSection title="Understanding Orders" icon={Lightbulb}>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm">Market Order</p>
                <p className="text-sm text-muted-foreground">Buy/sell immediately at current market price</p>
              </div>
              <div>
                <p className="font-semibold text-sm">Limit Order</p>
                <p className="text-sm text-muted-foreground">Buy/sell only at a specific price or better</p>
              </div>
              <div>
                <p className="font-semibold text-sm">Stop-Loss Order</p>
                <p className="text-sm text-muted-foreground">
                  Automatically sell when price drops to a certain level (limits losses)
                </p>
              </div>
            </div>
          </ExpandableSection>

          {/* Risk Management */}
          <ExpandableSection title="Risk Management Basics" icon={Shield}>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">1. Diversification</p>
                <p className="text-muted-foreground">
                  Don't put all money in one stock. Spread across sectors (IT, Banking, Pharma, etc.)
                </p>
              </div>
              <div>
                <p className="font-semibold">2. Position Sizing</p>
                <p className="text-muted-foreground">
                  Don't risk more than 1-2% of your portfolio on a single trade
                </p>
              </div>
              <div>
                <p className="font-semibold">3. Use Stop-Losses</p>
                <p className="text-muted-foreground">
                  Decide maximum acceptable loss before entering a trade
                </p>
              </div>
              <div>
                <p className="font-semibold">4. Avoid Leverage (F&O)</p>
                <p className="text-muted-foreground">
                  Futures & Options can amplify losses. Not recommended for beginners.
                </p>
              </div>
            </div>
          </ExpandableSection>

          {/* Common Mistakes */}
          <ExpandableSection title="Common Beginner Mistakes" icon={AlertTriangle}>
            <div className="space-y-2 text-sm">
              <p>❌ <strong>Trading on tips/rumors</strong> — Do your own research</p>
              <p>❌ <strong>Panic selling</strong> — Markets fluctuate; have a plan</p>
              <p>❌ <strong>Chasing hot stocks</strong> — By the time you hear, it's often too late</p>
              <p>❌ <strong>No stop-loss</strong> — Always protect your downside</p>
              <p>❌ <strong>Overtrading</strong> — More trades = more fees + taxes</p>
              <p>❌ <strong>Investing borrowed money</strong> — Only invest money you can afford to lose</p>
            </div>
          </ExpandableSection>

          {/* Key Terms */}
          <ExpandableSection title="Essential Terms to Know" icon={BookOpen}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-semibold">Bull Market</p>
                <p className="text-muted-foreground text-xs">Prices rising, optimism high</p>
              </div>
              <div>
                <p className="font-semibold">Bear Market</p>
                <p className="text-muted-foreground text-xs">Prices falling, pessimism high</p>
              </div>
              <div>
                <p className="font-semibold">Volume</p>
                <p className="text-muted-foreground text-xs">Number of shares traded</p>
              </div>
              <div>
                <p className="font-semibold">Market Cap</p>
                <p className="text-muted-foreground text-xs">Total value of company's shares</p>
              </div>
              <div>
                <p className="font-semibold">P/E Ratio</p>
                <p className="text-muted-foreground text-xs">Price-to-Earnings ratio (valuation)</p>
              </div>
              <div>
                <p className="font-semibold">Dividend</p>
                <p className="text-muted-foreground text-xs">Profit shared with shareholders</p>
              </div>
            </div>
          </ExpandableSection>

          {/* Next Steps */}
          <ExpandableSection title="Getting Started: Next Steps" icon={Target}>
            <div className="space-y-3 text-sm">
              <p>✅ <strong>Open a Demat Account</strong> — Required to hold shares (Zerodha, Groww, Upstox, etc.)</p>
              <p>✅ <strong>Start Small</strong> — Begin with ₹5,000-10,000 to learn</p>
              <p>✅ <strong>Use Paper Trading</strong> — Practice with Quantyx's simulator before real money</p>
              <p>✅ <strong>Learn Fundamentals</strong> — Understand what you're investing in</p>
              <p>✅ <strong>Be Patient</strong> — Wealth building takes time</p>
            </div>
          </ExpandableSection>

        </div>

        {/* Resources */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Recommended Learning Resources
          </h3>
          <div className="space-y-2 text-sm">
            <p>📚 <strong>Zerodha Varsity</strong> — Free comprehensive modules on markets</p>
            <p>📊 <strong>NSE India</strong> — Official NSE educational content</p>
            <p>📺 <strong>SEBI Investor Education</strong> — Regulatory body's learning portal</p>
            <p className="text-muted-foreground text-xs mt-3">
              These are external resources. Quantyx does not endorse specific platforms.
            </p>
          </div>
        </div>

        {/* Final Warning */}
        <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
          <p>
            💡 Remember: Knowledge is your best investment. Learn continuously, trade cautiously, 
            and never invest money you cannot afford to lose.
          </p>
        </div>

      </div>
    </div>
  );
}
