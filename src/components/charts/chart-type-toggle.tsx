import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, CandlestickChart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const ChartTypeToggle = (props: {
  onToggle: (chartType: "area" | "candlestick") => void;
  defaultChartType?: "area" | "candlestick";
  className?: string;
}) => {
  const { onToggle, defaultChartType = "area", className } = props;
  return (
    <Tabs
      defaultValue={defaultChartType}
      onValueChange={(value) => onToggle(value as "area" | "candlestick")}
      className={cn("p-1", className)}
    >
      <TabsList className="h-8 shadow-inner">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="h-full">
              <TabsTrigger value="area" className="h-full">
                <AreaChart className="w-4 h-4" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Area chart</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="h-full">
              <TabsTrigger value="candlestick" className="h-full">
                <CandlestickChart className="w-4 h-4" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Candlestick chart</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TabsList>
    </Tabs>
  );
};
