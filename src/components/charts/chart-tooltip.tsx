import type { ReactNode } from "react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

export default function ChartTooltip(props: {
  time?: ReactNode;
  value?: ReactNode;
  percentChange?: number;
}) {
  const { time, value, percentChange = 0 } = props;
  return (
    <div className="absolute z-10 top-0 left-0">
      <div className="flex items-center space-x-3">
        <h1 className="text-3xl font-semibold">{value}</h1>
        <Badge
          className={cn(
            "h-7 px-2 text-lg text-white",
            percentChange <= 0 ? "!bg-red-600" : "!bg-green-600",
          )}
        >
          {percentChange.toFixed(2)}%
        </Badge>
      </div>
      <p className="text-lg text-muted-foreground">{time}</p>
    </div>
  );
}
