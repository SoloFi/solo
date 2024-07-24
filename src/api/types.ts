import { UTCTimestamp } from "lightweight-charts";
import z from "zod";
import { QuoteRange } from "./YahooQuote";

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
  currency: z.string(),
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

export const chartQuerySchema = z.array(
  z.object({
    symbol: z.string(),
    interval: z.string(),
    from: z.optional(z.number()),
    to: z.optional(z.number()),
    range: z.optional(z.nativeEnum(QuoteRange)),
  }),
);
export type ChartQuery = z.infer<typeof chartQuerySchema>;

export interface User {
  email: string;
  password: string;
  portfolios: Portfolio[];
}

export interface CandlestickData extends Record<string, unknown> {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}
