import { motion } from "framer-motion";
import { useMemo } from "react";

export default function CandlestickAnimation() {
  const candles = useMemo(() => {
    const arr = [];
    for (let i=0;i<24;i++) {
      const open=50+Math.random()*200, close=50+Math.random()*200;
      arr.push({ open, close, high:Math.max(open,close)+Math.random()*40, low:Math.min(open,close)-Math.random()*40, isGreen:close>open, x:i*18+10 });
    }
    return arr;
  }, []);

  return (
    <div className="relative w-80 h-80">
      <svg viewBox="0 0 450 320" className="w-full h-full">
        {candles.map((c,i) => (
          <motion.g key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.06,duration:0.4}}>
            <line x1={c.x+5} y1={c.high} x2={c.x+5} y2={c.low} stroke={c.isGreen?"hsl(153,100%,50%)":"hsl(0,72%,51%)"} strokeWidth="1" opacity="0.5" />
            <rect x={c.x} y={Math.min(c.open,c.close)} width="10" height={Math.abs(c.close-c.open)||2} rx="1" fill={c.isGreen?"hsl(153,100%,50%)":"hsl(0,72%,51%)"} opacity="0.7" />
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
