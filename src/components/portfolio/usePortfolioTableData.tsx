import { CandlestickData, PortfolioHolding } from "@/api/types";
import { useMemo } from "react";
import { getCostBasisAtTime } from "./utils";
import { dayjs, percentChange } from "@/lib/utils";
import { UTCTimestamp } from "lightweight-charts";

export const usePortfolioTableData = (props: {
  holdings: PortfolioHolding[];
  symbolsData: Record<string, CandlestickData[] | undefined>;
}) => {
  const { holdings, symbolsData } = props;

  const tableData = useMemo(() => {
    return holdings.map((entry) => {
      const symbol = entry.symbol;
      const buys = entry.buys;
      if (buys.length === 0) {
        return {
          symbol,
          price: 0,
          quantity: 0,
          value: 0,
          costBasis: 0,
          change: {
            value: 0,
            percentChange: 0,
          },
          last30Days: [],
        };
      }
      const lastBuy = buys[buys.length - 1];
      const chartData = symbolsData[symbol];
      const lastData = chartData ? chartData[chartData.length - 1] : undefined;
      const price = lastData?.close ?? lastBuy.price;
      const quantity = buys.reduce((acc, buy) => acc + buy.quantity, 0);
      const value = price * quantity;
      const costBasis = getCostBasisAtTime(entry, dayjs().utc().unix() as UTCTimestamp);
      const last30Days =
        chartData?.slice(-30).map((data) => ({
          time: data.time as UTCTimestamp,
          value: data.close,
        })) ?? [];
      // fill in null values with last known non-null value
      let lastKnownValue = 0;
      for (let i = 0; i < last30Days.length; i++) {
        if (last30Days[i].value === null) {
          last30Days[i].value = lastKnownValue;
        } else {
          lastKnownValue = last30Days[i].value;
        }
      }
      return {
        symbol,
        price,
        quantity,
        value,
        costBasis,
        change: {
          value: value - costBasis,
          percentChange: percentChange(costBasis, value),
        },
        last30Days,
      };
    });
  }, [holdings, symbolsData]);

  return tableData;
};
