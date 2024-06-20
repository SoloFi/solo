import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { logger } from "@bogeychan/elysia-logger";
import { UTCTimestamp } from "lightweight-charts";
import { CandlestickData, Quote } from "./api/symbol";

new Elysia()
  .use(logger())
  .use(cors())
  .get("/chart/:symbol", async ({ params, query }) => {
    const from = parseInt(query.from ?? "");
    const to = parseInt(query.to ?? "");
    const range = query.range;
    const url: URL = new URL(
      `https://query2.finance.yahoo.com/v8/finance/chart/${params.symbol}`,
    );
    url.searchParams.append("region", "US");
    url.searchParams.append("lang", "en-US");
    url.searchParams.append("includePrePost", "true");
    url.searchParams.append("interval", "1d");
    if (range) {
      url.searchParams.append("range", range);
    } else {
      url.searchParams.append("period1", from.toString());
      url.searchParams.append("period2", to.toString());
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      return response;
    }
    const data = await response.json();
    const timestamp = data?.chart?.result?.[0]?.timestamp as UTCTimestamp[];
    const quote = data?.chart?.result?.[0]?.indicators?.quote[0] as Quote;
    if (!timestamp || !quote) throw new Error("Invalid data");
    const candlestickData: CandlestickData[] = timestamp.map((time, index) => ({
      time: time,
      open: quote.open[index],
      high: quote.high[index],
      low: quote.low[index],
      close: quote.close[index],
    }));
    return JSON.stringify(candlestickData);
  })
  .onError(({ code }) => {
    return code;
  })
  .listen(8080);
