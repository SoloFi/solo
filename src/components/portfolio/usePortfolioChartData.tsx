import { type CandlestickData, type Portfolio, TransactionType } from "@/api/types";
import TimeSeries from "@/lib/TimeSeries";
import { dayjs } from "@/lib/utils";
import { getSymbolChart } from "@/query/symbol";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import type { LineData, UTCTimestamp } from "lightweight-charts";
import { useMemo } from "react";
import { getCostBasisAtTime, holdingQueryKey } from "./utils";

// Hook to transform portfolio holdings and symbol chart data into a format that can be used by the chart component
export const usePortfolioChartData = (props: {
  portfolioId: string;
  holdings: Portfolio["holdings"];
  // symbolsDataMap: Record<string, CandlestickData[]> | null;
}): {
  portfolioChartData: CandlestickData[];
  costBasisChartData: LineData<UTCTimestamp>[];
} => {
  const { portfolioId, holdings } = props;

  const holdingsWithTransactions = useMemo(
    () => holdings.filter((holding) => holding?.transactions?.length > 0) ?? [],
    [holdings],
  );

  const symbolQueries = useQueries({
    queries: holdingsWithTransactions.map((entry) => {
      const symbol = entry.symbol;
      const from = entry.transactions.sort((a, b) => a.time - b.time)[0].time;
      const to = dayjs().utc().unix();
      return {
        queryKey: holdingQueryKey(portfolioId, symbol),
        placeholderData: keepPreviousData,
        queryFn: async () =>
          getSymbolChart({
            symbol,
            from,
            to,
          }),
        refetchOnWindowFocus: false,
      };
    }),
  });
  const isLoading = useMemo(
    () => symbolQueries.some((query) => query.isPending),
    [symbolQueries],
  );

  const symbolsDataMap = useMemo(() => {
    return holdingsWithTransactions
      .map(({ symbol }, index) => ({
        [symbol]: symbolQueries[index].data,
      }))
      .reduce((acc, curr) => ({ ...acc, ...curr }), {}) as Record<
      string,
      CandlestickData[]
    >;
  }, [holdingsWithTransactions, symbolQueries]);

  const { portfolioChartData, costBasisChartData } = useMemo(() => {
    if (holdingsWithTransactions.length === 0 || isLoading)
      return { portfolioChartData: [], costBasisChartData: [] };

    const timeSeries = holdingsWithTransactions.map(({ symbol, transactions }) => {
      const buys = transactions?.filter((tx) => tx.type === TransactionType.BUY);
      const sells = transactions?.filter((tx) => tx.type === TransactionType.SELL);
      // compute the holding's chart over time based on the current price and shares held
      const holdingChartData = [];
      for (const { time, open, high, low, close } of symbolsDataMap[symbol]) {
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
    const costBasisTimeSeries = holdingsWithTransactions.map((holding) => {
      const costBasis = [];
      for (const time of mergedTimeSeries.getTimeAxis()) {
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

    return {
      portfolioChartData: mergedTimeSeries.getValueAxis() as unknown as CandlestickData[], // TODO: fix typing
      costBasisChartData:
        mergedCostBasisTimeSeries.getValueAxis() as unknown as LineData<UTCTimestamp>[], // TODO: fix typing,
    };
  }, [holdingsWithTransactions, isLoading, symbolsDataMap]);

  return { portfolioChartData, costBasisChartData };
};
