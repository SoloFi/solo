import { axios } from "./axios";

export const getUsdRate = async (symbol: string) => {
  const fxSymbol = `${symbol.toUpperCase()}USD=X`;
  const { data } = await axios.get(`/api/quote/${fxSymbol}`);
  return data;
};
