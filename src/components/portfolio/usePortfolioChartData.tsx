import { type CandlestickData, type Portfolio, TransactionType } from "@/api/types";
import TimeSeries from "@/lib/TimeSeries";
import type { LineData, UTCTimestamp } from "lightweight-charts";
import { useMemo } from "react";
import { getCostBasisAtTime } from "./utils";

// Hook to transform portfolio holdings and symbol chart data into a format that can be used by the chart component
export const usePortfolioChartData = (props: {
  portfolio: Portfolio | null;
  symbolDataMap: Record<string, CandlestickData[]> | null;
}): {
  portfolioChartData: CandlestickData[];
  costBasisChartData: LineData<UTCTimestamp>[];
} => {
  const { portfolio, symbolDataMap } = props;

  const holdings = useMemo(
    () => portfolio?.holdings?.filter(({ transactions }) => transactions.length > 0),
    [portfolio],
  );

  const { portfolioChartData, costBasisChartData } = useMemo(() => {
    if (!holdings || holdings.length === 0 || !symbolDataMap)
      return { portfolioChartData: [], costBasisChartData: [] };

    const timeSeries = holdings.map(({ symbol, transactions }) => {
      const buys = transactions?.filter((tx) => tx.type === TransactionType.BUY);
      const sells = transactions?.filter((tx) => tx.type === TransactionType.SELL);
      const symbolData = symbolDataMap[symbol];
      // compute the holding's chart over time based on the current price and shares held
      const holdingChartData = [];
      for (const { time, open, high, low, close } of symbolData) {
        const buyShares = buys
          ?.filter((buy) => buy.time <= time)
          .reduce((acc, buy) => acc + buy.quantity, 0);
        const sellShares = sells
          ?.filter((sell) => sell.time <= time)
          .reduce((acc, sell) => acc + sell.quantity, 0);
        const shares = (buyShares ?? 0) - (sellShares ?? 0);
        holdingChartData.push({
          time,
          open: open * shares,
          high: high * shares,
          low: low * shares,
          close: close * shares,
        });
      }
      return new TimeSeries({
        data: holdingChartData,
        valueKeys: ["open", "high", "low", "close"],
      });
    });

    const mergedTimeSeries = TimeSeries.intersectSeries(timeSeries, TimeSeries.add);

    const portfolioChartData =
      mergedTimeSeries.getValueAxis() as unknown as CandlestickData[]; // TODO: fix typing

    const mergedTimeline = mergedTimeSeries.getTimeAxis();

    const costBasisTimeSeries = holdings.map((holding) => {
      const costBasis = [];
      for (const time of mergedTimeline) {
        costBasis.push({
          time,
          value: getCostBasisAtTime(holding, time),
        });
      }
      return new TimeSeries({
        data: costBasis,
        valueKeys: ["value"],
      });
    });
    const mergedCostBasisTimeSeries = TimeSeries.intersectSeries(
      costBasisTimeSeries,
      TimeSeries.add,
    );
    const costBasisChartData =
      mergedCostBasisTimeSeries.getValueAxis() as unknown as LineData<UTCTimestamp>[]; // TODO: fix typing

    return { portfolioChartData, costBasisChartData };
  }, [symbolDataMap, holdings]);

  return { portfolioChartData, costBasisChartData };
};
