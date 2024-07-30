import { TransactionType, type PortfolioHolding } from "@/api/types";
import { utcUnixTime } from "@/lib/utils";

export function getCostBasisAtTime(holding: PortfolioHolding, time: number) {
  let totalCostBasis = 0;
  let totalQuantity = 0;
  const buys =
    holding.transactions
      ?.filter((tx) => tx.type === TransactionType.BUY)
      .filter((buy) => utcUnixTime(buy.time) <= utcUnixTime(time))
      .sort((a, b) => utcUnixTime(a.time) - utcUnixTime(b.time)) ?? [];
  const sells =
    holding.transactions
      ?.filter((tx) => tx.type === TransactionType.SELL)
      .filter((sale) => utcUnixTime(sale.time) <= utcUnixTime(time))
      .sort((a, b) => utcUnixTime(a.time) - utcUnixTime(b.time)) ?? [];
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

export function getCurrenciesToFetch(
  holdings: PortfolioHolding[],
  userCurrency: string,
) {
  return Array.from(
    new Set(
      holdings
        .filter(
          ({ currency, transactions }) =>
            currency !== userCurrency && transactions.length > 0,
        )
        .map(({ currency }) => currency),
    ).values(),
  );
}

export function getHoldingsWithTransactions(holdings?: PortfolioHolding[]) {
  return holdings?.filter((holding) => holding?.transactions?.length > 0) ?? [];
}

export const portfolioQueryKey = (portfolioId: string) => [
  "portfolio",
  portfolioId,
];

export const holdingQueryKey = (portfolioId: string, symbol: string) => [
  portfolioId,
  symbol,
];

export const portfolioCurrencyQueryKey = (
  portfolioId: string,
  fromCurrency: string,
  toCurrency: string,
) => [portfolioId, fromCurrency, toCurrency];
