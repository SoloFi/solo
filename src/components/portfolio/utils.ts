import type { PortfolioHolding } from "@/api/types";
import { UTCTimestamp } from "lightweight-charts";

export function getCostBasisAtTime(holding: PortfolioHolding, time: UTCTimestamp) {
  let totalCostBasis = 0;
  let totalQuantity = 0;
  const buys =
    holding.buys?.filter((buy) => buy.time <= time).sort((a, b) => a.time - b.time) ?? [];
  const sales =
    holding.sales?.filter((sale) => sale.time <= time).sort((a, b) => a.time - b.time) ??
    [];
  buys.forEach((buy) => {
    totalCostBasis += buy.price * buy.quantity;
    totalQuantity += buy.quantity;
  });
  sales.forEach((sale) => {
    const costBasis = (totalCostBasis * sale.quantity) / totalQuantity;
    totalCostBasis -= costBasis;
    totalQuantity -= sale.quantity;
  });
  return totalCostBasis;
}
