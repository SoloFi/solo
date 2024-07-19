import type { CandlestickData, PortfolioHolding } from "@/api/types";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";
import { PortfolioChart } from "@/components/charts/portfolio-chart";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";
import { usePortfolioChartData } from "@/components/portfolio/usePortfolioChartData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dayjs } from "@/lib/utils";
import { getPortfolio } from "@/query/portfolio";
import { getSymbolChart } from "@/query/symbol";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { mustBeAuthenticated } from "../-utils";
import SymbolSearchDialog from "@/components/symbol-search-dialog";
import { SearchItem } from "@/api/YahooSearch";
import { Button } from "@/components/ui/button";
import { Activity, DollarSign } from "lucide-react";
import { usePortfolioMutation } from "@/components/portfolio/usePortfolioMutation";
import { useUser } from "@/components/user";
import {
  convertCandlestickDataCurrency,
  convertHoldingCurrency,
  holdingQueryKey,
  portfolioQueryKey,
} from "@/components/portfolio/utils";

export const Route = createFileRoute("/_app/portfolio/$portfolioId")({
  component: MyPortfolio,
  beforeLoad: mustBeAuthenticated,
});

function MyPortfolio() {
  const { portfolioId } = Route.useParams();
  const { currency } = useUser();
  const [chartType, setChartType] = useState<"area" | "candlestick">("area");
  const [symbolSearchOpen, setSymbolSearchOpen] = useState(false);
  const { addHoldingMutation } = usePortfolioMutation();

  const { data: portfolio } = useQuery({
    queryKey: portfolioQueryKey(portfolioId, currency),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      getPortfolio(portfolioId).then(async (portfolio) => {
        const conversionQueries: Promise<PortfolioHolding>[] = [];
        portfolio.holdings.forEach((holding) => {
          conversionQueries.push(
            convertHoldingCurrency({
              holding,
              toCurrency: currency,
            }),
          );
        });
        return Promise.all(conversionQueries).then((holdings) => ({
          ...portfolio,
          holdings,
        }));
      }),
  });

  const holdingsWithTransactions = useMemo(
    () => portfolio?.holdings?.filter((holding) => holding.transactions.length > 0) ?? [],
    [portfolio],
  );

  const symbolQueries = useQueries({
    queries: holdingsWithTransactions.map((entry) => {
      const symbol = entry.symbol;
      const from = entry.transactions?.sort((a, b) => a.time - b.time)[0].time;
      const to = dayjs().utc().unix();
      return {
        queryKey: holdingQueryKey(portfolioId, symbol, currency),
        placeholderData: keepPreviousData,
        queryFn: async () =>
          getSymbolChart({
            symbol,
            from,
            to,
          }).then((data) =>
            convertCandlestickDataCurrency({
              data,
              fromCurrency: entry.currency,
              toCurrency: currency,
            }),
          ),
        refetchOnWindowFocus: false,
      };
    }),
  });

  const portfolioSymbolsData = useMemo(() => {
    return holdingsWithTransactions
      .map(({ symbol }, index) => ({
        [symbol]: symbolQueries[index].data,
      }))
      .reduce((acc, curr) => ({ ...acc, ...curr }), {}) as Record<
      string,
      CandlestickData[]
    >;
  }, [holdingsWithTransactions, symbolQueries]);

  const addHolding = useCallback(
    async (item: SearchItem) => {
      const newHolding = {
        symbol: item.symbol,
        shortName: item.shortName,
        type: item.quoteType,
        currency: "USD", // placeholder, should be fetched from quote in API
        transactions: [],
      };
      await addHoldingMutation.mutateAsync({ portfolioId, newHolding });
    },
    [addHoldingMutation, portfolioId],
  );

  const { portfolioChartData, costBasisChartData } = usePortfolioChartData({
    portfolio: portfolio ?? null,
    symbolDataMap: portfolioSymbolsData,
  });

  const hasTransactions = holdingsWithTransactions.length > 0;

  return (
    <div className="w-full h-full">
      <Card className="min-h-full">
        <CardHeader className="flex flex-row items-center w-full h-max pb-4 space-y-0 space-x-2">
          <p className="text-2xl font-semibold">{portfolio?.name ?? ""}</p>
          {hasTransactions && (
            <ChartTypeToggle defaultChartType="area" onToggle={setChartType} />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {hasTransactions && (
              <PortfolioChart
                data={portfolioChartData}
                costBasisData={costBasisChartData}
                height={400}
                type={chartType}
              />
            )}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="justify-start p-2 h-max"
                onClick={() => setSymbolSearchOpen(true)}
              >
                <span className="p-1 rounded-sm bg-indigo-500 text-white mr-2">
                  <Activity className="w-4 h-4" />
                </span>
                Add Stock, ETF, Crypto, etc.
              </Button>
              <Button variant="secondary" className="justify-start p-2 h-max">
                <span className="p-1 rounded-sm bg-emerald-600 text-white mr-2">
                  <DollarSign className="w-4 h-4" />
                </span>
                Add Cash Transaction
              </Button>
            </div>
            {portfolio && <PortfolioTable portfolio={portfolio} />}
          </div>
        </CardContent>
      </Card>
      {symbolSearchOpen && (
        <SymbolSearchDialog
          isOpen={symbolSearchOpen}
          onOpenChange={setSymbolSearchOpen}
          onSelect={(item) => {
            setSymbolSearchOpen(false);
            addHolding(item);
          }}
        />
      )}
    </div>
  );
}
