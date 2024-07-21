import { CandlestickData, TransactionType, type PortfolioHolding } from "@/api/types";
import { queryClient } from "@/main";
import { getFXRate } from "@/query/currency";

export function getCostBasisAtTime(holding: PortfolioHolding, time: number) {
  let totalCostBasis = 0;
  let totalQuantity = 0;
  const buys =
    holding.transactions
      ?.filter((tx) => tx.type === TransactionType.BUY)
      .filter((buy) => buy.time <= time)
      .sort((a, b) => a.time - b.time) ?? [];
  const sells =
    holding.transactions
      ?.filter((tx) => tx.type === TransactionType.SELL)
      .filter((sale) => sale.time <= time)
      .sort((a, b) => a.time - b.time) ?? [];
  buys.forEach((buy) => {
    totalCostBasis += buy.price * buy.quantity;
    totalQuantity += buy.quantity;
  });
  sells.forEach((sell) => {
    const costBasis = (totalCostBasis * sell.quantity) / totalQuantity;
    totalCostBasis -= costBasis;
    totalQuantity -= sell.quantity;
  });
  return totalCostBasis;
}

export async function convertHoldingCurrency(params: {
  holding: PortfolioHolding;
  toCurrency: string;
}) {
  const { holding, toCurrency } = params;
  if (holding.currency === toCurrency) return holding;
  const currency = holding.currency;
  const exchangeRate = await queryClient.fetchQuery({
    queryKey: ["fx", currency, toCurrency],
    queryFn: () => getFXRate(currency, toCurrency),
  });
  if (!exchangeRate || typeof exchangeRate !== "number") return holding;
  holding.transactions = holding.transactions.map((tx) => {
    tx.price = tx.price * exchangeRate;
    return tx;
  });
  return holding;
}

export async function convertCandlestickDataCurrency(params: {
  data: CandlestickData[];
  fromCurrency: string;
  toCurrency: string;
}) {
  const { data, fromCurrency, toCurrency } = params;
  if (fromCurrency === toCurrency) return data;
  const exchangeRate = await queryClient.fetchQuery({
    queryKey: ["fx", fromCurrency, toCurrency],
    queryFn: () => getFXRate(fromCurrency, toCurrency),
  });
  if (!exchangeRate || typeof exchangeRate !== "number") return data;
  return data.map((candle) => {
    candle.open = candle.open * exchangeRate;
    candle.high = candle.high * exchangeRate;
    candle.low = candle.low * exchangeRate;
    candle.close = candle.close * exchangeRate;
    return candle;
  });
}

export const portfolioQueryKey = (portfolioId: string) => ["portfolio", portfolioId];

export const holdingQueryKey = (portfolioId: string, symbol: string) => [
  portfolioId,
  symbol,
];
