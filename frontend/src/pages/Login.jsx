import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Github, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import CandlestickAnimation from "@/components/CandlestickAnimation";

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left panel - desktop */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8}}
        className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute inset-0 grid-pattern" />
        <CandlestickAnimation />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-2xl font-bold leading-tight">
            Where <span className="text-gradient-mint">data</span> meets <span className="text-gradient-purple">intuition</span>
          </p>
          <p className="text-muted-foreground text-sm mt-2">Join thousands of traders analyzing the Indian markets with Quantyx.</p>
        </div>
      </motion.div>

      {/* Mobile banner */}
      <div className="lg:hidden relative overflow-hidden h-40 flex items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="relative text-center px-6">
          <p className="text-xl font-bold">Where <span className="text-gradient-mint">data</span> meets <span className="text-gradient-purple">intuition</span></p>
          <p className="text-muted-foreground text-xs mt-1">Institutional-grade tools for the Indian stock market.</p>
        </div>
      </div>

      {/* Right panel - form */}
      <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{duration:0.6,delay:0.2}}
        className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <button onClick={()=>navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to home
            </button>
            <ThemeToggle />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{isSignUp?"Create account":"Welcome back"}</h1>
          <p className="text-muted-foreground mb-6 text-sm">{isSignUp?"Start your trading journey with Quantyx":"Sign in to access your dashboard"}</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={()=>navigate("/dashboard")} className="h-11 glass rounded-lg flex items-center justify-center gap-2 text-sm hover:text-foreground text-muted-foreground transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button onClick={()=>navigate("/dashboard")} className="h-11 glass rounded-lg flex items-center justify-center gap-2 text-sm hover:text-foreground text-muted-foreground transition-colors">
              <Github className="w-4 h-4 shrink-0" /> GitHub
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-4">
            {isSignUp && <input placeholder="Full name" className="w-full h-11 px-3 rounded-lg bg-muted/50 border border-border/50 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors" />}
            <input type="email" placeholder="Email address" className="w-full h-11 px-3 rounded-lg bg-muted/50 border border-border/50 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors" />
            <input type="password" placeholder="Password" className="w-full h-11 px-3 rounded-lg bg-muted/50 border border-border/50 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors" />
            <button onClick={()=>navigate("/dashboard")} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Mail className="w-4 h-4" /> {isSignUp?"Create Account":"Sign In"}
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp?"Already have an account?":"Don't have an account?"}{" "}
            <button onClick={()=>setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
              {isSignUp?"Sign in":"Sign up"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
