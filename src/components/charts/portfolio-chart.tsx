// import { hexTransp } from "@/lib/utils";
import {
  createChart,
  LastPriceAnimationMode,
  LineStyle,
  type CandlestickData,
  type DeepPartial,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type TimeChartOptions,
  type UTCTimestamp,
} from "lightweight-charts";
import { useRef, useCallback, useEffect, useState } from "react";
import useChartOptions from "./useChartOptions";
import type { CostBasisData } from "@/api/portfolio";
import colors from "tailwindcss/colors";
import { useTheme, type Theme } from "@/components/theme-provider";
import ChartTooltip from "./chart-tooltip";
import { cn, dayjs, hexTransp, usd } from "@/lib/utils";
import { Badge } from "../ui/badge";

export const PortfolioChart = (props: {
  data: CandlestickData<UTCTimestamp>[];
  costBasisData: CostBasisData[];
  type: "area" | "candlestick";
  height?: number;
}) => {
  const { data, costBasisData, type, height } = props;
  const { theme } = useTheme();
  const [tooltip, setTooltip] = useState<{
    time: UTCTimestamp;
    value: number;
    percentChange: number;
  } | null>(null);
  const parentContainerRef = useRef<HTMLDivElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart>>();
  const portfolioSeriesRef = useRef<
    ISeriesApi<"Area", Time> | ISeriesApi<"Candlestick">
  >();
  const costBasisSeriesRef = useRef<ISeriesApi<"Line", Time>>();

  const { options } = useChartOptions();

  const getLastBar = useCallback(() => {
    const lastData = data[data.length - 1];
    const costBasis = costBasisData[costBasisData.length - 1];
    return {
      time: lastData.time,
      value: lastData.close,
      percentChange: lastData.close / costBasis.value - 1,
    };
  }, [costBasisData, data]);

  const handleUpdateTooltip = useCallback(
    (param: MouseEventParams<Time>) => {
      if (!portfolioSeriesRef.current || !costBasisSeriesRef.current) return;
      let validCrosshairPoint = true;
      if (!param || !param.point) validCrosshairPoint = false;
      if (param.point && (param.point.x < 0 || param.point.y < 0))
        validCrosshairPoint = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bar: any = validCrosshairPoint
        ? param.seriesData.get(portfolioSeriesRef.current)
        : getLastBar();

      if (!bar) return;
      const time = bar.time;
      const price = bar.value !== undefined ? bar.value : bar.close;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const costBasis: any = param.seriesData.get(costBasisSeriesRef.current);
      if (!costBasis) return;
      const percentChange =
        bar.percentChange !== undefined
          ? bar.percentChange
          : costBasis.value
            ? (price / costBasis.value - 1) * 100
            : 0;
      setTooltip({ time, value: price, percentChange });
    },
    [getLastBar],
  );

  const handleCreateChart = useCallback(
    (params: {
      data: CandlestickData<UTCTimestamp>[];
      costBasisData: CostBasisData[];
      type: "area" | "candlestick";
      options: DeepPartial<TimeChartOptions>;
      theme: Theme;
    }) => {
      const { data, costBasisData, options, type } = params;
      if (chartRef.current || !chartContainerRef.current) return;
      const chart = createChart(chartContainerRef.current, options);
      chartRef.current = chart;

      let portfolioSeries;
      if (type === "area") {
        portfolioSeries = chart.addAreaSeries({
          lastPriceAnimation: LastPriceAnimationMode.Continuous,
          lineColor: colors.blue[500],
          topColor: hexTransp(colors.blue[500], 50),
          bottomColor: hexTransp(colors.blue[500], 5),
        });
        portfolioSeries.setData(
          data.map((entry) => ({ time: entry.time, value: entry.close })),
        );
      } else {
        portfolioSeries = chart.addCandlestickSeries();
        portfolioSeries.setData(data);
      }
      portfolioSeriesRef.current = portfolioSeries;
      const costBasisSeries = chart.addLineSeries({
        color: colors.gray[500],
        lineWidth: 2,
        lineStyle: LineStyle.LargeDashed,
      });
      costBasisSeries.setData(costBasisData);
      costBasisSeriesRef.current = costBasisSeries;
      chart.timeScale().fitContent();
      setTooltip(getLastBar());
    },
    [getLastBar],
  );

  const initContainerRef = useCallback(
    (node: HTMLDivElement) => {
      if (!node) return;
      chartContainerRef.current = node;
      handleCreateChart({ data, costBasisData, options, theme, type });
    },
    [costBasisData, data, handleCreateChart, options, theme, type],
  );

  const addChartEventListeners = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.subscribeCrosshairMove(handleUpdateTooltip);
  }, [handleUpdateTooltip]);

  const removeChartEventListeners = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.unsubscribeCrosshairMove(handleUpdateTooltip);
  }, [handleUpdateTooltip]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    try {
      chart.remove();
    } catch (e) {
      null;
    }
    chartRef.current = undefined;
    handleCreateChart({ data, costBasisData, options, theme, type });
    addChartEventListeners();
    return removeChartEventListeners;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, type]);

  return (
    <div
      ref={parentContainerRef}
      className="flex w-full overflow-hidden relative"
      style={{ height: height ?? 400 }}
    >
      <div className="absolute w-full h-full">
        <div ref={initContainerRef} />
        {tooltip && tooltip.time && tooltip.value ? (
          <ChartTooltip
            time={dayjs(tooltip.time * 1000)
              .utc()
              .format("MMMM D, YYYY")}
            value={
              <div className="flex items-center space-x-3">
                <p>{usd(tooltip.value)}</p>
                <Badge
                  className={cn(
                    "h-7 px-2 text-lg",
                    tooltip.percentChange <= 0 ? "bg-red-500" : "bg-green-500",
                  )}
                >
                  {tooltip.percentChange.toFixed(2)}%
                </Badge>
              </div>
            }
          />
        ) : null}
      </div>
    </div>
  );
};
