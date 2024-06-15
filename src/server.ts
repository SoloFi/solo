import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { logger } from "@bogeychan/elysia-logger";

new Elysia()
  .use(logger())
  .use(cors())
  .get("/chart/:symbol", async ({ params, query }) => {
    const from = parseInt(query.from ?? "");
    const to = parseInt(query.to ?? "");
    const response = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${params.symbol}?region=US&lang=en-US&includePrePost=true&interval=1d&useYfid=true&period1=${from}&period2=${to}`,
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return await response.json();
  })
  .onError(({ code }) => {
    return code;
  })
  .listen(8080);
