import type { Portfolio } from "@/api/portfolio";
import type { CandlestickData } from "@/api/symbol";
import type { UTCTimestamp } from "lightweight-charts";
import { useMemo } from "react";

// Hook to transform portfolio holdings and symbol chart data into a format that can be used by the chart component
export const usePortfolioChartData = (props: {
  holdings?: Portfolio["holdings"];
  data?: Record<string, CandlestickData[] | undefined>;
}): {
  candlestickData: CandlestickData[];
  costBasisData: { time: UTCTimestamp; value: number }[];
} => {
  const { holdings, data } = props;

  const { candlestickData, costBasisData } = useMemo(() => {
    if (!holdings || !data) return { candlestickData: [], costBasisData: [] };
    const holdingsData = holdings.map(({ symbol, buys, sells }) => {
      const symbolData = data[symbol];
      if (!symbolData) {
        return { holdingOHLC: [], costBasisOverTime: [] };
      }
      const timeline = symbolData.map((entry) => entry.time);
      const sharesOverTime = timeline.map((time) => {
        const buyShares = buys
          .filter((buy) => buy.time <= time)
          .reduce((acc, buy) => acc + buy.quantity, 0);
        const sellShares = (sells || [])
          .filter((sell) => sell.time <= time)
          .reduce((acc, sell) => acc + sell.quantity, 0);
        return buyShares - sellShares;
      });
      const costBasisOverTime = timeline.map((time) => {
        const buyCost = buys
          .filter((buy) => buy.time <= time)
          .reduce((acc, buy) => acc + buy.price * buy.quantity, 0);
        const sellCost = (sells || [])
          .filter((sell) => sell.time <= time)
          .reduce((acc, sell) => acc + sell.price * sell.quantity, 0);
        return buyCost - sellCost;
      });
      const holdingOHLC = timeline.map((_, index) => {
        const { open, high, low, close } = symbolData[index];
        return {
          time: timeline[index],
          open: open * sharesOverTime[index],
          high: high * sharesOverTime[index],
          low: low * sharesOverTime[index],
          close: close * sharesOverTime[index],
          cost: costBasisOverTime[index],
        };
      });
      return { holdingOHLC, costBasisOverTime };
    });

    // Combine the OHLC data of all holdings using the timeline with the highest resolution
    const combinedTimeline = Array.from(
      new Set(
        holdingsData.flatMap(({ holdingOHLC }) => holdingOHLC.map((entry) => entry.time)),
      ),
    ).sort();

    const combinedData = combinedTimeline.map((time) => {
      const combinedEntry = holdingsData
        .map(({ holdingOHLC }) => holdingOHLC.find((entry) => entry.time === time))
        .filter((entry) => entry);
      const open = combinedEntry.reduce((acc, entry) => acc + (entry?.open ?? 0), 0);
      const high = combinedEntry.reduce((acc, entry) => acc + (entry?.high ?? 0), 0);
      const low = combinedEntry.reduce((acc, entry) => acc + (entry?.low ?? 0), 0);
      const close = combinedEntry.reduce((acc, entry) => acc + (entry?.close ?? 0), 0);
      const cost = combinedEntry.reduce((acc, entry) => acc + (entry?.cost ?? 0), 0);
      return { time, open, high, low, close, cost };
    });

    return {
      candlestickData: combinedData.map(({ open, high, low, close, time }) => ({
        open,
        high,
        low,
        close,
        time,
      })),
      costBasisData: combinedData.map(({ cost, time }) => ({
        value: cost,
        time,
      })),
    };
  }, [data, holdings]);

  return { candlestickData, costBasisData };
};
