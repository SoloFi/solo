// import { hexTransp } from "@/lib/utils";
import {
  createChart,
  type CandlestickData,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import useChartOptions from "./useChartOptions";

export const CandlestickChart = (props: {
  data: CandlestickData<UTCTimestamp>[];
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

    const newSeries = chart.addCandlestickSeries();
    newSeries.setData(data);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      chart.remove();
    };
  }, [data, height, options]);

  return <div ref={chartContainerRef} />;
};
