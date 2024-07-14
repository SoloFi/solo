import { useMutation } from "@tanstack/react-query";
import { Portfolio, PortfolioHolding, PortfolioTransaction } from "@/api/types";
import { queryClient } from "@/main";
import { addHolding, addTransaction, updatePortfolio } from "@/query/portfolio";

export const usePortfolioMutation = () => {
  const portfolioAttributesMutation = useMutation({
    mutationFn: async (params: {
      portfolioId: string;
      name: string;
      currency: string;
    }) => {
      const { portfolioId, name, currency } = params;
      return updatePortfolio(portfolioId, { name, currency });
    },
    onMutate: async (params: { portfolioId: string; name: string; currency: string }) => {
      const { portfolioId, name, currency } = params;
      await queryClient.cancelQueries({ queryKey: ["portfolio", portfolioId] });
      const previousPortfolio = queryClient.getQueryData(["portfolio", portfolioId]) as
        | Portfolio
        | undefined;
      const newPortfolio = previousPortfolio && {
        ...previousPortfolio,
        name,
        currency,
      };
      queryClient.setQueryData(["portfolio", portfolioId], newPortfolio);
      return { previousPortfolio, newPortfolio };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["portfolio", context?.previousPortfolio?.id],
        context?.previousPortfolio,
      );
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({
        queryKey: ["portfolio", context?.previousPortfolio?.id],
      });
    },
  });

  const portfolioAddHoldingMutation = useMutation({
    mutationFn: async (params: { portfolioId: string; newHolding: PortfolioHolding }) => {
      const { portfolioId, newHolding } = params;
      return addHolding(portfolioId, newHolding);
    },
    onMutate: async (params: { portfolioId: string; newHolding: PortfolioHolding }) => {
      const { portfolioId, newHolding } = params;
      await queryClient.cancelQueries({ queryKey: ["portfolio", portfolioId] });
      const previousPortfolio = queryClient.getQueryData(["portfolio", portfolioId]) as
        | Portfolio
        | undefined;
      const newPortfolio = previousPortfolio?.holdings && {
        ...previousPortfolio,
        holdings: [...previousPortfolio.holdings, newHolding],
      };
      queryClient.setQueryData(["portfolio", portfolioId], newPortfolio);
      return { previousPortfolio, newPortfolio };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["portfolio", context?.previousPortfolio?.id],
        context?.previousPortfolio,
      );
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({
        queryKey: ["portfolio", context?.previousPortfolio?.id],
      });
    },
  });

  const portfolioAddTxMutation = useMutation({
    mutationFn: async (params: {
      portfolioId: string;
      symbol: string;
      tx: PortfolioTransaction;
    }) => {
      const { portfolioId, symbol, tx } = params;
      return addTransaction(portfolioId, symbol, tx);
    },
    onMutate: async (params: {
      portfolioId: string;
      symbol: string;
      tx: PortfolioTransaction;
    }) => {
      const { portfolioId, symbol, tx } = params;
      await queryClient.cancelQueries({ queryKey: ["portfolio", portfolioId] });
      const previousPortfolio = queryClient.getQueryData(["portfolio", portfolioId]) as
        | Portfolio
        | undefined;
      const newPortfolio = previousPortfolio?.holdings && {
        ...previousPortfolio,
        holdings: previousPortfolio.holdings.map((holding) => {
          if (holding.symbol === symbol) {
            return {
              ...holding,
              transactions: [...holding.transactions, tx],
            };
          }
          return holding;
        }),
      };
      queryClient.setQueryData(["portfolio", portfolioId], newPortfolio);
      return { previousPortfolio, newPortfolio };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["portfolio", context?.previousPortfolio?.id],
        context?.previousPortfolio,
      );
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({
        queryKey: ["portfolio", context?.previousPortfolio?.id],
      });
    },
  });

  return {
    portfolioAttributesMutation,
    portfolioAddHoldingMutation,
    portfolioAddTxMutation,
  };
};
