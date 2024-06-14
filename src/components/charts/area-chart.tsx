import { hexTransp } from "@/lib/utils";
import {
  createChart,
  type AreaData,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import colors from "tailwindcss/colors";
import useChartOptions from "./useChartOptions";

export const AreaChart = (props: {
  data: AreaData<UTCTimestamp>[];
  height?: number;
}) => {
  const { data, height = 350 } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { options } = useChartOptions({
    width: chartContainerRef.current?.clientWidth,
    height,
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, options);
    chart.timeScale().fitContent();

    const newSeries = chart.addAreaSeries({
      lineColor: colors.blue[500],
      topColor: colors.blue[500],
      bottomColor: hexTransp(colors.blue[500], 0.4),
    });
    newSeries.setData(data);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      chart.remove();
    };
  }, [data, height, options]);

  return <div ref={chartContainerRef} />;
};
