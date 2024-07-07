import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DialogHeader, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createPortfolio, getPortfolios } from "@/query/portfolio";
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

export const Route = createFileRoute("/_app/portfolios")({
  component: () => <Portfolios />,
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

  const mutation = useMutation({
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

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="w-full h-full">
      <Card className="flex flex-col min-h-full">
        {!isPending && portfolios && portfolios.length > 0 && (
          <CardHeader>
            <h1 className="text-2xl font-semibold">My portfolios</h1>
          </CardHeader>
        )}
        <CardContent className="flex flex-1 items-center justify-center">
          {isPending && <Spinner className="w-12 h-12" />}
          {!isPending &&
            (portfolios && portfolios.length > 0 ? (
              <ul>
                {portfolios.map((portfolio) => (
                  <li key={portfolio.id}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{portfolio.name}</CardTitle>
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
          onCreate={async ({ name, currency }) => mutation.mutate({ name, currency })}
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      )}
    </div>
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
      currency: "",
    },
    onSubmit: async ({ value }) => {
      return onCreate({ name: value.name, currency: value.currency });
    },
  });
  const { Field } = form;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
              children={({ state, handleChange, handleBlur }) => (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    value={state.value}
                    onBlur={handleBlur}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="Enter the portfolio name"
                    id="name"
                    className="col-span-3"
                  />
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
                  <Input
                    value={state.value}
                    onBlur={handleBlur}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="Enter the currency"
                    id="currency"
                    className="col-span-3"
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
