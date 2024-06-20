import { useState } from "react";
import { IChartApi, PriceScaleMode } from "lightweight-charts";
import { Toggle } from "../ui/toggle";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export default function ToggleAxisMode(props: {
  chartRef?: React.MutableRefObject<IChartApi | undefined>;
  side?: "left" | "right";
}) {
  const { chartRef, side = "right" } = props;
  const [mode, setMode] = useState(
    chartRef?.current?.options().rightPriceScale.mode === PriceScaleMode.Logarithmic
      ? PriceScaleMode.Logarithmic
      : PriceScaleMode.Normal,
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className={cn("absolute bottom-0", {
            "right-4": side === "right",
            "left-4": side === "left",
          })}
        >
          <Toggle
            defaultPressed={mode === PriceScaleMode.Logarithmic}
            onPressedChange={(pressed) => {
              chartRef?.current?.applyOptions({
                [side === "right" ? "rightPriceScale" : "leftPriceScale"]: {
                  mode: pressed ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
                },
              });
              setMode(pressed ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal);
            }}
            variant="outline"
            aria-label="Toggle axis mode"
            className="text-xs font-bold w-5 h-5 p-1.5 data-[state=on]:bg-primary"
          >
            L
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Toggle to {mode === PriceScaleMode.Logarithmic ? "linear" : "logarithmic"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
