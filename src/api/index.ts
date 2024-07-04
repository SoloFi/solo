import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { logger } from "@bogeychan/elysia-logger";
import YahooQuote from "./YahooQuote";
import YahooSearch from "./YahooSearch";
import type { QuoteRange } from "./types";

const YQ = new YahooQuote();
const YS = new YahooSearch();

new Elysia()
  .use(logger())
  .use(cors())
  .get("/chart/:symbol", async ({ params, query }) => {
    const from = query.from;
    const to = query.to;
    const range = query.range as QuoteRange | undefined;
    const candlestickData = await YQ.getCandlestickData({
      symbol: params.symbol,
      interval: query.interval ?? "1d",
      range: range,
      fromDate: from,
      toDate: to,
    });
    return JSON.stringify(candlestickData);
  })
  .get("/search/:query", async ({ params }) => {
    const items = await YS.search({ query: params.query });
    return JSON.stringify(items);
  })
  .onError(({ code }) => {
    return code;
  })
  .listen(8080);
