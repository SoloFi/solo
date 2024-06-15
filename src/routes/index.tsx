import { createFileRoute } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";
import { getSymbolChart, type CandlestickData } from "@/api/symbol";
import { getPortfolio } from "@/api/portfolio";
import { dayjs, usd } from "@/lib/utils";
import { usePortfolioChartData } from "@/components/portfolio/usePortfolioChartData";
import { PortfolioChart } from "@/components/charts/portfolio-chart";
import ChartTooltip from "@/components/charts/chart-tooltip";
import type { UTCTimestamp } from "lightweight-charts";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [chartType, setChartType] = useState<"area" | "candlestick">("area");
  const [tooltip, setTooltip] = useState<{ time: UTCTimestamp; value: number } | null>(
    null,
  );
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

  const doneFetching = symbolQueries.every((query) => query.isSuccess) && !isPending;
  const hasError = symbolQueries.some((query) => query.isError) || isError;

  const { candlestickData, costBasisData } = usePortfolioChartData({
    holdings: doneFetching ? portfolio?.holdings : undefined,
    data: doneFetching
      ? portfolio?.holdings
          .map(({ symbol }, index) => ({
            [symbol]: symbolQueries[index].data,
          }))
          .reduce(
            (acc, curr) => ({ ...acc, ...curr }),
            {} as Record<string, CandlestickData[]>,
          )
      : undefined,
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
            <div className="flex items-center">
              <h1 className="text-3xl font-bold">{portfolio.name}</h1>
              <div className="ml-auto mt-auto">
                <ChartTypeToggle defaultChartType={chartType} onToggle={setChartType} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full relative">
              <PortfolioChart
                data={candlestickData}
                costBasisData={costBasisData}
                type={chartType}
                onTooltipChange={setTooltip}
              />
              <ChartTooltip
                time={
                  tooltip?.time
                    ? dayjs(tooltip?.time * 1000)
                        .utc()
                        .format("MMMM D, YYYY")
                    : ""
                }
                value={usd(tooltip?.value || 0)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
