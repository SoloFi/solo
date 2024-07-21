import { CreatePortfolioDialog } from "@/components/portfolio/create-portfolio-dialog";
import { DeleteDialog } from "@/components/portfolio/delete-dialog";
import { usePortfolioMutation } from "@/components/portfolio/usePortfolioMutation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getPortfolios } from "@/query/portfolio";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { mustBeAuthenticated } from "../-utils";

export const Route = createFileRoute("/_app/portfolios")({
  component: Portfolios,
  beforeLoad: mustBeAuthenticated,
});

function Portfolios() {
  const navigate = useNavigate();

  const { data: portfolios, isPending } = useQuery({
    queryKey: ["portfolios"],
    queryFn: getPortfolios,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const { newPortfolioMutation, deletePortfolioMutation } = usePortfolioMutation();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [portfolioIdToDelete, setPortfolioIdToDelete] = useState<string | null>(null);

  return (
    <div className="w-full h-full">
      <Card className="flex flex-col min-h-full">
        <CardHeader
          className={!isPending && portfolios && portfolios.length > 0 ? "" : "pb-0"}
        >
          <h1 className="text-2xl font-semibold">
            {!isPending && portfolios && portfolios.length > 0 && "My portfolios"}
          </h1>
        </CardHeader>
        <CardContent className="flex flex-1 justify-center items-center">
          {isPending && <Spinner className="w-10 h-10" />}
          {!isPending &&
            (portfolios && portfolios.length > 0 ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 flex-1 grid-rows-3">
                {(portfolios ?? []).map((portfolio) => (
                  <Card
                    key={portfolio.id}
                    className="w-full h-52 bg-secondary hover:-translate-y-1 transition-transform cursor-pointer border shadow-none"
                    onClick={() =>
                      navigate({
                        from: "/portfolios",
                        to: "/portfolio/$portfolioId",
                        params: { portfolioId: portfolio.id },
                      })
                    }
                  >
                    <CardHeader>
                      <CardTitle className="text-xl lg:text-2xl">
                        {portfolio.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent></CardContent>
                  </Card>
                ))}
                <Card
                  className="w-full h-52 border-primary border-4 border-dashed hover:-translate-y-1 transition-transform cursor-pointer bg-primary/10"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <CardContent className="flex h-full items-center justify-center gap-2 py-0">
                    <Plus strokeWidth={3} className="text-primary" />
                    <h1 className="text-xl lg:text-2xl text-primary font-semibold">
                      Create portfolio
                    </h1>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col gap-6 max-w-[600px] items-center">
                <h1 className="text-2xl lg:text-4xl font-semibold text-center text-pretty">
                  Get started by creating your first portfolio
                </h1>
                <Button
                  size="lg"
                  className="w-[250px]"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Create portfolio
                </Button>
              </div>
            ))}
        </CardContent>
      </Card>
      {isCreateDialogOpen && (
        <CreatePortfolioDialog
          onCreate={({ name, currency }) =>
            newPortfolioMutation.mutateAsync(
              { name, currency },
              { onSuccess: () => setIsCreateDialogOpen(false) },
            )
          }
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      )}
      {portfolioIdToDelete && (
        <DeleteDialog
          title="Delete portfolio"
          description="Are you sure you want to delete this portfolio? This action cannot be undone."
          isOpen={!!portfolioIdToDelete}
          onOpenChange={() => setPortfolioIdToDelete(null)}
          onDelete={() =>
            deletePortfolioMutation.mutateAsync(portfolioIdToDelete, {
              onSuccess: () => setPortfolioIdToDelete(null),
            })
          }
        />
      )}
    </div>
  );
}
