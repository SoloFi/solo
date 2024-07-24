import { ChartQuery } from "@/api/types";
import { getSymbolsCharts } from "@/query/symbol";
import { create, windowedFiniteBatchScheduler } from "@yornaath/batshit";

export const charts = create({
  fetcher: async (chartQuery: ChartQuery) => {
    return getSymbolsCharts(chartQuery);
  },
  resolver: (items, query) => {
    return items.filter((item) => item.symbol === query.symbol)[0];
  },
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 50,
    maxBatchSize: 5,
  }),
});
