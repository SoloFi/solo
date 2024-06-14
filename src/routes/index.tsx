import { ChartComponent } from "@/components/chart";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="w-full h-full">
      <h1 className="text-3xl font-bold">My Assets</h1>
      <div className="w-full h-[350px]">
        <ChartComponent
          data={[
            { time: "2018-12-22", value: 32.51 },
            { time: "2018-12-23", value: 31.11 },
            { time: "2018-12-24", value: 27.02 },
            { time: "2018-12-25", value: 27.32 },
            { time: "2018-12-26", value: 25.17 },
            { time: "2018-12-27", value: 28.89 },
            { time: "2018-12-28", value: 25.46 },
            { time: "2018-12-29", value: 23.92 },
            { time: "2018-12-30", value: 22.68 },
            { time: "2018-12-31", value: 22.67 },
          ]}
        />
      </div>
    </div>
  );
}
