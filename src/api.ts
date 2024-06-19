import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { logger } from "@bogeychan/elysia-logger";

new Elysia()
  .use(logger())
  .use(cors())
  .get("/chart/:symbol", async ({ params, query }) => {
    const from = parseInt(query.from ?? "");
    const to = parseInt(query.to ?? "");
    const range = query.range ?? "1d";
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
      throw new Error("Network response was not ok");
    }
    return await response.json();
  })
  .onError(({ code }) => {
    return code;
  })
  .listen(8080);
