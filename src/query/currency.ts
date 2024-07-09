import { axios } from "./axios";

/*
  Get the exchange rate between two currencies
  @param fromSymbol: string - The currency to convert from e.g. USD
  @param toSymbol: string - The currency to convert to e.g. GBP
*/
export const getFXRate = async (fromSymbol: string, toSymbol: string) => {
  const { data } = await axios.get(`/api/fx/${fromSymbol}${toSymbol}`);
  return data;
};
