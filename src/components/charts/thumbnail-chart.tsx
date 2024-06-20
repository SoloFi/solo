import { hexTransp } from "@/lib/utils";
import {
  CrosshairMode,
  createChart,
  type AreaData,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
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
  const { options } = useChartOptions({
    height,
    rightPriceScale: { visible: false },
    timeScale: { visible: false },
    crosshair: {
      mode: CrosshairMode.Hidden,
    },
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, options);
    const areaSeries = chart.addAreaSeries({
      lineColor: color,
      lineWidth: 2,
      topColor: hexTransp(color, 90),
      bottomColor: hexTransp(color, 10),
      priceLineVisible: false,
    });
    areaSeries.setData(data);
    chart.timeScale().fitContent();
    return () => {
      chart.remove();
    };
  }, [color, data, height, options]);

  return (
    <ChartWrapper height={height}>
      <div ref={chartContainerRef} />
    </ChartWrapper>
  );
};
