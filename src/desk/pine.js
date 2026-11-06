// Listing 1 of the paper (Desk Signal, Pine Script v6), parameterised with the lab settings.
// Paste into the TradingView Pine Editor → "Add to chart". Alerts notify; they never place orders.
import { DEFAULT_PARAMS } from "./quant.js";

export function deskSignalPine(p = DEFAULT_PARAMS) {
  return `//@version=6
indicator("Desk Signal", overlay=true)
brkLen  = input.int(${p.breakout}, "Cassure (barres)", minval=2)
volMult = input.float(${p.volMult}, "Volume ≥ × moyenne 20", step=0.05)
stopK   = input.float(${p.stopK}, "Stop (× ATR14)", step=0.25)
tgtR    = input.float(${p.targetR}, "Objectif (× risque)", step=0.25)

e8    = ta.ema(close, 8)
e21   = ta.ema(close, 21)
e50   = ta.ema(close, 50)
e200  = ta.ema(close, 200)
up    = e8 > e21 and e21 > e50 and e50 > e200
dn    = e8 < e21 and e21 < e50 and e50 < e200
volOK = volume >= volMult * ta.sma(volume, 20)
atr   = ta.atr(14)
calm  = atr <= ta.percentile_linear_interpolation(atr, 100, 90)
rsi   = ta.rsi(close, 14)
buy   = up and close > ta.highest(high, brkLen)[1] and volOK and rsi > 50 and calm
sell  = dn and close < ta.lowest(low, brkLen)[1] and volOK and rsi < 50 and calm

plotshape(buy,  "BUY",  shape.labelup,   location.belowbar, color.new(color.green, 0), text="BUY",  textcolor=color.white)
plotshape(sell, "SELL", shape.labeldown, location.abovebar, color.new(color.red, 0),   text="SELL", textcolor=color.white)
plot(buy  ? close - stopK * atr : na, "Stop (achat)",     color.red,   style=plot.style_circles, linewidth=2)
plot(buy  ? close + tgtR * stopK * atr : na, "Objectif (achat)", color.green, style=plot.style_circles, linewidth=2)
plot(sell ? close + stopK * atr : na, "Stop (vente)",     color.red,   style=plot.style_circles, linewidth=2)
plot(sell ? close - tgtR * stopK * atr : na, "Objectif (vente)", color.green, style=plot.style_circles, linewidth=2)
alertcondition(buy,  "Desk BUY",  "Desk Signal BUY {{ticker}} @ {{close}}")
alertcondition(sell, "Desk SELL", "Desk Signal SELL {{ticker}} @ {{close}}")
`;
}
