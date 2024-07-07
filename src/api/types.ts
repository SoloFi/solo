import z from "zod";
import type { ManipulateType } from "dayjs";
import type { UTCTimestamp } from "lightweight-charts";

export const portfolioActionSchema = z.object({
  time: z.number(),
  quantity: z.number(),
  price: z.number(),
});
export type PortfolioAction = z.infer<typeof portfolioActionSchema>;

export const portfolioHoldingSchema = z.object({
  symbol: z.string(),
  shortName: z.string(),
  currency: z.string(),
  type: z.string(),
  buys: z.array(portfolioActionSchema),
  sales: z.array(portfolioActionSchema),
});
export type PortfolioHolding = z.infer<typeof portfolioHoldingSchema>;

export const portfolioSchema = z.object({
  id: z.string(),
  name: z.string(),
  holdings: z.array(portfolioHoldingSchema),
});
export type Portfolio = z.infer<typeof portfolioSchema>;

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
