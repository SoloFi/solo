import type { Portfolio } from "@/api/types";
import { axios } from "./axios";

export const getPortfolios = async () => {
  const { data } = await axios.get("/api/portfolios");
  if (!data) {
    throw new Error("Network response was not ok");
  }
  return data as Portfolio[];
};

export const createPortfolio = async (portfolio: Portfolio) => {
  const { data, status } = await axios.put("/api/portfolio", portfolio);
  if (status !== 200) {
    throw new Error(data.message);
  }
  return data as Portfolio;
};

export const updatePortfolio = async (id: string, portfolio: Portfolio) => {
  const { data } = await axios.post(`/api/portfolio/${id}`, portfolio);
  return data.message;
};
