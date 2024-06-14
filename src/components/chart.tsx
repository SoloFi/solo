import { hexTransp } from "@/lib/utils";
import { createChart, ColorType } from "lightweight-charts";
import { useEffect, useRef } from "react";
import colors from "tailwindcss/colors";
import { useTheme } from "./theme-provider";

export const ChartComponent = (props: {
  data: { time: string; value: number }[];
  height?: number;
}) => {
  const { data, height = 350 } = props;
  const { theme } = useTheme();

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme === "dark" ? colors.zinc[300] : colors.zinc[700],
      },
      width: chartContainerRef.current.clientWidth,
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      height,
    });
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
  }, [data, theme]);

  return <div ref={chartContainerRef} />;
};
