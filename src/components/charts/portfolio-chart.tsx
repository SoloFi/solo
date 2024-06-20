import {
  AreaData,
  createChart,
  LastPriceAnimationMode,
  LineData,
  LineStyle,
  type DeepPartial,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type TimeChartOptions,
  type UTCTimestamp,
} from "lightweight-charts";
import { useRef, useCallback, useEffect, useState } from "react";
import useChartOptions from "./useChartOptions";
import colors from "tailwindcss/colors";
import { useTheme, type Theme } from "@/components/theme-provider";
import ChartTooltip from "./chart-tooltip";
import { cn, dayjs, hexTransp, usd } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { CandlestickData } from "@/api/symbol";

export const PortfolioChart = (props: {
  data: CandlestickData[];
  costBasisData: LineData<UTCTimestamp>[];
  height?: number;
  type?: "area" | "candlestick";
}) => {
  const { data, costBasisData, height, type = "area" } = props;
  const { theme } = useTheme();
  const [tooltip, setTooltip] = useState<{
    time: UTCTimestamp;
    value: number;
    percentChange: number;
  } | null>(null);
  const parentContainerRef = useRef<HTMLDivElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart>>();
  const areaSeriesRef = useRef<ISeriesApi<"Area", Time>>();
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick", Time>>();
  const costBasisSeriesRef = useRef<ISeriesApi<"Line", Time>>();

  const { options } = useChartOptions();

  const getLastBar = useCallback(() => {
    const lastData = data[data.length - 1];
    const costBasis = costBasisData[costBasisData.length - 1];
    return {
      time: lastData.time,
      value: lastData.close,
      percentChange: lastData && costBasis ? lastData.close / costBasis.value - 1 : 0,
    };
  }, [costBasisData, data]);

  const handleUpdateTooltip = useCallback(
    (param: MouseEventParams<Time>) => {
      let validCrosshairPoint = true;
      if (!param || !param.point) validCrosshairPoint = false;
      if (param.point && (param.point.x < 0 || param.point.y < 0))
        validCrosshairPoint = false;

      if (!validCrosshairPoint) {
        setTooltip(getLastBar());
        return;
      }
      let bar: CandlestickData & AreaData<UTCTimestamp>;
      if (type === "area") {
        if (!areaSeriesRef.current) return;
        bar = param.seriesData.get(areaSeriesRef.current) as typeof bar;
      } else {
        if (!candlestickSeriesRef.current) return;
        bar = param.seriesData.get(candlestickSeriesRef.current) as typeof bar;
      }
      if (!bar || !costBasisSeriesRef.current) return;
      const costBasis = param.seriesData.get(
        costBasisSeriesRef.current,
      ) as LineData<UTCTimestamp>;
      const percentChange = costBasis.value
        ? ((bar.value ?? bar.close) / costBasis.value - 1) * 100
        : 0;
      setTooltip({ time: bar.time, value: bar.value ?? bar.close, percentChange });
    },
    [getLastBar, type],
  );

  const handleCreateChart = useCallback(
    (params: {
      data: CandlestickData[];
      costBasisData: LineData<UTCTimestamp>[];
      options: DeepPartial<TimeChartOptions>;
      theme: Theme;
      type: "area" | "candlestick";
    }) => {
      const { data, costBasisData, options, type } = params;
      if (chartRef.current || !chartContainerRef.current) return;
      const chart = createChart(chartContainerRef.current, options);
      chartRef.current = chart;

      if (type === "area") {
        const areaSeries = chart.addAreaSeries({
          lastPriceAnimation: LastPriceAnimationMode.Continuous,
          lineColor: colors.blue[500],
          topColor: hexTransp(colors.blue[500], 50),
          bottomColor: hexTransp(colors.blue[500], 5),
        });
        areaSeries.setData(data.map((d) => ({ value: d.close, ...d })));
        areaSeriesRef.current = areaSeries;
      } else {
        const candlestickSeries = chart.addCandlestickSeries();
        candlestickSeries.setData(data);
        candlestickSeriesRef.current = candlestickSeries;
      }
      const costBasisSeries = chart.addLineSeries({
        color: colors.gray[500],
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        autoscaleInfoProvider() {
          // prevent autoscale from including cost basis line
          return null;
        },
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
        {tooltip?.time && tooltip?.value ? (
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
