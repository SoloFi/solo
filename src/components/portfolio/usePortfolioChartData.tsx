import type { Portfolio } from "@/api/portfolio";
import type { CandlestickData } from "@/api/symbol";
import type { AreaData, LineData, UTCTimestamp } from "lightweight-charts";
import { useMemo } from "react";

// Hook to transform portfolio holdings and symbol chart data into a format that can be used by the chart component
export const usePortfolioChartData = (props: {
  holdings?: Portfolio["holdings"];
  data?: Record<string, CandlestickData[] | undefined>;
}): {
  portfolioData: AreaData<UTCTimestamp>[];
  costBasisData: LineData<UTCTimestamp>[];
} => {
  const { holdings, data } = props;

  const { portfolioData, costBasisData } = useMemo(() => {
    if (!holdings || !data) return { portfolioData: [], costBasisData: [] };

    const holdingsData = holdings.map(({ symbol, buys, sells }) => {
      const symbolData = data[symbol];
      if (!symbolData) {
        return [];
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
        const { close } = symbolData[index];
        return {
          time: timeline[index],
          close: close * sharesOverTime[index],
          cost: costBasisOverTime[index],
        };
      });
      return holdingOHLC;
    });

    // Combine the OHLC data of all holdings using the timeline with the highest resolution
    const combinedTimeline = Array.from(
      new Set(
        holdingsData.flatMap((holdingOHLC) => holdingOHLC.map((entry) => entry.time)),
      ),
    ).sort();

    // Resize the OHLC data to match the combined timeline by adding padding for missing entries
    const resizedData = holdingsData.map((holdingOHLC) => {
      const resizedOHLC = combinedTimeline.map((time) =>
        holdingOHLC.find((entry) => entry.time === time),
      );
      // set the first entry to the first non-null entry to 0 if the first entry is null
      if (!resizedOHLC[0]) {
        resizedOHLC[0] = {
          time: combinedTimeline[0],
          close: 0,
          cost: 0,
        };
      }
      // Fill in missing entries with the previous entry
      for (let i = 1; i < resizedOHLC.length; i++) {
        if (!resizedOHLC[i]) {
          const previousEntry = resizedOHLC[i - 1] as {
            time: UTCTimestamp;
            close: number;
            cost: number;
          };
          resizedOHLC[i] = { ...previousEntry, time: combinedTimeline[i] };
        }
      }
      return resizedOHLC;
    });

    const combinedData = combinedTimeline.map((time, index) => {
      const combinedEntry = resizedData.map((holdingOHLC) => holdingOHLC[index]);
      const close = combinedEntry.reduce((acc, entry) => acc + (entry?.close ?? 0), 0);
      const cost = combinedEntry.reduce((acc, entry) => acc + (entry?.cost ?? 0), 0);
      return { time, close, cost };
    });

    return {
      portfolioData: combinedData.map(({ close, time }) => ({
        value: close,
        time,
      })),
      costBasisData: combinedData.map(({ cost, time }) => ({
        value: cost,
        time,
      })),
    };
  }, [data, holdings]);

  return { portfolioData, costBasisData };
};
