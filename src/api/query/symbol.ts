import { ManipulateType } from "dayjs";
import { CandlestickData, QuoteRange } from "../YahooQuote";

export const RangeConstruction: Record<
  QuoteRange,
  { value: number; unit: ManipulateType }
> = {
  "1d": { value: 1, unit: "day" },
  "5d": { value: 5, unit: "day" },
  "1mo": { value: 1, unit: "month" },
  "3mo": { value: 3, unit: "month" },
  "6mo": { value: 6, unit: "month" },
  "1y": { value: 1, unit: "year" },
  "2y": { value: 2, unit: "year" },
  "5y": { value: 5, unit: "year" },
  "10y": { value: 10, unit: "year" },
  ytd: { value: 1, unit: "year" },
  max: { value: 10, unit: "year" },
};

export const getSymbolChart = async (params: {
  symbol: string;
  from?: number;
  to?: number;
  range?: QuoteRange;
}) => {
  const { symbol, from, to, range } = params;
  const url: URL = new URL(`http://localhost:8080/chart/${symbol}`);
  if (range) url.searchParams.append("range", range);
  if (from) url.searchParams.append("from", from.toString());
  if (to) url.searchParams.append("to", to.toString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch symbol chart");
  const candlestickData: CandlestickData[] = await res.json();
  return candlestickData;
};
