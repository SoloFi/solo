import {
  CandlestickData,
  PortfolioHolding,
  TransactionType,
} from "@/api/types";
import { charts } from "@/lib/batchers";
import { CandlestickTimeSeries } from "@/lib/TimeSeries";
import { dayjs, percentChange } from "@/lib/utils";
import { getFxSymbol } from "@/query/currency";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useUser } from "../user";
import { usePortfolioCurrencyQueries } from "./usePortfolioCurrencyQueries";
import { getCostBasisAtTime } from "./utils";

export const usePortfolioTableData = (props: {
  portfolioId: string;
  holdings: PortfolioHolding[];
}) => {
  const { portfolioId, holdings } = props;
  const { currency: userCurrency } = useUser();

  const { dataMap: symbolsDataMap, isPending: symbolsPending } = useQueries({
    queries: holdings.map((entry) => {
      const symbol = entry.symbol;
      return {
        queryKey: [symbol, "chart", "1mo"],
        queryFn: () =>
          charts.fetch({
            symbol,
            interval: "1d",
            range: "1mo",
          }),
        refetchOnWindowFocus: false,
      };
    }),
    combine: (queries) => {
      const dataMap = queries.reduce(
        (acc, curr) => {
          const data = curr.data as {
            data: CandlestickData[];
            symbol: string;
          };
          if (data) {
            acc[data.symbol] = data.data;
          }
          return acc;
        },
        {} as Record<string, CandlestickData[]>,
      );
      return { dataMap, isPending: queries.some((query) => query.isPending) };
    },
  });

  const { dataMap: currencyDataMap, isPending: currencyPending } =
    usePortfolioCurrencyQueries({
      portfolioId,
      holdings,
    });

  const tableData = useMemo(() => {
    if (symbolsPending || currencyPending) return [];
    return holdings.map((entry) => {
      const symbol = entry.symbol;
      const currencyKey = getFxSymbol(entry.currency, userCurrency);
      const buys = entry.transactions.filter(
        (t) => t.type === TransactionType.BUY,
      );
      let chartData: CandlestickData[] = [];
      const symbolTimeSeries = new CandlestickTimeSeries(
        symbolsDataMap[entry.symbol],
      );
      if (entry.currency === userCurrency || !currencyDataMap[currencyKey]) {
        chartData = symbolTimeSeries.getValueAxis();
      } else {
        const currencyTimeSeries = new CandlestickTimeSeries(
          currencyDataMap[currencyKey],
        );
        chartData = symbolTimeSeries
          .multiply(currencyTimeSeries)
          .getValueAxis();
      }
      const price = chartData.slice(-1)[0].close;
      const last30Days = chartData?.slice(-30) ?? [];
      if (buys.length === 0) {
        return {
          holding: {
            symbol,
            name: entry.shortName,
          },
          price,
          quantity: 0,
          value: 0,
          costBasis: 0,
          change: {
            value: 0,
            percentChange: 0,
          },
          last30Days,
        };
      }
      const latestCurrencyRate =
        entry.currency === userCurrency
          ? 1
          : currencyDataMap[currencyKey].slice(-1)[0].close;
      const quantity = buys.reduce((acc, buy) => acc + buy.quantity, 0);
      const value = price * quantity;
      const costBasis =
        getCostBasisAtTime(entry, dayjs().utc().unix()) * latestCurrencyRate;
      return {
        holding: {
          symbol,
          name: entry.shortName,
        },
        price,
        quantity,
        value,
        costBasis,
        change: {
          value: value - costBasis,
          percentChange: percentChange(costBasis, value),
        },
        last30Days: new CandlestickTimeSeries(last30Days).getValueAxis(),
      };
    });
  }, [
    currencyDataMap,
    currencyPending,
    holdings,
    symbolsDataMap,
    symbolsPending,
    userCurrency,
  ]);

  return tableData;
};
