import { CandlestickData, Portfolio, PortfolioHolding } from "@/api/types";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";
import { PortfolioChart } from "@/components/charts/portfolio-chart";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";
import { usePortfolioChartData } from "@/components/portfolio/usePortfolioChartData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dayjs } from "@/lib/utils";
import { getPortfolio, updatePortfolio } from "@/query/portfolio";
import { getSymbolChart } from "@/query/symbol";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { mustBeAuthenticated } from "../-utils";
import SymbolSearchDialog from "@/components/symbol-search-dialog";
import { SearchItem } from "@/api/YahooSearch";
import { Button } from "@/components/ui/button";
import { Activity, DollarSign } from "lucide-react";
import { queryClient } from "@/main";

export const Route = createFileRoute("/_app/portfolio/$portfolioId")({
  component: MyPortfolio,
  beforeLoad: mustBeAuthenticated,
});

function MyPortfolio() {
  const { portfolioId } = Route.useParams();
  const [chartType, setChartType] = useState<"area" | "candlestick">("area");
  const [symbolSearchOpen, setSymbolSearchOpen] = useState(false);

  const { data: portfolio, isPending } = useQuery({
    queryKey: ["portfolio", portfolioId],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => getPortfolio(portfolioId),
  });

  const hasTransactions = useMemo(
    () => portfolio?.holdings?.some((holding) => holding.transactions.length > 0),
    [portfolio],
  );

  const symbolQueries = useQueries({
    queries:
      hasTransactions && portfolio
        ? portfolio.holdings.map((entry) => {
            const symbol = entry.symbol;
            const from = entry.transactions?.sort((a, b) => a.time - b.time)[0].time;
            const to = dayjs().utc().unix();
            return {
              queryKey: [symbol],
              queryFn: async () =>
                getSymbolChart({
                  symbol,
                  from,
                  to,
                }),
              refetchOnWindowFocus: false,
            };
          })
        : [],
  });

  const portfolioMutation = useMutation({
    mutationFn: async (newPortfolio: Portfolio) => {
      return await updatePortfolio(newPortfolio.id, newPortfolio);
    },
    onMutate: async (newPortfolio) => {
      await queryClient.cancelQueries({ queryKey: ["portfolio", newPortfolio.id] });
      const previousPortfolio = queryClient.getQueryData(["portfolio", newPortfolio.id]);
      queryClient.setQueryData(["portfolio", newPortfolio.id], newPortfolio);
      return { previousPortfolio, newPortfolio };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["portfolio", context?.newPortfolio.id],
        context?.previousPortfolio,
      );
    },
    onSettled: (newPortfolio) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", newPortfolio.id] });
    },
  });

  const doneFetching = useMemo(
    () => symbolQueries.every((query) => query.isSuccess) && !isPending,
    [symbolQueries, isPending],
  );
  // const hasError = useMemo(
  //   () => symbolQueries.some((query) => query.isError) || isError,
  //   [symbolQueries, isError],
  // );

  const portfolioSymbolsData = useMemo(() => {
    return hasTransactions && portfolio
      ? portfolio.holdings
          .map(({ symbol }, index) => ({
            [symbol]: symbolQueries[index].data,
          }))
          .reduce(
            (acc, curr) => ({ ...acc, ...curr }),
            {} as Record<string, CandlestickData[]>,
          )
      : {};
  }, [hasTransactions, portfolio, symbolQueries]);

  const addHolding = useCallback(
    async (item: SearchItem) => {
      if (!portfolio) {
        return;
      }
      const newHoldings: PortfolioHolding[] = [...portfolio.holdings];
      // make sure the holding is not already in the list
      if (newHoldings.find((holding) => holding.symbol === item.symbol)) {
        return;
      }
      newHoldings.push({
        symbol: item.symbol,
        shortName: item.shortName,
        type: item.quoteType,
        transactions: [],
      });
      const newPortfolio = { ...portfolio, holdings: newHoldings };
      portfolioMutation.mutate(newPortfolio);
    },
    [portfolio, portfolioMutation],
  );

  const { portfolioData, costBasisData } = usePortfolioChartData({
    holdings: hasTransactions && portfolio ? portfolio.holdings : null,
    data: doneFetching && portfolioSymbolsData ? portfolioSymbolsData : null,
  });

  if (!doneFetching) {
    return <div>Loading...</div>;
  }

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
            {portfolio && hasTransactions && (
              <PortfolioChart
                data={portfolioData}
                costBasisData={costBasisData}
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
                Add Cash Balance
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
