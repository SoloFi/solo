import { TransactionType, type PortfolioHolding } from "@/api/types";
import { utcUnixTime } from "@/lib/utils";

export function getCostBasisAtTime(holding: PortfolioHolding, time: number) {
  let totalCostBasis = 0;
  let totalQuantity = 0;
  const transactions = (
    holding.transactions?.filter(
      (tx) => utcUnixTime(tx.time) <= utcUnixTime(time),
    ) ?? []
  ).sort((a, b) => a.time - b.time);

  transactions.forEach(({ type, price, quantity }) => {
    if (type === TransactionType.BUY) {
      totalCostBasis += price * quantity;
      totalQuantity += quantity;
    } else {
      const costBasis = (totalCostBasis * quantity) / totalQuantity;
      totalCostBasis -= costBasis;
      totalQuantity -= quantity;
    }
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
