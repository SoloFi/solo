import type { CandlestickData, ChartQuery } from "@/api/types";
import type { QuoteRange } from "@/api/YahooQuote";
import type { SearchItem } from "@/api/YahooSearch";
import { axios } from "./axios";

export const getSymbolsCharts = async (
  queries: {
    symbol: string;
    interval?: string;
    from?: number;
    to?: number;
    range?: QuoteRange;
  }[],
) => {
  const payload: ChartQuery = [];
  queries.forEach((query) => {
    const { symbol, interval, from, to, range } = query;
    payload.push({
      symbol,
      interval: interval || "1d",
      from,
      to,
      range,
    });
  });
  const { data } = await axios.post(`/api/chart`, payload);
  if (!data) throw new Error("Failed to fetch symbols charts");
  return data as { symbol: string; data: CandlestickData[] }[];
};

export const getSymbolQuote = async (symbol: string) => {
  const { data } = await axios.get(`/api/quote/${symbol.toUpperCase()}`);
  if (!data) throw new Error("Failed to fetch symbol quote");
  return data as CandlestickData;
};

export const searchSymbol = async (query: string) => {
  const encodedQuery = query.replace(/ /g, "-");
  const { data } = await axios.get(`/api/search/${encodedQuery}`);
  if (!data) return [];
  return data as SearchItem[];
};
