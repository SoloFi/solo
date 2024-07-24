import type { ManipulateType } from "dayjs";
import type { UTCTimestamp } from "lightweight-charts";
import { CandlestickData } from "./types";

class YahooQuote {
  private baseUrl = "https://query2.finance.yahoo.com/v8/finance/chart/";
  private region = "US";
  private lang = "en-US";

  async getSymbolDetails(symbol: string) {
    const url: URL = new URL(`${this.baseUrl}${symbol}`);
    url.searchParams.append("region", this.region);
    url.searchParams.append("lang", this.lang);
    url.searchParams.append("includePrePost", "true");
    url.searchParams.append("interval", "1d");
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    const metadata = data?.chart?.result?.[0]?.meta as SymbolMeta;
    if (!metadata) throw new Error();
    return metadata;
  }

  async getLatestQuote(symbol: string) {
    const url: URL = new URL(`${this.baseUrl}${symbol}`);
    url.searchParams.append("region", this.region);
    url.searchParams.append("lang", this.lang);
    url.searchParams.append("includePrePost", "true");
    url.searchParams.append("interval", "1d");
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(response.statusText);
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
    fromDate?: number;
    toDate?: number;
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
      url.searchParams.append("period1", `${fromDate}`);
      url.searchParams.append("period2", `${toDate}`);
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(response.statusText);
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

export interface SymbolMeta {
  currency: string;
  symbol: string;
  exchangeName: string;
  fullExchangeName: string;
  instrumentType: string;
  firstTradeDate: number;
  regularMarketTime: number;
  hasPrePostMarketData: boolean;
  gmtoffset: number;
  timezone: string;
  exchangeTimezoneName: string;
  regularMarketPrice: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  chartPreviousClose: number;
  priceHint: number;
  currentTradingPeriod: CurrentTradingPeriod;
  // dataGranularity: string;
  range: QuoteRange;
  validRanges: QuoteRange[];
}

export interface CurrentTradingPeriod {
  pre: TradingPeriod;
  regular: TradingPeriod;
  post: TradingPeriod;
}

export interface TradingPeriod {
  timezone: string;
  end: number;
  start: number;
  gmtoffset: number;
}

export interface Quote {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
}

export const QuoteRange = {
  ONE_MONTH: "1mo",
  THREE_MONTH: "3mo",
  SIX_MONTH: "6mo",
  ONE_YEAR: "1y",
  TWO_YEAR: "2y",
  FIVE_YEAR: "5y",
  TEN_YEAR: "10y",
  YTD: "ytd",
} as const;
export type QuoteRange = (typeof QuoteRange)[keyof typeof QuoteRange];

export const RangeConstruction: Record<
  QuoteRange,
  { value: number; unit: ManipulateType }
> = {
  "1mo": { value: 1, unit: "month" },
  "3mo": { value: 3, unit: "month" },
  "6mo": { value: 6, unit: "month" },
  "1y": { value: 1, unit: "year" },
  "2y": { value: 2, unit: "year" },
  "5y": { value: 5, unit: "year" },
  "10y": { value: 10, unit: "year" },
  ytd: { value: 1, unit: "year" },
};
