import type { UTCTimestamp } from "lightweight-charts";

export type Portfolio = {
  id: string;
  name: string;
  holdings: {
    symbol: string;
    buys?: {
      time: number;
      quantity: number;
      price: number;
    }[];
    sells?: {
      time: number;
      quantity: number;
      price: number;
    }[];
  }[];
};

export type CostBasisData = {
  time: UTCTimestamp;
  value: number;
};

export const getPortfolio = async () => {
  const response = await fetch("/api/portfolio");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return (await response.json()) as Portfolio;
};
