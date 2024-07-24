import { axios } from "./axios";

export const getFxRate = async (fromCurrency: string, toCurrency: string) => {
  const { data } = await axios.get(
    `/api/fx/${fromCurrency.toUpperCase()}${toCurrency.toUpperCase()}`,
  );
  return data as number | undefined;
};

export const getFxSymbol = (fromCurrency: string, toCurrency: string) =>
  `${fromCurrency.toUpperCase()}${toCurrency.toUpperCase()}=X`;
