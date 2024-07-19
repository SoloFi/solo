import { useMutation } from "@tanstack/react-query";
import { PortfolioHolding, PortfolioTransaction } from "@/api/types";
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
    onSettled: async (_, __, { portfolioId }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(portfolioId),
      });
    },
  });

  const addHoldingMutation = useMutation({
    mutationFn: async (params: { portfolioId: string; newHolding: PortfolioHolding }) => {
      const { portfolioId, newHolding } = params;
      return addHolding(portfolioId, newHolding);
    },
    onSettled: async (_, __, { portfolioId }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(portfolioId),
      });
    },
  });

  const deleteHoldingMutation = useMutation({
    mutationFn: async (params: { portfolioId: string; symbol: string }) => {
      const { portfolioId, symbol } = params;
      return deleteHolding(portfolioId, symbol);
    },
    onSettled: async (_, __, { portfolioId }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(portfolioId),
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
    onSettled: async (_, __, { portfolioId, symbol }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes(portfolioId) || query.queryKey.includes(symbol),
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
    onSettled: async (_, __, { portfolioId, symbol }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes(portfolioId) || query.queryKey.includes(symbol),
      });
    },
  });

  const deleteTxMutation = useMutation({
    mutationFn: async (params: { portfolioId: string; symbol: string; txId: string }) => {
      const { portfolioId, symbol, txId } = params;
      return deleteTransaction(portfolioId, symbol, txId);
    },
    onSettled: async (_, __, { portfolioId, symbol }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes(portfolioId) || query.queryKey.includes(symbol),
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
