import { CandlestickData } from "@/api/types";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";
import { PortfolioChart } from "@/components/charts/portfolio-chart";
import { PortfolioTable } from "@/components/portfolio/portfolio-table";
import { usePortfolioChartData } from "@/components/portfolio/usePortfolioChartData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dayjs } from "@/lib/utils";
import { getPortfolio } from "@/query/portfolio";
import { getSymbolChart } from "@/query/symbol";
import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { mustBeAuthenticated } from "../-utils";

export const Route = createFileRoute("/_app/portfolio/$portfolioId")({
  component: Portfolio,
  beforeLoad: mustBeAuthenticated,
});

function Portfolio() {
  const { portfolioId } = Route.useParams();
  const [chartType, setChartType] = useState<"area" | "candlestick">("area");

  const { data: portfolio, isPending } = useQuery({
    queryKey: ["portfolio", portfolioId],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => getPortfolio(portfolioId),
  });

  const symbolQueries = useQueries({
    queries: portfolio?.holdings
      ? portfolio.holdings
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
  // const hasError = useMemo(
  //   () => symbolQueries.some((query) => query.isError) || isError,
  //   [symbolQueries, isError],
  // );

  const portfolioSymbolsData = useMemo(() => {
    if (!doneFetching) {
      return {};
    }

    return portfolio?.holdings
      ? portfolio.holdings
          .map(({ symbol }, index) => ({
            [symbol]: symbolQueries[index].data,
          }))
          .reduce(
            (acc, curr) => ({ ...acc, ...curr }),
            {} as Record<string, CandlestickData[]>,
          )
      : {};
  }, [portfolio?.holdings, symbolQueries, doneFetching]);

  const { portfolioData, costBasisData } = usePortfolioChartData({
    holdings: doneFetching && portfolio?.holdings ? portfolio.holdings : null,
    data: doneFetching && portfolioSymbolsData ? portfolioSymbolsData : null,
  });

  return (
    <div className="w-full h-full">
      <Card className="min-h-full">
        <CardHeader className="flex flex-row items-center w-full h-max pb-4 space-y-0 space-x-2">
          <p className="text-2xl font-semibold">{portfolio?.name ?? ""}</p>
          <ChartTypeToggle defaultChartType="area" onToggle={setChartType} />
        </CardHeader>
        <CardContent>
          {portfolio && (
            <div className="flex flex-col gap-4">
              <PortfolioChart
                data={portfolioData}
                costBasisData={costBasisData}
                height={400}
                type={chartType}
              />
              <PortfolioTable
                holdings={portfolio.holdings}
                symbolsData={portfolioSymbolsData ?? {}}
              />
            </div>
          )}
          {/* <PortfolioEditor onPortfolioUpdate={console.log} /> */}
        </CardContent>
      </Card>
    </div>
  );
}
