import type { Portfolio, PortfolioHolding, PortfolioTransaction } from "@/api/types";
import { axios } from "./axios";

export const getPortfolios = async () => {
  const { data, status } = await axios.get("/api/portfolios");
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data as Portfolio[];
};

export const getPortfolio = async (id: string) => {
  const { data, status } = await axios.get(`/api/portfolio/${id}`);
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data as Portfolio;
};

export const createPortfolio = async (portfolio: Portfolio) => {
  const { data, status } = await axios.put("/api/portfolio", portfolio);
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data as Portfolio;
};

export const updatePortfolio = async (
  id: string,
  portfolioData: Pick<Portfolio, "name" | "currency">,
) => {
  const { data, status } = await axios.post(`/api/portfolio/${id}`, portfolioData);
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data.message;
};

export const deletePortfolio = async (id: string) => {
  const { data, status } = await axios.delete(`/api/portfolio/${id}`);
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data.message;
};

export const addHolding = async (portfolioId: string, holding: PortfolioHolding) => {
  const { data, status } = await axios.put(
    `/api/portfolio/${portfolioId}/holding`,
    holding,
  );
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data.message;
};

export const deleteHolding = async (portfolioId: string, symbol: string) => {
  const { data, status } = await axios.delete(`/api/portfolio/${portfolioId}/${symbol}`);
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data.message;
};

export const addTransaction = async (
  portfolioId: string,
  symbol: string,
  transaction: PortfolioTransaction,
) => {
  const { data, status } = await axios.put(
    `/api/portfolio/${portfolioId}/${symbol}/tx`,
    transaction,
  );
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data.message;
};

export const deleteTransaction = async (
  portfolioId: string,
  symbol: string,
  transactionId: string,
) => {
  const { data, status } = await axios.delete(
    `/api/portfolio/${portfolioId}/${symbol}/tx/${transactionId}`,
  );
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data.message;
};

export const updateTransaction = async (
  portfolioId: string,
  symbol: string,
  transactionId: string,
  transaction: PortfolioTransaction,
) => {
  const { data, status } = await axios.post(
    `/api/portfolio/${portfolioId}/${symbol}/tx/${transactionId}`,
    transaction,
  );
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data.message;
};
