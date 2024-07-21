import type { CandlestickData } from "@/api/types";
import { useTheme, type Theme } from "@/components/theme-provider";
import { dayjs, formatCurrency, hexTransp, percentChange } from "@/lib/utils";
import {
  AreaData,
  createChart,
  LastPriceAnimationMode,
  LineData,
  LineStyle,
  PriceScaleMode,
  type DeepPartial,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type TimeChartOptions,
  type UTCTimestamp,
} from "lightweight-charts";
import { useCallback, useEffect, useRef, useState } from "react";
import colors from "tailwindcss/colors";
import { useUser } from "../user";
import ChartTooltip from "./chart-tooltip";
import ChartWrapper from "./chart-wrapper";
import ToggleAxisMode from "./toggle-axis-mode";
import useChartOptions from "./useChartOptions";

export const PortfolioChart = (props: {
  data: CandlestickData[];
  costBasisData: LineData<UTCTimestamp>[];
  height?: number;
  type?: "area" | "candlestick";
}) => {
  const { data, costBasisData, height, type = "area" } = props;
  const { theme } = useTheme();
  const { currency: userCurrency } = useUser();

  const [tooltip, setTooltip] = useState<{
    time: UTCTimestamp;
    value: number;
    percentChange: number;
  } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart>>();
  const areaSeriesRef = useRef<ISeriesApi<"Area", Time>>();
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick", Time>>();
  const costBasisSeriesRef = useRef<ISeriesApi<"Line", Time>>();
  const [axisMode] = useState<PriceScaleMode>(PriceScaleMode.Logarithmic);

  const options = useChartOptions({
    rightPriceScale: { mode: axisMode },
  });

  const getLastTooltipValue = useCallback(() => {
    const lastData = data[data.length - 1];
    const costBasis = costBasisData[costBasisData.length - 1];
    return {
      time: lastData.time,
      value: lastData.close,
      percentChange:
        lastData && costBasis ? percentChange(costBasis.value, lastData.close) : 0,
    };
  }, [costBasisData, data]);

  const handleUpdateTooltip = useCallback(
    (param: MouseEventParams<Time>) => {
      let validCrosshairPoint = true;
      if (!param || !param.point) validCrosshairPoint = false;
      if (param.point && (param.point.x < 0 || param.point.y < 0))
        validCrosshairPoint = false;

      if (!validCrosshairPoint) {
        setTooltip(getLastTooltipValue());
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
      const change = costBasis.value
        ? percentChange(costBasis.value, bar.value ?? bar.close)
        : 0;
      setTooltip({
        time: bar.time,
        value: bar.value ?? bar.close,
        percentChange: change,
      });
    },
    [getLastTooltipValue, type],
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
          topColor: hexTransp(colors.blue[500], 60),
          bottomColor: hexTransp(colors.blue[500], 10),
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
        priceLineVisible: false,
        autoscaleInfoProvider() {
          // prevent autoscale from including cost basis line
          return null;
        },
      });
      costBasisSeries.setData(costBasisData);
      costBasisSeriesRef.current = costBasisSeries;
      chart.timeScale().fitContent();
    },
    [],
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
    if (data.length === 0) return;
    handleCreateChart({ data, costBasisData, options, theme, type });
    addChartEventListeners();
    setTooltip(getLastTooltipValue());
    return removeChartEventListeners;
  }, [
    addChartEventListeners,
    costBasisData,
    data,
    getLastTooltipValue,
    handleCreateChart,
    options,
    removeChartEventListeners,
    theme,
    type,
  ]);

  return (
    <ChartWrapper height={height ?? 400}>
      {!!tooltip && (
        <ChartTooltip
          time={dayjs(tooltip.time * 1000)
            .utc()
            .format("MMMM D, YYYY")}
          value={formatCurrency(tooltip.value, userCurrency)}
          percentChange={tooltip.percentChange}
        />
      )}
      <ToggleAxisMode defaultMode={axisMode} chartRef={chartRef} />
      <div ref={initContainerRef} />
    </ChartWrapper>
  );
};
