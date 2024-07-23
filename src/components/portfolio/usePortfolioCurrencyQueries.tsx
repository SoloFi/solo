import { CandlestickData, PortfolioHolding } from "@/api/types";
import { dayjs } from "@/lib/utils";
import { getFxChart } from "@/query/currency";
import {
  keepPreviousData,
  useQueries,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useUser } from "../user";
import { getCurrenciesToFetch, portfolioCurrencyQueryKey } from "./utils";

export const usePortfolioCurrencyQueries = (params: {
  portfolioId: string;
  holdings: PortfolioHolding[];
}) => {
  const { portfolioId, holdings } = params;
  const { currency: userCurrency } = useUser();

  return useQueries({
    queries: getCurrenciesToFetch(holdings, userCurrency).map((currency) => {
      // Get the earliest transaction time for the currency
      const from = holdings
        .filter(({ currency: holdingCurrency }) => holdingCurrency === currency)
        .map(({ transactions }) => transactions)
        .flat()
        .sort((a, b) => a.time - b.time)[0].time;
      const to = dayjs().utc().unix();
      return {
        queryKey: portfolioCurrencyQueryKey(
          portfolioId,
          currency,
          userCurrency,
        ),
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
      const dataMap = queries.reduce(
        (acc, curr) => {
          const data = curr.data as {
            chartData: CandlestickData[];
            fromCurrency: string;
          };
          if (data) {
            acc[data.fromCurrency] = data.chartData;
          }
          return acc;
        },
        {} as Record<string, CandlestickData[]>,
      );
      return { dataMap, isPending: queries.some((query) => query.isPending) };
    },
  });
};
