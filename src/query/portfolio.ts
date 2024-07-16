import type { Portfolio, PortfolioHolding, PortfolioTransaction } from "@/api/types";
import { axios } from "./axios";

export const getPortfolios = async () => {
  const { data } = await axios.get("/api/portfolios");
  return data as Portfolio[];
};

export const getPortfolio = async (id: string) => {
  const { data } = await axios.get(`/api/portfolio/${id}`);
  return data as Portfolio;
};

export const createPortfolio = async (portfolio: Portfolio) => {
  const { data } = await axios.put("/api/portfolio", portfolio);
  return data as Portfolio;
};

export const updatePortfolio = async (
  id: string,
  portfolioData: Pick<Portfolio, "name" | "currency">,
) => {
  const { data } = await axios.post(`/api/portfolio/${id}`, portfolioData);
  return data.message;
};

export const deletePortfolio = async (id: string) => {
  const { data } = await axios.delete(`/api/portfolio/${id}`);
  return data.message;
};

export const addHolding = async (portfolioId: string, holding: PortfolioHolding) => {
  const { data } = await axios.put(`/api/portfolio/${portfolioId}/holding`, holding);
  return data.message;
};

export const deleteHolding = async (portfolioId: string, symbol: string) => {
  const { data } = await axios.delete(`/api/portfolio/${portfolioId}/holding/${symbol}`);
  return data.message;
};

export const addTransaction = async (
  portfolioId: string,
  symbol: string,
  transaction: PortfolioTransaction,
) => {
  const { data } = await axios.put(
    `/api/portfolio/${portfolioId}/holding/${symbol}/tx`,
    transaction,
  );
  return data.message;
};

export const deleteTransaction = async (
  portfolioId: string,
  symbol: string,
  transactionId: string,
) => {
  const { data } = await axios.delete(
    `/api/portfolio/${portfolioId}/holding/${symbol}/tx/${transactionId}`,
  );
  return data.message;
};

export const updateTransaction = async (
  portfolioId: string,
  symbol: string,
  transactionId: string,
  transaction: PortfolioTransaction,
) => {
  const { data } = await axios.post(
    `/api/portfolio/${portfolioId}/holding/${symbol}/tx/${transactionId}`,
    transaction,
  );
  return data.message;
};
