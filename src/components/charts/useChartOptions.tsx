import { useTheme } from "@/components/theme/useTheme";
import {
  ColorType,
  DeepPartial,
  PriceScaleMode,
  TimeChartOptions,
} from "lightweight-charts";
import merge from "lodash/merge";
import { useMemo, useState } from "react";
import colors from "tailwindcss/colors";

export default function useChartOptions(
  options?: DeepPartial<TimeChartOptions>,
) {
  const { theme } = useTheme();
  const [overrideOptions] = useState(options);

  const mergedOptions = useMemo(() => {
    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme === "dark" ? colors.zinc[300] : colors.zinc[700],
        fontFamily: "Geist",
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      rightPriceScale: {
        mode: PriceScaleMode.Logarithmic,
      },
      timeScale: {
        lockVisibleTimeRangeOnResize: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      autoSize: true,
      height: 400,
    } satisfies DeepPartial<TimeChartOptions>;
    return merge(chartOptions, overrideOptions);
  }, [overrideOptions, theme]);

  return mergedOptions;
}
