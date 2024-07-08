import { useMemo, useState } from "react";
import { cn, currencies } from "@/lib/utils";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button, ButtonProps } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { PopoverContentProps } from "@radix-ui/react-popover";
import { ScrollArea } from "./ui/scroll-area";

export function CurrencySelect(props: {
  variant?: ButtonProps["variant"];
  onSelect: (currency: { symbol: string; name: string }) => void;
  defaultValue?: string;
  className?: string;
  onBlur?: () => void;
  popoverContentProps?: PopoverContentProps;
}) {
  const {
    variant = "outline",
    defaultValue = "USD",
    className,
    onSelect,
    onBlur,
    popoverContentProps,
  } = props;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [search, setSearch] = useState("");

  const filteredCurrencies = useMemo(() => {
    if (!search) return currencies;
    return currencies.filter(
      (currency) =>
        currency.symbol.toLowerCase().includes(search.toLowerCase()) ||
        currency.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  const handleSelect = (currency: { symbol: string; name: string }) => {
    setValue(currency.symbol);
    onSelect(currency);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          role="combobox"
          aria-expanded={open}
          className={cn("w-[75px] justify-between uppercase", className)}
          onBlur={onBlur}
        >
          {value}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="end"
        withPortal={false}
        {...popoverContentProps}
      >
        <Command>
          <CommandInput
            placeholder="Search currency..."
            onValueChange={setSearch}
            className="h-9"
          />
          {filteredCurrencies.length === 0 && (
            <CommandEmpty className="border-t text-sm w-sm h-sm p-4 text-center">
              No currency found.
            </CommandEmpty>
          )}
          {filteredCurrencies.length > 0 && (
            <ScrollArea className="border-t w-sm max-h-[300px] overflow-auto">
              <CommandGroup>
                {filteredCurrencies.map((currency) => (
                  <CommandItem
                    key={currency.symbol}
                    value={currency.symbol}
                    onSelect={() => handleSelect(currency)}
                  >
                    <div className="flex gap-2">
                      <Badge
                        className="w-[45px] h-max flex justify-center"
                        variant="outline"
                      >
                        {currency.symbol}
                      </Badge>
                      <p>{currency.name}</p>
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === currency.symbol ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
