import type { Portfolio } from "@/api/types";

export const getPortfolio = async () => {
  const response = await fetch("/api/portfolio");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return (await response.json()) as Portfolio;
};
