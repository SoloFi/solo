import { ChartComponent } from "@/components/chart";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["total-assets"],
    queryFn: async () => {
      const response = await fetch("/api/btcusd");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      const timestamp = data?.chart?.result?.[0]?.timestamp as number[];
      const quote = data?.chart?.result?.[0]?.indicators?.quote[0] as {
        close: number[];
        high: number[];
        low: number[];
        open: number[];
      };
      if (!timestamp || !quote) throw new Error("Invalid data");
      return timestamp
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
      <h1 className="text-3xl font-bold">My Assets</h1>
      <div className="w-full h-[350px]">
        <ChartComponent data={data} />
      </div>
    </div>
  );
}
