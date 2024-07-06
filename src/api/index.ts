import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import YahooQuote from "./YahooQuote";
import YahooSearch from "./YahooSearch";
import type { QuoteRange } from "./types";

const app = new Hono();

// app.use("/*", cors({ origin: "*" }));
app
  .get("/chart/:symbol", async (c) => {
    const { symbol } = c.req.param();
    const { from, to, range, interval } = c.req.query();
    const YQ = new YahooQuote();
    const candlestickData = await YQ.getCandlestickData({
      symbol,
      interval: interval ?? "1d",
      range: range as QuoteRange | undefined,
      fromDate: from,
      toDate: to,
    });
    return c.json(candlestickData);
  })
  .get("/search/:query", async (c) => {
    const YS = new YahooSearch();
    const { query } = c.req.param();
    const items = await YS.search({ query });
    return c.json(items);
  });

export const handler = handle(app);
