import { CandlestickData, PortfolioHolding, TransactionType } from "@/api/types";
import { dayjs, percentChange } from "@/lib/utils";
import { getSymbolChart } from "@/query/symbol";
import { useQueries } from "@tanstack/react-query";
import { UTCTimestamp } from "lightweight-charts";
import isNil from "lodash/isNil";
import { useMemo } from "react";
import { useUser } from "../user";
import { convertCandlestickDataCurrency, getCostBasisAtTime } from "./utils";

export const usePortfolioTableData = (props: { holdings: PortfolioHolding[] }) => {
  const holdings = useMemo(() => props.holdings, [props.holdings]);
  const { currency } = useUser();

  const { data: symbolsData, isPending } = useQueries({
    queries:
      holdings?.map((entry) => {
        const symbol = entry.symbol;
        return {
          queryKey: [symbol, "chart", "1mo"],
          queryFn: async () =>
            getSymbolChart({
              symbol,
              range: "1mo",
            }).then((data) =>
              convertCandlestickDataCurrency({
                data,
                fromCurrency: entry.currency,
                toCurrency: currency,
              }),
            ),
          refetchOnWindowFocus: false,
          staleTime: 1000 * 60 * 5, // 5 minutes
        };
      }) ?? [],
    combine: (results) => {
      return {
        data: results
          .filter(({ data }) => !isNil(data))
          .map((result) => result.data as CandlestickData[]),
        isPending: results.some((result) => result.isLoading),
      };
    },
  });

  const tableData = useMemo(() => {
    if (isPending) return [];
    return holdings.map((entry, index) => {
      const symbol = entry.symbol;
      const buys = entry.transactions.filter((t) => t.type === TransactionType.BUY);
      const chartData = symbolsData[index];
      const last30Days =
        chartData?.slice(-30).map((data) => ({
          time: data.time as UTCTimestamp,
          value: data.close,
        })) ?? [];
      if (buys.length === 0) {
        return {
          holding: {
            symbol,
            name: entry.shortName,
          },
          price: symbolsData[index]?.[symbolsData[index].length - 1]?.close ?? 0,
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
      const lastBuy = buys[buys.length - 1];
      const lastData = chartData ? chartData[chartData.length - 1] : undefined;
      const price = lastData?.close ?? lastBuy.price;
      const quantity = buys.reduce((acc, buy) => acc + buy.quantity, 0);
      const value = price * quantity;
      const costBasis = getCostBasisAtTime(entry, dayjs().utc().unix() as UTCTimestamp);
      // fill in null values with last known non-null value
      let lastKnownValue = 0;
      for (let i = 0; i < last30Days.length; i++) {
        if (last30Days[i].value === null) {
          last30Days[i].value = lastKnownValue;
        } else {
          lastKnownValue = last30Days[i].value;
        }
      }
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
        last30Days,
      };
    });
  }, [holdings, isPending, symbolsData]);

  return tableData;
};
