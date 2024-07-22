import { QuoteRange } from "@/api/YahooQuote";
import { axios } from "./axios";
import { CandlestickData } from "lightweight-charts";

export const getFxRate = async (fromCurrency: string, toCurrency: string) => {
  const { data } = await axios.get(`/api/fx/${fromCurrency.toUpperCase()}${toCurrency.toUpperCase()}`);
  return data as number | undefined;
};

export const getFxChart = async (params: {
  fromCurrency: string;
  toCurrency: string;
  from?: number;
  to?: number;
  range?: QuoteRange;
}) => {
  const { fromCurrency, toCurrency, from, to, range } = params;
  const payload = { from, to, range };
  const { data } = await axios.post(`/api/chart/${fromCurrency.toUpperCase()}${toCurrency.toUpperCase()}=X`, payload);
  if (!data) throw new Error("Failed to fetch currency rate chart");
  return data as CandlestickData[];
};
