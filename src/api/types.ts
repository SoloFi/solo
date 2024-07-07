import type { ManipulateType } from "dayjs";
import type { UTCTimestamp } from "lightweight-charts";

export type Portfolio = {
  id: string;
  name: string;
  holdings: PortfolioHolding[];
};

export type PortfolioHolding = {
  symbol: string;
  shortName: string;
  currency: string;
  type: string;
  buys?: PortfolioAction[];
  sales?: PortfolioAction[];
};

export type PortfolioAction = {
  time: number;
  quantity: number;
  price: number;
};

export interface CandlestickData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Quote {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
}

export type QuoteRange = "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "10y" | "ytd";

export const RangeConstruction: Record<
  QuoteRange,
  { value: number; unit: ManipulateType }
> = {
  "1mo": { value: 1, unit: "month" },
  "3mo": { value: 3, unit: "month" },
  "6mo": { value: 6, unit: "month" },
  "1y": { value: 1, unit: "year" },
  "2y": { value: 2, unit: "year" },
  "5y": { value: 5, unit: "year" },
  "10y": { value: 10, unit: "year" },
  ytd: { value: 1, unit: "year" },
};
