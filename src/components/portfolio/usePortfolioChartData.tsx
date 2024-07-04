import type { Portfolio } from "@/api/query/portfolio";
import type { CandlestickData } from "@/api/YahooQuote";
import { dayjs } from "@/lib/utils";
import type { LineData, UTCTimestamp } from "lightweight-charts";
import { useMemo } from "react";
import { getCostBasisAtTime } from "./utils";

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

    // before computing totalChart, we need to fill the gaps and nullish candle data
    // (open high low close) values with the corresponding last known non-null/non-zero candle data
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
    const costBasisChart: Record<UTCTimestamp, LineData<UTCTimestamp>> = {};
    for (let i = 0; i < holdings.length; i++) {
      const holding = holdings[i];
      if (!holding?.buys && !holding?.sales) continue;
      // set buys and sales time to start of day
      holding.buys = holding.buys?.map((buy) => ({ ...buy, time: startOfDay(buy.time) }));
      holding.sales = holding.sales?.map((sell) => ({
        ...sell,
        time: startOfDay(sell.time),
      }));
      // compute average buy price over time
      for (const time of mergedTimeline) {
        const totalCostBasis = getCostBasisAtTime(holding, time);
        costBasisChart[time] = {
          time,
          value: totalCostBasis + (costBasisChart[time]?.value ?? 0),
        };
      }
    }
    const costBasisData = Object.entries(costBasisChart)
      .sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))
      .map(([, value]) => value);

    return { portfolioData, costBasisData };
  }, [data, holdings]);

  return { portfolioData, costBasisData };
};

const startOfDay = (time: number) =>
  dayjs(time * 1000)
    .utc()
    .startOf("day")
    .unix() as UTCTimestamp;
