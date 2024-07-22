import { type CandlestickData, type Portfolio, TransactionType } from "@/api/types";
import TimeSeries from "@/lib/TimeSeries";
import { dayjs } from "@/lib/utils";
import { getSymbolChart } from "@/query/symbol";
import { keepPreviousData, useQueries, UseQueryOptions } from "@tanstack/react-query";
import type { LineData, UTCTimestamp } from "lightweight-charts";
import { useMemo } from "react";
import { getCostBasisAtTime, getCurrenciesToFetch, portfolioCurrencyQueryKey, holdingQueryKey } from "./utils";
import { getFxChart } from "@/query/currency";
import { useUser } from "../user";

// Hook to transform portfolio holdings and symbol chart data into a format that can be used by the chart component
export const usePortfolioChartData = (props: {
  portfolioId: string;
  holdings: Portfolio["holdings"];
}): {
  portfolioChartData: CandlestickData[];
  costBasisChartData: LineData<UTCTimestamp>[];
} => {
  const { portfolioId, holdings } = props;
  const { currency: userCurrency } = useUser();

  const holdingsWithTransactions = useMemo(
    () => holdings.filter((holding) => holding?.transactions?.length > 0) ?? [],
    [holdings],
  );

  const { dataMap: symbolsDataMap, isPending: symbolsPending } = useQueries({
    queries: holdingsWithTransactions.map((entry) => {
      const symbol = entry.symbol;
      const from = entry.transactions.sort((a, b) => a.time - b.time)[0].time;
      const to = dayjs().utc().unix();
      return {
        queryKey: holdingQueryKey(portfolioId, symbol),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        queryFn: async () => {
          const chartData = await getSymbolChart({
            symbol,
            from,
            to,
          });
          return { chartData, symbol };
        },
      } satisfies UseQueryOptions;
    }),
    combine: (queries) => {
      const dataMap = queries.reduce((acc, curr) => {
        const data = curr.data as { chartData: CandlestickData[]; symbol: string };
        if (data) {
          acc[data.symbol] = data.chartData;
        }
        return acc;
      }, {} as Record<string, CandlestickData[]>);
      return { dataMap, isPending: queries.some((query) => query.isPending) }
    },
  });

  const { dataMap: currencyDataMap, isPending: currencyPending } = useQueries({
    queries: getCurrenciesToFetch(holdingsWithTransactions, userCurrency).map(currency => {
      // Get the earliest transaction time for the currency
      const from = holdingsWithTransactions
        .filter(({ currency: holdingCurrency }) => holdingCurrency === currency)
        .map(({ transactions }) => transactions)
        .flat()
        .sort((a, b) => a.time - b.time)[0].time;
      const to = dayjs().utc().unix();
      return {
        queryKey: portfolioCurrencyQueryKey(portfolioId, currency, userCurrency),
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        queryFn: async () => {
          const chartData = await getFxChart({
            fromCurrency: currency,
            toCurrency: userCurrency,
            from,
            to,
          });
          return { chartData, fromCurrency: currency };
        },
      } satisfies UseQueryOptions;
    }),
    combine: (queries) => {
      const dataMap = queries.reduce((acc, curr) => {
        const data = curr.data as { chartData: CandlestickData[]; fromCurrency: string; };
        if (data) {
          acc[data.fromCurrency] = data.chartData;
        }
        return acc;
      }, {} as Record<string, CandlestickData[]>);
      return { dataMap, isPending: queries.some((query) => query.isPending) }
    },
  });

  const { portfolioChartData, costBasisChartData } = useMemo(() => {
    if (symbolsPending || currencyPending || holdingsWithTransactions.length === 0)
      return { portfolioChartData: [], costBasisChartData: [] };

    const symbolTimeSeries = holdingsWithTransactions.map(({ symbol, currency, transactions }) => {
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
      const holdingTimeSeries = new TimeSeries({ data: holdingChartData, valueKeys: ["open", "high", "low", "close"] });
      if (currency === userCurrency) {
        return holdingTimeSeries;
      }
      const currencyTimeSeries = new TimeSeries({ data: currencyDataMap[currency], valueKeys: ["open", "high", "low", "close"] });
      return TimeSeries.intersectSeries([holdingTimeSeries, currencyTimeSeries], TimeSeries.multiply);
    });

    const mergedSymbolTimeSeries = TimeSeries.intersectSeries(symbolTimeSeries, TimeSeries.add);
    const costBasisTimeSeries = holdingsWithTransactions.map((holding) => {
      const costBasis = [];
      const latestCurrencyRate = holding.currency === userCurrency ? 1 : currencyDataMap[holding.currency].slice(-1)[0].close;
      for (const time of mergedSymbolTimeSeries.getTimeAxis()) {
        costBasis.push({
          time,
          value: getCostBasisAtTime(holding, time) * latestCurrencyRate,
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
      portfolioChartData: mergedSymbolTimeSeries.getValueAxis() as unknown as CandlestickData[], // TODO: fix typing
      costBasisChartData:
        mergedCostBasisTimeSeries.getValueAxis() as unknown as LineData<UTCTimestamp>[], // TODO: fix typing,
    };
  }, [symbolsPending, currencyPending, holdingsWithTransactions, userCurrency, currencyDataMap, symbolsDataMap]);

  return { portfolioChartData, costBasisChartData };
};
