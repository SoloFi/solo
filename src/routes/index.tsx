import { CandlestickChart } from "@/components/charts/candlestick-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { UTCTimestamp } from "lightweight-charts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartTypeToggle } from "@/components/charts/chart-type-toggle";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [chartType, setChartType] = useState<"area" | "candlestick">("area");
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["total-assets"],
    queryFn: async () => {
      const response = await fetch("/api/btcusd");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const timestamp = data?.chart?.result?.[0]?.timestamp as UTCTimestamp[];
      const quote = data?.chart?.result?.[0]?.indicators?.quote[0] as {
        close: number[];
        high: number[];
        low: number[];
        open: number[];
      };
      if (!timestamp || !quote) throw new Error("Invalid data");
      const candlestickData = timestamp
        .map((time, index) => ({
          time: time,
          open: quote.open[index],
          high: quote.high[index],
          low: quote.low[index],
          close: quote.close[index],
        }))
        .filter((data) => {
          // remove any data with a null value
          return Object.values(data).every((value) => value !== null);
        });
      const areaData = candlestickData.map((data) => ({
        time: data.time,
        value: data.close,
      }));
      return { candlestickData, areaData };
    },
  });

  useEffect(() => {
    console.log(data);
  }, [data]);

  if (isPending) {
    return <span>Loading...</span>;
  }

  if (isError) {
    return <span>Error: {error.message}</span>;
  }

  return (
    <div className="w-full h-full">
      <div>
        <Card>
          <CardHeader>
            <div className="flex">
              <div>
                <h1 className="text-2xl font-bold">BTC/USD</h1>
                <p className="text-sm text-gray-500">Bitcoin to US Dollar</p>
              </div>
              <div className="ml-auto mt-auto">
                <ChartTypeToggle
                  defaultChartType={chartType}
                  onToggle={setChartType}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[350px]">
              {chartType === "candlestick" ? (
                <CandlestickChart data={data.candlestickData} />
              ) : (
                <AreaChart data={data.areaData} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
