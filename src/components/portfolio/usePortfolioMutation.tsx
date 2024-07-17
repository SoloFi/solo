import { useMutation } from "@tanstack/react-query";
import { Portfolio, PortfolioHolding, PortfolioTransaction } from "@/api/types";
import { queryClient } from "@/main";
import {
  addHolding,
  addTransaction,
  deleteHolding,
  deleteTransaction,
  updatePortfolio,
  updateTransaction,
} from "@/query/portfolio";

export const usePortfolioMutation = () => {
  const attributesMutation = useMutation({
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

  const addHoldingMutation = useMutation({
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

  const deleteHoldingMutation = useMutation({
    mutationFn: async (params: { portfolioId: string; symbol: string }) => {
      const { portfolioId, symbol } = params;
      return deleteHolding(portfolioId, symbol);
    },
    onMutate: async (params: { portfolioId: string; symbol: string }) => {
      const { portfolioId, symbol } = params;
      await queryClient.cancelQueries({ queryKey: ["portfolio", portfolioId] });
      const previousPortfolio = queryClient.getQueryData(["portfolio", portfolioId]) as
        | Portfolio
        | undefined;
      const newPortfolio = previousPortfolio?.holdings && {
        ...previousPortfolio,
        holdings: previousPortfolio.holdings.filter(
          (holding) => holding.symbol !== symbol,
        ),
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

  const addTxMutation = useMutation({
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
    onSuccess: (_, { symbol }, context) => {
      queryClient.invalidateQueries({
        queryKey: ["portfolio", context?.previousPortfolio?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [symbol],
      });
    },
  });

  const editTxMutation = useMutation({
    mutationFn: async (params: {
      portfolioId: string;
      symbol: string;
      tx: PortfolioTransaction;
    }) => {
      const { portfolioId, symbol, tx } = params;
      return updateTransaction(portfolioId, symbol, tx);
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
              transactions: holding.transactions.map((transaction) => {
                if (transaction.id === tx.id) {
                  return tx;
                }
                return transaction;
              }),
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
    onSuccess: (_, { symbol }, context) => {
      queryClient.invalidateQueries({
        queryKey: ["portfolio", context?.previousPortfolio?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [symbol],
      });
    },
  });

  const deleteTxMutation = useMutation({
    mutationFn: async (params: { portfolioId: string; symbol: string; txId: string }) => {
      const { portfolioId, symbol, txId } = params;
      return deleteTransaction(portfolioId, symbol, txId);
    },
    onMutate: async (params: { portfolioId: string; symbol: string; txId: string }) => {
      const { portfolioId, symbol, txId } = params;
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
              transactions: holding.transactions.filter(
                (transaction) => transaction.id !== txId,
              ),
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
    onSuccess: (_, { symbol }, context) => {
      queryClient.invalidateQueries({
        queryKey: ["portfolio", context?.previousPortfolio?.id],
      });
      queryClient.invalidateQueries({
        queryKey: [symbol],
      });
    },
  });

  return {
    attributesMutation,
    addHoldingMutation,
    deleteHoldingMutation,
    addTxMutation,
    editTxMutation,
    deleteTxMutation,
  };
};
