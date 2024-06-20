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
    <div className="absolute top-0 left-0">
      <div className="flex items-center space-x-3">
        <p className="text-3xl font-semibold">{value}</p>
        <Badge
          className={cn(
            "h-7 px-2 text-lg",
            percentChange <= 0 ? "bg-red-500" : "bg-green-500",
          )}
        >
          {percentChange.toFixed(2)}%
        </Badge>
      </div>
      <div className="text-lg">{time}</div>
    </div>
  );
}
