import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BarChart3, FlaskConical, LineChart, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  { icon:BarChart3,  title:"The Simulator",  desc:"Risk-free paper trading with real-time NSE/BSE data. Perfect your strategy before risking capital.", accent:"mint" },
  { icon:LineChart,  title:"The Analyzer",   desc:"Deep technical insights for Indian stocks — RSI, MACD, moving averages, and pivot points at a glance.", accent:"purple" },
  { icon:FlaskConical,title:"The Quant Lab", desc:"Backtesting engine for developers. Write strategies, test against historical data, iterate fast.", accent:"mint" },
];

const tickers = ["RELIANCE 2,847.50 +1.2%","TCS 3,942.30 -0.4%","HDFCBANK 1,678.90 +0.8%","INFY 1,456.20 +2.1%","ICICIBANK 1,089.70 +0.3%","TATAMOTORS 745.80 -1.5%"];

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background grid-pattern relative overflow-hidden">
      <div className="pointer-events-none absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-100px] right-[-200px] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px]" />

      {/* Header */}
      <motion.header initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <span className="text-xl font-bold text-gradient-mint tracking-tight">Quantyx</span>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={()=>navigate("/login")} className="hidden sm:flex h-9 px-4 rounded-lg glass text-sm font-medium text-muted-foreground hover:text-foreground transition-colors items-center">Login</button>
            <button className="md:hidden p-2 rounded-lg glass text-muted-foreground hover:text-foreground" onClick={()=>setMenuOpen(!menuOpen)}>
              {menuOpen?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} transition={{duration:0.2}}
              className="md:hidden border-t border-border/50 overflow-hidden">
              <div className="flex flex-col px-4 py-4 gap-1 text-sm text-muted-foreground">
                <a href="#features" className="hover:text-foreground py-2 transition-colors" onClick={()=>setMenuOpen(false)}>Features</a>
                <a href="#" className="hover:text-foreground py-2 transition-colors">Pricing</a>
                <a href="#" className="hover:text-foreground py-2 transition-colors">Docs</a>
                <button onClick={()=>navigate("/login")} className="w-full mt-2 h-9 glass rounded-lg text-sm font-medium">Login</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-16 sm:pb-24 flex flex-col items-center text-center relative z-10">
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.2}}>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-6 sm:mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            Now tracking NSE &amp; BSE in real-time
          </div>
        </motion.div>

        <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.3}}
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl">
          Master the Markets.{" "}<span className="text-gradient-mint">Code the Edge.</span>
        </motion.h1>

        <motion.p initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.45}}
          className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed px-2">
          Quantyx gives you institutional-grade tools for the Indian stock market — technical analysis, paper trading, and quantitative backtesting in one platform.
        </motion.p>

        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.6}}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0">
          <button onClick={()=>navigate("/login")} className="group flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity w-full sm:w-auto">
            Start Trading <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="h-12 px-8 rounded-xl glass text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full sm:w-auto">
            Watch Demo
          </button>
        </motion.div>

        {/* Ticker */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1,duration:1}}
          className="mt-12 sm:mt-20 w-full max-w-3xl overflow-hidden glass rounded-xl py-3">
          <div className="flex animate-ticker-scroll whitespace-nowrap gap-8 font-mono text-xs text-muted-foreground">
            {[...tickers,...tickers].map((t,i)=>(
              <span key={i} className={t.includes("+")?"text-primary":"text-destructive"}>{t}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 sm:px-6 pb-20 sm:pb-32 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f,i)=>(
            <motion.div key={f.title} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
              transition={{duration:0.6,delay:i*0.15}}
              className={`glass rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.02] ${f.accent==="mint"?"hover:glow-mint":"hover:glow-purple"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.accent==="mint"?"bg-primary/10 text-primary":"bg-secondary/10 text-secondary"}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2026 Quantyx. All rights reserved.</span>
          <span className="font-mono">v3.0.0</span>
        </div>
      </footer>
    </div>
  );
}
