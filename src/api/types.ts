import z from "zod";
import type { ManipulateType } from "dayjs";
import type { UTCTimestamp } from "lightweight-charts";

export enum TransactionType {
  BUY = "BUY",
  SELL = "SELL",
}

export const portfolioTransactionSchema = z.object({
  id: z.string(),
  time: z.number(),
  quantity: z.number(),
  price: z.number(),
  type: z.nativeEnum(TransactionType),
});
export type PortfolioTransaction = z.infer<typeof portfolioTransactionSchema>;

export const portfolioHoldingSchema = z.object({
  symbol: z.string(),
  shortName: z.string(),
  type: z.string(),
  transactions: z.array(portfolioTransactionSchema),
});
export type PortfolioHolding = z.infer<typeof portfolioHoldingSchema>;

export const portfolioSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  holdings: z.array(portfolioHoldingSchema),
});
export type Portfolio = z.infer<typeof portfolioSchema>;

export interface User {
  email: string;
  password: string;
  portfolios: Portfolio[];
}

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
