import {
  CandlestickData,
  PortfolioHolding,
  TransactionType,
} from "@/api/types";
import { CandlestickTimeSeries } from "@/lib/TimeSeries";
import { dayjs, percentChange } from "@/lib/utils";
import { getSymbolChart } from "@/query/symbol";
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
        queryFn: async () => {
          const chartData = await getSymbolChart({
            symbol,
            range: "1mo",
          });
          return { chartData, symbol };
        },
        refetchOnWindowFocus: false,
      };
    }),
    combine: (queries) => {
      const dataMap = queries.reduce(
        (acc, curr) => {
          const data = curr.data;
          if (data) {
            acc[data.symbol] = data.chartData;
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
      const buys = entry.transactions.filter(
        (t) => t.type === TransactionType.BUY,
      );
      let chartData: CandlestickData[] = [];
      const symbolTimeSeries = new CandlestickTimeSeries(
        symbolsDataMap[entry.symbol],
      );
      console.log("symbolTimeSeries", symbolTimeSeries.getValueAxis());
      if (entry.currency === userCurrency || !currencyDataMap[entry.currency]) {
        chartData = symbolTimeSeries.getValueAxis();
        console.log("chartData", chartData);
      } else {
        const currencyTimeSeries = new CandlestickTimeSeries(
          currencyDataMap[entry.currency],
        );
        console.log("currencyTimeSeries", currencyTimeSeries.getValueAxis());
        chartData = symbolTimeSeries
          .multiply(currencyTimeSeries)
          .getValueAxis();
        console.log("chartData", chartData);
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
          : currencyDataMap[entry.currency].slice(-1)[0].close;
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
