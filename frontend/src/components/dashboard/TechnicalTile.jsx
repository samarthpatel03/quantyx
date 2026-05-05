const cm = { mint:"text-primary", destructive:"text-destructive", muted:"text-muted-foreground" };

export default function TechnicalTile({ title, value, subtitle, color, gauge, badge }) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {badge && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${color==="mint"?"bg-primary/10 text-primary":"bg-destructive/10 text-destructive"}`}>{badge}</span>
        )}
      </div>
      {gauge ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="relative w-24 h-12 overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="hsl(0,0%,15%)" strokeWidth="8" strokeLinecap="round" />
              <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none"
                stroke={value>70?"hsl(0,72%,51%)":value<30?"hsl(153,100%,50%)":"hsl(0,0%,55%)"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(value/100)*141.37} 141.37`} />
            </svg>
          </div>
          <span className={`font-mono text-2xl font-bold ${cm[color]}`}>{value.toFixed(1)}</span>
        </div>
      ) : (
        <span className={`font-mono text-2xl font-bold ${cm[color]} mb-1`}>
          {typeof value==="number"&&value>100 ? `₹${value.toLocaleString("en-IN")}` : value.toFixed(2)}
        </span>
      )}
      <span className="text-xs text-muted-foreground mt-auto">{subtitle}</span>
    </div>
  );
}
