import { Dialog, DialogContent, DialogTitle, DialogClose } from "../ui/dialog";
import { useForm } from "@tanstack/react-form";
import { Button } from "../ui/button";
import { DialogHeader, DialogFooter } from "../ui/dialog";
import { Input, InputErrorLabel } from "../ui/input";
import { Label } from "../ui/label";
import { PortfolioTransaction, TransactionType } from "@/api/types";
import { dayjs } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { isFloat } from "validator";
import { useCallback, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";

export const TransactionDialog = (props: {
  transaction?: Partial<PortfolioTransaction>;
  symbol: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (transation: PortfolioTransaction) => Promise<void>;
}) => {
  const { transaction = {}, symbol, isOpen, onOpenChange, onSave } = props;
  const [calendarMonth, setCalendarMonth] = useState(dayjs().toDate());

  const form = useForm({
    defaultValues: {
      id: "",
      type: TransactionType.BUY,
      time: dayjs().unix(),
      ...transaction,
      price: transaction.price ? `${transaction.price}` : "0",
      quantity: transaction.quantity ? `${transaction.quantity}` : "0",
    },
    onSubmit: async (form) => {
      await onSave({
        ...form.value,
        price: Number(form.value.price),
        quantity: Number(form.value.quantity),
      });
    },
  });
  const { Field } = form;

  const handleFloatInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (isFloat(newValue, { locale: "en-US" })) {
      return newValue;
    } else if (newValue.trim() === "") {
      return "";
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Transaction for {symbol}</DialogTitle>
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
              name="type"
              children={({ state, handleChange }) => (
                <div className="grid grid-cols-4 items-center gap-x-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={state.value}
                    onValueChange={(value: TransactionType) => handleChange(value)}
                  >
                    <SelectTrigger className="w-max">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.BUY}>BUY</SelectItem>
                      <SelectItem value={TransactionType.SELL}>SELL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Field
              name="time"
              validators={{
                onChange: ({ value }) => {
                  let valid = dayjs.unix(value).isValid();
                  valid = valid && dayjs.unix(value).isBefore(dayjs());
                  return valid ? undefined : "Invalid date";
                },
              }}
              children={({ state, handleChange }) => (
                <div className="grid grid-cols-4 items-center gap-x-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="col-span-3 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {state.value
                          ? dayjs.unix(state.value).format("YYYY-MM-DD")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dayjs.unix(state.value).toDate()}
                        onSelect={(date) => handleChange(dayjs(date).unix())}
                        month={calendarMonth}
                        onMonthChange={(date) => setCalendarMonth(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
              name="price"
              validators={{
                onChange: ({ value }) => {
                  return Number(value) > 0 ? undefined : "Price must be greater than 0";
                },
              }}
              children={({ state, handleChange, handleBlur }) => (
                <div className="grid grid-cols-4 items-center gap-x-4">
                  <Label htmlFor="price" className="text-right">
                    Price
                  </Label>
                  <Input
                    value={state.value}
                    onChange={(e) => {
                      const newValue = handleFloatInput(e);
                      if (newValue !== undefined) handleChange(newValue);
                    }}
                    onBlur={handleBlur}
                    className="col-span-3"
                    id="price"
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
              name="quantity"
              validators={{
                onChange: ({ value }) => {
                  return Number(value) > 0
                    ? undefined
                    : "Quantity must be greater than 0";
                },
              }}
              children={({ state, handleChange, handleBlur }) => (
                <div className="grid grid-cols-4 items-center gap-x-4">
                  <Label htmlFor="quantity" className="text-right">
                    Quantity
                  </Label>
                  <Input
                    value={state.value}
                    onChange={(e) => {
                      const newValue = handleFloatInput(e);
                      if (newValue !== undefined) handleChange(newValue);
                    }}
                    onBlur={handleBlur}
                    className="col-span-3"
                    id="quantity"
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
                  Save
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
