import { PortfolioHolding, PortfolioTransaction } from "@/api/types";
import { queryClient } from "@/main";
import {
  addHolding,
  addTransaction,
  createPortfolio,
  deleteHolding,
  deletePortfolio,
  deleteTransaction,
  updatePortfolio,
  updateTransaction,
} from "@/query/portfolio";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useCallback } from "react";
import { toast } from "sonner";

export const usePortfolioMutation = () => {
  const errorToast = useCallback((error: AxiosError) => {
    toast.error((error.response?.data as string) ?? error.message);
  }, []);

  const newPortfolioMutation = useMutation({
    mutationFn: (portfolioDetails: { name: string; currency: string }) =>
      createPortfolio({ id: "", holdings: [], ...portfolioDetails }),
    onSuccess: (_, { name }) => {
      toast.success(`Portfolio "${name}" created successfully`);
    },
    onError: errorToast,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: (portfolioId: string) => deletePortfolio(portfolioId),
    onError: errorToast,
    onSuccess: () => {
      toast.success("Portfolio deleted successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  const attributesMutation = useMutation({
    mutationFn: async (params: {
      portfolioId: string;
      name: string;
      currency: string;
    }) => {
      const { portfolioId, name, currency } = params;
      return updatePortfolio(portfolioId, { name, currency });
    },
    onError: errorToast,
    onSettled: async (_, __, { portfolioId }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes(portfolioId),
      });
    },
  });

  const addHoldingMutation = useMutation({
    mutationFn: async (params: {
      portfolioId: string;
      newHolding: PortfolioHolding;
    }) => {
      const { portfolioId, newHolding } = params;
      return addHolding(portfolioId, newHolding);
    },
    onError: errorToast,
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
    onError: errorToast,
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
    onError: errorToast,
    onSettled: async (_, __, { portfolioId, symbol }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes(portfolioId) ||
          query.queryKey.includes(symbol),
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
    onError: errorToast,
    onSettled: async (_, __, { portfolioId, symbol }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes(portfolioId) ||
          query.queryKey.includes(symbol),
      });
    },
  });

  const deleteTxMutation = useMutation({
    mutationFn: async (params: {
      portfolioId: string;
      symbol: string;
      txId: string;
    }) => {
      const { portfolioId, symbol, txId } = params;
      return deleteTransaction(portfolioId, symbol, txId);
    },
    onError: errorToast,
    onSettled: async (_, __, { portfolioId, symbol }) => {
      return await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes(portfolioId) ||
          query.queryKey.includes(symbol),
      });
    },
  });

  return {
    newPortfolioMutation,
    deletePortfolioMutation,
    attributesMutation,
    addHoldingMutation,
    deleteHoldingMutation,
    addTxMutation,
    editTxMutation,
    deleteTxMutation,
  };
};
