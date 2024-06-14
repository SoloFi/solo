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
        <TabsTrigger value="area" className="h-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AreaChart className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Area chart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsTrigger>
        <TabsTrigger value="candlestick" className="h-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <CandlestickChart className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Candlestick chart</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
