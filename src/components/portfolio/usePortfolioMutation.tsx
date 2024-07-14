import { useMutation } from "@tanstack/react-query";
import { Portfolio } from "@/api/types";
import { queryClient } from "@/main";
import { updatePortfolio } from "@/query/portfolio";

export const usePortfolioMutation = () => {
  const portfolioMutation = useMutation({
    mutationFn: async (newPortfolio: Portfolio) => {
      return updatePortfolio(newPortfolio.id, newPortfolio);
    },
    onMutate: async (newPortfolio) => {
      await queryClient.cancelQueries({ queryKey: ["portfolio", newPortfolio.id] });
      const previousPortfolio = queryClient.getQueryData(["portfolio", newPortfolio.id]);
      queryClient.setQueryData(["portfolio", newPortfolio.id], newPortfolio);
      return { previousPortfolio, newPortfolio };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["portfolio", context?.newPortfolio.id],
        context?.previousPortfolio,
      );
    },
    onSettled: (newPortfolio) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", newPortfolio.id] });
    },
  });

  return portfolioMutation;
};
