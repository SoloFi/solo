import type { CandlestickData, QuoteRange } from "@/api/types";
import { SearchItem } from "../YahooSearch";

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

export const searchSymbol = async (query: string) => {
  const encodedQuery = query.replace(/ /g, "-");
  const url: URL = new URL(`http://localhost:8080/search/${encodedQuery}`);
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const items: SearchItem[] = await res.json();
  return items;
};
