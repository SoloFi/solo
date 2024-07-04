class YahooSearch {
  private baseUrl = "https://query2.finance.yahoo.com/v1/finance/lookup";
  private region = "US";
  private lang = "en-US";

  async search(params: { query: string }) {
    const url: URL = new URL(this.baseUrl);
    url.searchParams.append("formatted", "true");
    url.searchParams.append("lang", this.lang);
    url.searchParams.append("region", this.region);
    url.searchParams.append("query", params.query);
    url.searchParams.append("type", "all");
    url.searchParams.append("count", "25");
    url.searchParams.append("start", "0");
    url.searchParams.append("corsDomain", "finance.yahoo.com");

    const response = await fetch(url.toString());
    if (!response.ok) {
      return response;
    }
    const data = await response.json();
    const items: SearchItem[] = data?.finance?.result?.[0]?.documents;
    if (!items || items?.length < 1) {
      return [];
    }
    return items;
  }
}

export default YahooSearch;

export interface SearchItem {
  symbol: string;
  regularMarketPercentChange: {
    raw: number;
    fmt: string;
  };
  regularMarketChange: {
    raw: number;
    fmt: string;
  };
  rank: number;
  exchange: string;
  shortName: string;
  quoteType: string;
  regularMarketPrice: {
    raw: number;
    fmt: string;
  };
}
