import type { CandlestickData, ChartQuery } from "@/api/types";
import type { SearchItem } from "@/api/YahooSearch";
import { axios } from "./axios";

export const getSymbolsCharts = async (queries: ChartQuery) => {
  const { data } = await axios.post(`/api/chart`, queries);
  if (!data) throw new Error("Failed to fetch symbols charts");
  return data as ({ data: CandlestickData[] } & ChartQuery[0])[];
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
