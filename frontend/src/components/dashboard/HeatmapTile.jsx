function color(change) {
  if (change>=2)  return "bg-primary/80 text-primary-foreground";
  if (change>=1)  return "bg-primary/50 text-primary-foreground";
  if (change>0)   return "bg-primary/20 text-primary";
  if (change===0) return "bg-muted text-muted-foreground";
  if (change>-1)  return "bg-destructive/20 text-destructive";
  if (change>-2)  return "bg-destructive/50 text-destructive-foreground";
  return "bg-destructive/80 text-destructive-foreground";
}
export default function HeatmapTile({ data }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
      {data.map((item) => (
        <div key={item.symbol} className={`rounded-lg px-2 py-2 text-center transition-all hover:scale-105 ${color(item.change)}`}>
          <div className="text-[10px] font-mono font-semibold truncate">{item.symbol}</div>
          <div className="text-[10px] font-mono mt-0.5">{item.change>0?"+":""}{item.change}%</div>
        </div>
      ))}
    </div>
  );
}
