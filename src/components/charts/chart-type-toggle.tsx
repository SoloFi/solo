import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, CandlestickChart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ChartTypeToggle = (props: {
  defaultChartType?: "area" | "candlestick";
  onToggle: (chartType: "area" | "candlestick") => void;
}) => {
  const { defaultChartType = "area", onToggle } = props;
  return (
    <Tabs
      defaultValue={defaultChartType}
      onValueChange={(value) => onToggle(value as "area" | "candlestick")}
    >
      <TabsList className="h-10">
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
