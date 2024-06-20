import {
  ColorType,
  DeepPartial,
  PriceScaleMode,
  TimeChartOptions,
} from "lightweight-charts";
import { useMemo } from "react";
import { useTheme } from "../theme-provider";
import colors from "tailwindcss/colors";
import merge from "lodash/merge";

export default function useChartOptions(options = {} as DeepPartial<TimeChartOptions>) {
  const { theme } = useTheme();
  const _options = useMemo(() => {
    return merge(
      {
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
        autoSize: true,
        height: 400,
      } satisfies DeepPartial<TimeChartOptions>,
      options,
    );
  }, [options, theme]);

  return { options: _options };
}
