import { SearchItem } from "@/api/YahooSearch";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";
import { PortfolioChart } from "@/components/charts/portfolio-chart";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";
import { usePortfolioChartData } from "@/components/portfolio/usePortfolioChartData";
import { usePortfolioMutation } from "@/components/portfolio/usePortfolioMutation";
import {
  getHoldingsWithTransactions,
  portfolioQueryKey,
} from "@/components/portfolio/utils";
import SymbolSearchDialog from "@/components/symbol-search-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPortfolio } from "@/query/portfolio";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, DollarSign } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { mustBeAuthenticated } from "../-utils";

export const Route = createFileRoute("/_app/portfolio/$portfolioId")({
  component: MyPortfolio,
  beforeLoad: mustBeAuthenticated,
});

function MyPortfolio() {
  const { portfolioId } = Route.useParams();
  const [chartType, setChartType] = useState<"area" | "candlestick">("area");
  const [symbolSearchOpen, setSymbolSearchOpen] = useState(false);
  const { addHoldingMutation } = usePortfolioMutation();

  const { data: portfolio } = useQuery({
    queryKey: portfolioQueryKey(portfolioId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    queryFn: async () => getPortfolio(portfolioId),
  });

  const { portfolioChartData, costBasisChartData } = usePortfolioChartData({
    portfolioId: portfolioId,
    holdings: portfolio?.holdings ?? [],
  });

  const addHolding = useCallback(
    async (item: SearchItem) => {
      await addHoldingMutation.mutateAsync({
        portfolioId,
        newHolding: {
          symbol: item.symbol,
          shortName: item.shortName,
          type: item.quoteType,
          currency: "USD", // placeholder, should be fetched from quote in API
          transactions: [],
        },
      });
    },
    [addHoldingMutation, portfolioId],
  );

  const holdingsWithTransactions = useMemo(
    () => getHoldingsWithTransactions(portfolio?.holdings),
    [portfolio?.holdings],
  );

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
            {portfolio && (
              <PortfolioTable
                holdings={portfolio.holdings}
                portfolioId={portfolio.id}
              />
            )}
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
