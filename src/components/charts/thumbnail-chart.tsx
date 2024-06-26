import { hexTransp } from "@/lib/utils";
import {
  CrosshairMode,
  IChartApi,
  createChart,
  type AreaData,
  type UTCTimestamp,
} from "lightweight-charts";
import { useCallback, useEffect, useRef } from "react";
import colors from "tailwindcss/colors";
import useChartOptions from "./useChartOptions";
import ChartWrapper from "./chart-wrapper";

export const ThumbnailChart = (props: {
  data: AreaData<UTCTimestamp>[];
  color?: string;
  height?: number;
}) => {
  const { data, color = colors.blue[500], height = 150 } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const options = useChartOptions({
    height,
    rightPriceScale: { visible: false },
    timeScale: { visible: false },
    crosshair: {
      mode: CrosshairMode.Hidden,
    },
    handleScroll: false,
    handleScale: false,
  });

  const fitContent = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().fitContent();
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, options);
    chartRef.current = chart;
    const areaSeries = chart.addAreaSeries({
      lineColor: color,
      lineWidth: 2,
      topColor: hexTransp(color, 75),
      bottomColor: hexTransp(color, 25),
      priceLineVisible: false,
    });
    areaSeries.setData(data);
    fitContent();
    window.addEventListener("resize", fitContent);
    return () => {
      chart.remove();
      window.removeEventListener("resize", fitContent);
    };
  }, [color, data, fitContent, height, options]);

  return (
    <ChartWrapper height={height}>
      <div ref={chartContainerRef} />
    </ChartWrapper>
  );
};
