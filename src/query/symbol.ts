import type { CandlestickData, QuoteRange } from "@/api/types";
import type { SearchItem } from "@/api/YahooSearch";
import { axios } from "./axios";

export const getSymbolChart = async (params: {
  symbol: string;
  from?: number;
  to?: number;
  range?: QuoteRange;
}) => {
  const { symbol, from, to, range } = params;
  const payload = { from, to, range };
  const { data } = await axios.post(`/api/chart/${symbol}`, payload);
  if (!data) throw new Error("Failed to fetch symbol chart");
  return data as CandlestickData[];
};

export const getSymbolQuote = async (symbol: string) => {
  const { data } = await axios.get(`/api/quote/${symbol}`);
  if (!data) throw new Error("Failed to fetch symbol quote");
  return data as CandlestickData;
};

export const searchSymbol = async (query: string) => {
  const encodedQuery = query.replace(/ /g, "-");
  const { data } = await axios.get(`/api/search/${encodedQuery}`);
  if (!data) return [];
  return data as SearchItem[];
};
