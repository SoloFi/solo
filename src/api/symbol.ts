import type { UTCTimestamp } from "lightweight-charts";

export type CandlestickData = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

export const getSymbolChart = async (params: {
  symbol: string;
  from: number;
  to: number;
}) => {
  const { symbol, from, to } = params;
  const res = await fetch(
    `http://localhost:8080/chart/${symbol}?from=${from}&to=${to}`,
  );
  if (!res.ok) throw new Error("Failed to fetch symbol chart");
  const data = await res.json();
  const timestamp = data?.chart?.result?.[0]?.timestamp as UTCTimestamp[];
  const quote = data?.chart?.result?.[0]?.indicators?.quote[0] as {
    open: number[];
    high: number[];
    low: number[];
    close: number[];
  };
  if (!timestamp || !quote) throw new Error("Invalid data");
  const candlestickData = timestamp.map((time, index) => ({
    time: time,
    open: quote.open[index],
    high: quote.high[index],
    low: quote.low[index],
    close: quote.close[index],
  }));
  return candlestickData;
};
