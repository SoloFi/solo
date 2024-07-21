import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";
import { useForm } from "@tanstack/react-form";
import { CurrencySelect } from "../currency-select";
import { Button } from "../ui/button";
import { DialogHeader, DialogFooter } from "../ui/dialog";
import { Input, InputErrorLabel } from "../ui/input";
import { Label } from "../ui/label";

export const CreatePortfolioDialog = (props: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (portfolioDetails: { name: string; currency: string }) => Promise<unknown>;
}) => {
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
};
