export type Portfolio = {
  id: string;
  name: string;
  holdings: PortfolioHolding[];
};

export type PortfolioHolding = {
  symbol: string;
  buys?: PortfolioAction[];
  sales?: PortfolioAction[];
};

export type PortfolioAction = {
  time: number;
  quantity: number;
  price: number;
};

export const getPortfolio = async () => {
  const response = await fetch("/api/portfolio");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return (await response.json()) as Portfolio;
};
