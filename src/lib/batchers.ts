import { ChartQuery } from "@/api/types";
import { getSymbolsCharts } from "@/query/symbol";
import { create, windowedFiniteBatchScheduler } from "@yornaath/batshit";

export const charts = create({
  fetcher: async (chartQuery: ChartQuery) => {
    return getSymbolsCharts(chartQuery);
  },
  resolver: (items, query) => {
    const resolvedQuery = items.filter(
      (item) =>
        item.symbol === query.symbol &&
        item.from === query.from &&
        item.to === query.to &&
        item.interval === query.interval &&
        item.range === query.range,
    )[0];
    if (!resolvedQuery) {
      console.log("resolvedQuery", resolvedQuery, items, query);
    }
    return resolvedQuery;
  },
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 50,
    maxBatchSize: 20,
  }),
});
