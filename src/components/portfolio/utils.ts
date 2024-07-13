import { TransactionType, type PortfolioHolding } from "@/api/types";
import { UTCTimestamp } from "lightweight-charts";

export function getCostBasisAtTime(holding: PortfolioHolding, time: UTCTimestamp) {
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
