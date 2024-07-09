import type { Portfolio } from "@/api/types";
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

export const updatePortfolio = async (id: string, portfolio: Portfolio) => {
  const { data, status } = await axios.post(`/api/portfolio/${id}`, portfolio);
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
