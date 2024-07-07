import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { createFileRoute } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";
import type { CandlestickData } from "@/api/types";
import { usePortfolioChartData } from "@/components/portfolio/usePortfolioChartData";
import { PortfolioChart } from "@/components/charts/portfolio-chart";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";
import { getSymbolChart } from "@/query/symbol";
import { getPortfolios } from "@/query/portfolio";
import { checkAuth } from "@/check-auth";
import { PortfolioEditor } from "@/components/portfolio/portfolio-editor";

export const Route = createFileRoute("/_app/")({
  component: Index,
  beforeLoad: checkAuth,
});

function Index() {
  const [chartType, setChartType] = useState<"area" | "candlestick">("area");

  const {
    data: portfolios,
    error,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["portfolios"],
    queryFn: getPortfolios,
    refetchOnWindowFocus: false,
  });

  const symbolQueries = useQueries({
    queries: portfolios?.[0]?.holdings
      ? portfolios[0].holdings
          .filter(({ buys }) => buys && buys?.length > 0)
          .map((entry) => {
            const symbol = entry.symbol;
            const from = entry.buys?.sort((a, b) => a.time - b.time)[0].time;
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

  const doneFetching = useMemo(
    () => symbolQueries.every((query) => query.isSuccess) && !isPending,
    [symbolQueries, isPending],
  );
  const hasError = useMemo(
    () => symbolQueries.some((query) => query.isError) || isError,
    [symbolQueries, isError],
  );

  const portfolioSymbolsData = portfolios?.[0]?.holdings
    .map(({ symbol }, index) => ({
      [symbol]: symbolQueries[index].data,
    }))
    .reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {} as Record<string, CandlestickData[]>,
    );

  const { portfolioData, costBasisData } = usePortfolioChartData({
    holdings: doneFetching && portfolios?.[0]?.holdings ? portfolios[0].holdings : null,
    data: doneFetching && portfolioSymbolsData ? portfolioSymbolsData : null,
  });

  if (!doneFetching) {
    return <span>Loading...</span>;
  }

  if (hasError && error) {
    return <span>Error: {error.message}</span>;
  }

  const hasPortfolio = (portfolios?.length || 0) > 0;

  return (
    <div className="w-full h-full">
      <Card className="min-h-full">
        <CardHeader className="flex flex-row items-center w-full h-max pb-4 space-y-0 space-x-2">
          {hasPortfolio ? (
            <>
              <p className="text-2xl font-semibold">{portfolios?.[0]?.name ?? ""}</p>
              <ChartTypeToggle defaultChartType="area" onToggle={setChartType} />
            </>
          ) : (
            <h1 className="text-2xl font-semibold">Create a portfolio</h1>
          )}
        </CardHeader>
        <CardContent>
          {hasPortfolio ? (
            <>
              <PortfolioChart
                data={portfolioData}
                costBasisData={costBasisData}
                height={400}
                type={chartType}
              />
              <div className="mt-4">
                <PortfolioTable
                  holdings={portfolios?.[0]?.holdings ?? []}
                  symbolsData={portfolioSymbolsData ?? {}}
                />
              </div>
            </>
          ) : (
            <PortfolioEditor onPortfolioUpdate={console.log} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
