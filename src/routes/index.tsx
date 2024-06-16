import { createFileRoute } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";
import { getSymbolChart, type CandlestickData } from "@/api/symbol";
import { getPortfolio } from "@/api/portfolio";
import { dayjs } from "@/lib/utils";
import { usePortfolioChartData } from "@/components/portfolio/usePortfolioChartData";
import { PortfolioChart } from "@/components/charts/portfolio-chart";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [chartType, setChartType] = useState<"area" | "candlestick">("area");

  const {
    data: portfolio,
    error,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["portfolio"],
    queryFn: getPortfolio,
    refetchOnWindowFocus: false,
  });
  const symbolQueries = useQueries({
    queries: portfolio?.holdings
      ? portfolio?.holdings.map((entry) => {
          const symbol = entry.symbol;
          const buys = entry.buys;
          const from = buys[0].time;
          const to = dayjs().utc().unix() * 1000;
          return {
            queryKey: [symbol],
            queryFn: async () => {
              return getSymbolChart({
                symbol,
                from,
                to,
              });
            },
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

  const portfolioSymbolsData = portfolio?.holdings
    .map(({ symbol }, index) => ({
      [symbol]: symbolQueries[index].data,
    }))
    .reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {} as Record<string, CandlestickData[]>,
    );

  const { candlestickData, costBasisData } = usePortfolioChartData({
    holdings: doneFetching ? portfolio?.holdings : undefined,
    data: doneFetching ? portfolioSymbolsData : undefined,
  });

  if (!doneFetching) {
    return <span>Loading...</span>;
  }

  if (hasError && error) {
    return <span>Error: {error.message}</span>;
  }

  return (
    <div className="w-full h-full">
      <div>
        <Card>
          <CardHeader>
            <div className="flex">
              <h1 className="text-3xl font-bold min-w-[150px]">
                {portfolio?.name ?? ""}
              </h1>
              <div className="ml-auto mt-auto">
                <ChartTypeToggle defaultChartType={chartType} onToggle={setChartType} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PortfolioChart
              data={candlestickData}
              costBasisData={costBasisData}
              type={chartType}
              height={400}
            />
            <div className="mt-4">
              <PortfolioTable
                holdings={portfolio?.holdings ?? []}
                symbolsData={portfolioSymbolsData ?? {}}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
