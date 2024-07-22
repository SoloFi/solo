import { CandlestickData, PortfolioHolding, TransactionType } from "@/api/types";
import TimeSeries from "@/lib/TimeSeries";
import { dayjs, percentChange } from "@/lib/utils";
import { getSymbolChart } from "@/query/symbol";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { getCostBasisAtTime } from "./utils";
import { useUser } from "../user";
import { usePortfolioCurrencyQueries } from "./usePortfolioCurrencyQueries";

export const usePortfolioTableData = (props: { portfolioId: string; holdings: PortfolioHolding[] }) => {
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
      const dataMap = queries.reduce((acc, curr) => {
        const data = curr.data;
        if (data) {
          acc[data.symbol] = data.chartData;
        }
        return acc;
      }, {} as Record<string, CandlestickData[]>);
      return { dataMap, isPending: queries.some((query) => query.isPending) }
    },
  });

  const { dataMap: currencyDataMap, isPending: currencyPending } = usePortfolioCurrencyQueries({
    portfolioId,
    holdings,
  });

  const tableData = useMemo(() => {
    if (symbolsPending || currencyPending) return [];
    return holdings.map((entry) => {
      const symbol = entry.symbol;
      const buys = entry.transactions.filter((t) => t.type === TransactionType.BUY);
      let chartData: CandlestickData[] = [];
      const symbolData = new TimeSeries({ data: symbolsDataMap[entry.symbol], valueKeys: ["close"] });
      if (entry.currency === userCurrency) chartData = symbolData.getValueAxis();
      else {
        const currencyTimeSeries = new TimeSeries({ data: currencyDataMap[entry.currency], valueKeys: ["close"] });
        chartData = TimeSeries.intersectSeries(
          [symbolData, currencyTimeSeries],
          TimeSeries.multiply)
          .getValueAxis() as unknown as CandlestickData[]; // TODO: Fix typing
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
      const latestCurrencyRate = entry.currency === userCurrency ? 1 : currencyDataMap[entry.currency].slice(-1)[0].close;
      const quantity = buys.reduce((acc, buy) => acc + buy.quantity, 0);
      const value = price * quantity;
      const costBasis = getCostBasisAtTime(entry, dayjs().utc().unix()) * latestCurrencyRate;
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
        last30Days: new TimeSeries({
          data: last30Days,
          valueKeys: ["close"],
        }).getValueAxis(),
      };
    });
  }, [currencyDataMap, currencyPending, holdings, symbolsDataMap, symbolsPending, userCurrency]);

  return tableData;
};
