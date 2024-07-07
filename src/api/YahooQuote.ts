import type { UTCTimestamp } from "lightweight-charts";
import type { CandlestickData, Quote, QuoteRange } from "./types";

class YahooQuote {
  private baseUrl = "https://query2.finance.yahoo.com/v8/finance/chart/";
  private region = "US";
  private lang = "en-US";

  async getLatestQuote(symbol: string) {
    const url: URL = new URL(`${this.baseUrl}${symbol}`);
    url.searchParams.append("region", this.region);
    url.searchParams.append("lang", this.lang);
    url.searchParams.append("includePrePost", "true");
    url.searchParams.append("interval", "1d");
    const response = await fetch(url.toString());
    if (!response.ok) {
      return response;
    }
    const data = await response.json();
    const timestamp = data?.chart?.result?.[0]?.timestamp as UTCTimestamp[];
    const quote = data?.chart?.result?.[0]?.indicators?.quote[0] as Quote;
    if (!timestamp || !quote) throw new Error();
    const latestQuote: CandlestickData = {
      time: timestamp[timestamp.length - 1],
      open: quote.open[quote.open.length - 1],
      high: quote.high[quote.high.length - 1],
      low: quote.low[quote.low.length - 1],
      close: quote.close[quote.close.length - 1],
    };
    return latestQuote;
  }

  async getCandlestickData(params: {
    symbol: string;
    interval: string;
    range?: QuoteRange;
    fromDate?: string;
    toDate?: string;
  }) {
    const { symbol, interval, range, fromDate, toDate } = params;
    const url: URL = new URL(`${this.baseUrl}${symbol}`);
    url.searchParams.append("region", this.region);
    url.searchParams.append("lang", this.lang);
    url.searchParams.append("includePrePost", "true");
    url.searchParams.append("interval", interval);
    if (range) {
      url.searchParams.append("range", range);
    } else if (fromDate && toDate) {
      url.searchParams.append("period1", fromDate);
      url.searchParams.append("period2", toDate);
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      return response;
    }
    const data = await response.json();
    const timestamp = data?.chart?.result?.[0]?.timestamp as UTCTimestamp[];
    const quote = data?.chart?.result?.[0]?.indicators?.quote[0] as Quote;
    if (!timestamp || !quote) throw new Error();
    const candlestickData: CandlestickData[] = timestamp.map((time, index) => ({
      time: time,
      open: quote.open[index],
      high: quote.high[index],
      low: quote.low[index],
      close: quote.close[index],
    }));
    return candlestickData;
  }
}

export default YahooQuote;
