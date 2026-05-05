import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { useTheme } from "next-themes";

function themeOpts(dark) {
  return {
    layout: { background:{color:"transparent"}, textColor:dark?"hsl(0,0%,55%)":"hsl(215,16%,47%)", fontFamily:"'JetBrains Mono',monospace", fontSize:11 },
    grid: { vertLines:{color:dark?"hsla(0,0%,100%,0.04)":"hsla(214,20%,88%,0.6)"}, horzLines:{color:dark?"hsla(0,0%,100%,0.04)":"hsla(214,20%,88%,0.6)"} },
    crosshair: {
      vertLine:{ color:dark?"hsla(153,100%,50%,0.4)":"hsla(153,80%,35%,0.4)", labelBackgroundColor:dark?"hsl(153,100%,50%)":"hsl(153,80%,35%)", width:1, style:3 },
      horzLine:{ color:dark?"hsla(153,100%,50%,0.4)":"hsla(153,80%,35%,0.4)", labelBackgroundColor:dark?"hsl(153,100%,50%)":"hsl(153,80%,35%)", width:1, style:3 },
    },
    rightPriceScale:{ borderVisible:false },
    timeScale:{ borderVisible:false, timeVisible:true, fixLeftEdge:true, fixRightEdge:true },
  };
}

function candleOpts(dark) {
  return {
    upColor:        dark?"hsl(153,100%,50%)":"hsl(153,80%,35%)",
    downColor:      "hsl(0,72%,51%)",
    borderUpColor:  dark?"hsl(153,100%,50%)":"hsl(153,80%,35%)",
    borderDownColor:"hsl(0,72%,51%)",
    wickUpColor:    dark?"hsla(153,100%,50%,0.7)":"hsla(153,80%,35%,0.7)",
    wickDownColor:  "hsla(0,72%,51%,0.7)",
  };
}

function prepare(raw) {
  const seen=new Set(), candles=[], volumes=[];
  raw.forEach((d) => {
    let t = d.date;
    if (typeof t === 'string' && t.includes('T')) t = t.split('T')[0];
    if (!t||seen.has(t)) return;
    seen.add(t);
    candles.push({ time:t, open:d.open, high:d.high, low:d.low, close:d.close });
    volumes.push({ time:t, value:d.volume??0, color:d.close>=d.open?"hsla(153,100%,50%,0.25)":"hsla(0,72%,51%,0.25)" });
  });
  const s=(a,b)=>a.time<b.time?-1:1;
  return { candles:candles.sort(s), volumes:volumes.sort(s) };
}

export default function StockChart({ data }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volumeRef    = useRef(null);
  const tooltipRef   = useRef(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      ...themeOpts(dark),
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight||280,
      handleScroll:{ mouseWheel:true, pressedMouseMove:true },
      handleScale: { mouseWheel:true, pinch:true },
    });

    const vol = chart.addSeries(HistogramSeries, { priceFormat:{type:"volume"}, priceScaleId:"volume" });
    chart.priceScale("volume").applyOptions({ scaleMargins:{top:0.82,bottom:0} });

    const candle = chart.addSeries(CandlestickSeries, { ...candleOpts(dark), priceFormat:{type:"price",precision:2,minMove:0.01} });
    chart.priceScale("right").applyOptions({ scaleMargins:{top:0.05,bottom:0.22} });

    chartRef.current=chart; candleRef.current=candle; volumeRef.current=vol;

    chart.subscribeCrosshairMove((param) => {
      const el=tooltipRef.current;
      if (!el) return;
      if (!param.time||!param.seriesData) { el.style.display="none"; return; }
      const c=param.seriesData.get(candle);
      if (!c) { el.style.display="none"; return; }
      const up=c.close>=c.open;
      const col=up?(dark?"hsl(153,100%,50%)":"hsl(153,80%,35%)"):"hsl(0,72%,51%)";
      el.style.display="block";
      el.innerHTML=`<span style="color:${col};font-weight:700">O ₹${c.open.toFixed(2)}  H ₹${c.high.toFixed(2)}  L ₹${c.low.toFixed(2)}  C ₹${c.close.toFixed(2)}</span>`;
    });

    const ro=new ResizeObserver(([e])=>{ chart.applyOptions({width:e.contentRect.width,height:e.contentRect.height}); });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current=candleRef.current=volumeRef.current=null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions(themeOpts(dark));
    candleRef.current?.applyOptions(candleOpts(dark));
  }, [dark]);

  useEffect(() => {
    if (!candleRef.current||!volumeRef.current||!data?.length) return;
    const { candles, volumes } = prepare(data);
    if (!candles.length) return;
    candleRef.current.setData(candles);
    volumeRef.current.setData(volumes);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div className="relative w-full" style={{height:280}}>
      <div ref={containerRef} className="w-full h-full" />
      <div ref={tooltipRef} style={{
        display:"none", position:"absolute", top:8, left:8, pointerEvents:"none",
        fontSize:11, fontFamily:"'JetBrains Mono',monospace",
        background:dark?"hsla(0,0%,5%,0.9)":"hsla(0,0%,98%,0.92)",
        border:`1px solid ${dark?"hsla(0,0%,100%,0.08)":"hsla(214,20%,88%,1)"}`,
        borderRadius:6, padding:"3px 8px", backdropFilter:"blur(8px)", whiteSpace:"nowrap",
      }} />
    </div>
  );
}
