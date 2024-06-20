import type { Portfolio } from "@/api/portfolio";
import type { CandlestickData } from "@/api/symbol";
import { dayjs } from "@/lib/utils";
import type { LineData, UTCTimestamp } from "lightweight-charts";
import { useMemo } from "react";

// Hook to transform portfolio holdings and symbol chart data into a format that can be used by the chart component
export const usePortfolioChartData = (props: {
  holdings: Portfolio["holdings"] | null;
  data: Record<string, CandlestickData[] | undefined> | null;
}): {
  portfolioData: CandlestickData[];
  costBasisData: LineData<UTCTimestamp>[];
} => {
  const { holdings, data } = props;

  const { portfolioData, costBasisData } = useMemo(() => {
    if (!holdings || !data) return { portfolioData: [], costBasisData: [] };

    const chartMaps = holdings.map(({ symbol, buys, sales }) => {
      const symbolData = data[symbol];
      if (!symbolData) return null;
      // compute the holding's chart over time based on the current price and shares held
      const holdingChart: Record<UTCTimestamp, CandlestickData> = {};
      for (const { time, open, high, low, close } of symbolData) {
        const buyShares = buys
          ?.filter((buy) => buy.time <= time)
          .reduce((acc, buy) => acc + buy.quantity, 0);
        const sellShares = sales
          ?.filter((sell) => sell.time <= time)
          .reduce((acc, sell) => acc + sell.quantity, 0);
        const shares = (buyShares ?? 0) - (sellShares ?? 0);
        holdingChart[startOfDay(time)] = {
          time: startOfDay(time),
          open: open * shares,
          high: high * shares,
          low: low * shares,
          close: close * shares,
        };
      }
      return holdingChart;
    });

    const mergedTimeline = Array.from(
      new Set(chartMaps.flatMap((chart) => Object.keys(chart ?? {})).map(Number)),
    ).sort((a, b) => a - b) as UTCTimestamp[];
    // before computing totalChart, we need to fill the gaps and null candle data (open high low close) values
    // in the data with the corresponding last known non-null/non-zero candle data
    for (const holdingChart of chartMaps) {
      if (!holdingChart) continue;
      let lastCandle: CandlestickData | null = null;
      for (const time of mergedTimeline) {
        const candle = holdingChart[time];
        if (candle?.open && candle?.high && candle?.low && candle?.close) {
          lastCandle = candle;
        } else if (lastCandle) {
          holdingChart[time] = lastCandle;
        }
      }
    }

    const portfolioChart: Record<UTCTimestamp, CandlestickData> = {};
    for (const holdingChart of chartMaps) {
      if (!holdingChart) continue;
      for (const [time, { open, high, low, close }] of Object.entries(holdingChart)) {
        const _time = Number.parseInt(time) as UTCTimestamp;
        portfolioChart[_time] = {
          time: _time,
          open: (portfolioChart[_time]?.open ?? 0) + open,
          close: (portfolioChart[_time]?.close ?? 0) + close,
          high: (portfolioChart[_time]?.high ?? 0) + high,
          low: (portfolioChart[_time]?.low ?? 0) + low,
        };
      }
    }
    const portfolioData = Object.entries(portfolioChart)
      .sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))
      .map(([, value]) => value);

    // compute the cost basis of each holding over the merged timeline
    // based on the total cost of buys minus sales for a given holding
    const costBasisChart: Record<UTCTimestamp, number> = {};
    for (let i = 0; i < chartMaps.length; i++) {
      const holdingChart = chartMaps[i];
      if (!holdingChart) continue;
      for (const [time] of Object.entries(holdingChart)) {
        const _time = Number.parseInt(time) as UTCTimestamp;
        const buyCost = holdings[i].buys
          ?.filter((buy) => buy.time <= _time)
          .reduce((acc, buy) => acc + buy.quantity * buy.price, 0);
        const sellCost = holdings[i].sales
          ?.filter((sell) => sell.time <= _time)
          .reduce((acc, sell) => acc + sell.quantity * sell.price, 0);
        costBasisChart[_time] =
          (costBasisChart[_time] ?? 0) + (buyCost ?? 0) - (sellCost ?? 0);
      }
    }
    const costBasisData = Object.entries(costBasisChart)
      .sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))
      .map(([time, value]) => ({ time: Number.parseInt(time) as UTCTimestamp, value }));

    return { portfolioData, costBasisData };
  }, [data, holdings]);

  return { portfolioData, costBasisData };
};

const startOfDay = (time: number) =>
  (dayjs(time * 1000)
    .utc()
    .startOf("day")
    .valueOf() / 1000) as UTCTimestamp;
