import type { Portfolio } from "@/api/types";
import { axios } from "./axios";

export const getPortfolios = async () => {
  const { data } = await axios.get("/api/portfolios");
  if (!data) {
    throw new Error("Network response was not ok");
  }
  return data as Portfolio[];
};
