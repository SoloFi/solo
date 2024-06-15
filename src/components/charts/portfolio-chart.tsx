// import { hexTransp } from "@/lib/utils";
import {
  createChart,
  LastPriceAnimationMode,
  LineStyle,
  type CandlestickData,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useCallback, useLayoutEffect, memo } from "react";
import useChartOptions from "./useChartOptions";
import type { CostBasisData } from "@/api/portfolio";
import colors from "tailwindcss/colors";
import { useTheme } from "@/components/theme-provider";

export const PortfolioChart = memo(
  (props: {
    data: CandlestickData<UTCTimestamp>[];
    costBasisData: CostBasisData[];
    type: "area" | "candlestick";
    height?: number;
    onTooltipChange?: (tooltip: { time: UTCTimestamp; value: number }) => void;
  }) => {
    const { data, costBasisData, type, height = 400, onTooltipChange } = props;
    const { theme } = useTheme();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const { options } = useChartOptions({
      width: chartContainerRef.current?.clientWidth,
      height,
    });

    const getLastBar = useCallback(() => {
      const lastData = data[data.length - 1];
      return {
        time: lastData.time,
        value: lastData.close,
      };
    }, [data]);

    useLayoutEffect(() => {
      onTooltipChange?.(getLastBar());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!chartContainerRef.current) return;
      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
      };
      const chart = createChart(chartContainerRef.current, options);

      let portfolioSeries;
      if (type === "area") {
        portfolioSeries = chart.addAreaSeries({
          lastPriceAnimation: LastPriceAnimationMode.Continuous,
        });
        portfolioSeries.setData(
          data.map((entry) => ({ time: entry.time, value: entry.close })),
        );
      } else {
        portfolioSeries = chart.addCandlestickSeries();
        portfolioSeries.setData(data);
      }
      const costBasisSeries = chart.addLineSeries({
        color: colors.zinc[theme === "dark" ? 400 : 500],
        lineWidth: 2,
        lineStyle: LineStyle.LargeDashed,
      });
      costBasisSeries.setData(costBasisData);

      chart.timeScale().fitContent();

      const updateTooltip = (param: MouseEventParams<Time>) => {
        let validCrosshairPoint = true;
        if (!param || !param.point) validCrosshairPoint = false;
        if (param.point && (param.point.x < 0 || param.point.y < 0))
          validCrosshairPoint = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bar: any = validCrosshairPoint
          ? param.seriesData.get(portfolioSeries)
          : getLastBar();
        if (!bar) return;
        const time = bar.time;
        const price = bar.value !== undefined ? bar.value : bar.close;
        onTooltipChange?.({ time, value: price });
      };
      chart.subscribeCrosshairMove(updateTooltip);

      window.addEventListener("resize", handleResize);
      return () => {
        console.log("cleanup");
        window.removeEventListener("resize", handleResize);
        chart.unsubscribeCrosshairMove(updateTooltip);
        chart.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [costBasisData, data, height, options, theme, type]);

    return <div ref={chartContainerRef} />;
  },
);
