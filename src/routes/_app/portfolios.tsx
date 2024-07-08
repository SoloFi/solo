import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DialogHeader, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input, InputErrorLabel } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createPortfolio, deletePortfolio, getPortfolios } from "@/query/portfolio";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";
import { Portfolio } from "@/api/types";
import { toast } from "sonner";
import { queryClient } from "@/main";
import { useForm } from "@tanstack/react-form";
import { CurrencySelect } from "@/components/currency-select";
import { checkNotAuth } from "@/check-auth";

export const Route = createFileRoute("/_app/portfolios")({
  component: () => <Portfolios />,
  beforeLoad: checkNotAuth,
});

function Portfolios() {
  const { data: portfolios, isPending } = useQuery({
    queryKey: ["portfolios"],
    queryFn: getPortfolios,
    refetchOnWindowFocus: false,
  });

  const handleCreatePortfolio = useCallback(
    async (portfolioDetails: { name: string; currency: string }) => {
      const newPortfolio: Portfolio = {
        id: "",
        name: portfolioDetails.name,
        currency: portfolioDetails.currency,
        holdings: [],
      };
      try {
        const portfolio = await createPortfolio(newPortfolio);
        toast.success(`Portfolio "${portfolio.name}" created successfully`);
      } catch (error) {
        toast.error((error as Error).message);
      }
      setIsCreateDialogOpen(false);
    },
    [],
  );

  const createMutation = useMutation({
    mutationFn: handleCreatePortfolio,
    // When mutate is called:
    onMutate: async (newPortfolio) => {
      await queryClient.cancelQueries({ queryKey: ["portfolios"] });
      const previousPortfolios = queryClient.getQueryData(["portfolios"]);
      queryClient.setQueryData(["portfolios"], (old: Portfolio[]) => [
        ...old,
        newPortfolio,
      ]);
      return { previousPortfolios };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["portfolios"], context?.previousPortfolios ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  const handleDeletePortfolio = useCallback(async (portfolioId: string) => {
    try {
      await deletePortfolio(portfolioId);
      toast.success("Portfolio deleted successfully");
    } catch (error) {
      toast.error((error as Error).message);
    }
    setPortfolioIdToDelete(null);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: handleDeletePortfolio,
    onMutate: async (deletedPortfolioId: string) => {
      await queryClient.cancelQueries({ queryKey: ["portfolios"] });
      const previousPortfolios = queryClient.getQueryData(["portfolios"]);
      queryClient.setQueryData(["portfolios"], (old: Portfolio[]) =>
        old.filter((p) => p.id !== deletedPortfolioId),
      );
      return { previousPortfolios };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["portfolios"], context?.previousPortfolios ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [portfolioIdToDelete, setPortfolioIdToDelete] = useState<string | null>(null);

  return (
    <div className="w-full h-full">
      <Card className="flex flex-col min-h-full">
        {!isPending && portfolios && portfolios.length > 0 && (
          <CardHeader>
            <h1 className="text-2xl font-semibold">My portfolios</h1>
          </CardHeader>
        )}
        <CardContent className="flex flex-1 items-center justify-center">
          {isPending && <Spinner className="w-10 h-10" />}
          {!isPending &&
            (portfolios && portfolios.length > 0 ? (
              <ul>
                {portfolios.map((portfolio) => (
                  <li key={portfolio.id}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{portfolio.name}</CardTitle>
                        <Button
                          variant="destructive"
                          onClick={() => setPortfolioIdToDelete(portfolio.id)}
                        >
                          Delete
                        </Button>
                      </CardHeader>
                    </Card>
                  </li>
                ))}
              </ul>
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
          onCreate={async ({ name, currency }) => {
            return new Promise((resolve) => {
              createMutation.mutate({ name, currency }, { onSettled: () => resolve() });
            });
          }}
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      )}
      {portfolioIdToDelete && (
        <DeletePortfolioDialog
          isOpen={!!portfolioIdToDelete}
          onOpenChange={() => setPortfolioIdToDelete(null)}
          onDelete={async () => {
            return new Promise((resolve) => {
              deleteMutation.mutate(portfolioIdToDelete, { onSettled: () => resolve() });
            });
          }}
        />
      )}
    </div>
  );
}

function DeletePortfolioDialog(props: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDelete: () => Promise<void>;
}) {
  const { isOpen, onOpenChange, onDelete } = props;
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete portfolio</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this portfolio? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              setIsLoading(true);
              await onDelete();
              setIsLoading(false);
            }}
            loading={isLoading}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatePortfolioDialog(props: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (portfolioDetails: { name: string; currency: string }) => Promise<void>;
}) {
  const { isOpen, onOpenChange, onCreate } = props;

  const form = useForm({
    defaultValues: {
      name: "",
      currency: "USD",
    },
    onSubmit: async ({ value }) => {
      await onCreate({ name: value.name, currency: value.currency });
    },
  });
  const { Field } = form;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a portfolio</DialogTitle>
          <DialogDescription>
            Enter the name of the portfolio and select the currency you want to use. You
            can always change these later.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <Field
              name="name"
              validators={{
                onChange: ({ value }) => (value !== "" ? undefined : "Name is required"),
              }}
              children={({ state, handleChange, handleBlur }) => (
                <div className="grid grid-cols-4 items-center gap-x-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    value={state.value}
                    onBlur={handleBlur}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="Enter the portfolio name"
                    className="col-span-3"
                    id="name"
                  />
                  <div />
                  {state.meta.errors && (
                    <InputErrorLabel className="col-span-3">
                      {state.meta.errors}
                    </InputErrorLabel>
                  )}
                </div>
              )}
            />
            <Field
              name="currency"
              children={({ state, handleChange, handleBlur }) => (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currency" className="text-right">
                    Currency
                  </Label>
                  <CurrencySelect
                    defaultValue={state.value}
                    onSelect={({ symbol }) => handleChange(symbol)}
                    onBlur={handleBlur}
                    className="w-auto col-span-3"
                    popoverContentProps={{
                      align: "center",
                      side: "bottom",
                    }}
                  />
                </div>
              )}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogClose>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
                  Create
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
