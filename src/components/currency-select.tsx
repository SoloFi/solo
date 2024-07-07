import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { PopoverContentProps } from "@radix-ui/react-popover";

export const currencies = [
  { symbol: "USD", name: "United States Dollar" },
  { symbol: "EUR", name: "Euro" },
  { symbol: "JPY", name: "Japanese Yen" },
  { symbol: "GBP", name: "Pound Sterling" },
  { symbol: "CHF", name: "Swiss Franc" },
  { symbol: "CAD", name: "Canadian Dollar" },
  { symbol: "AUD", name: "Australian Dollar" },
  { symbol: "CNY", name: "Chinese Yuan" },
  { symbol: "MXN", name: "Mexican Peso" },
  { symbol: "INR", name: "Indian Rupee" },
  { symbol: "ZAR", name: "South African Rand" },
  { symbol: "RUB", name: "Russian Ruble" },
  { symbol: "TRY", name: "Turkish Lira" },
  { symbol: "SGD", name: "Singapore Dollar" },
  { symbol: "HKD", name: "Hong Kong Dollar" },
  { symbol: "MYR", name: "Malaysian Ringgit" },
  { symbol: "THB", name: "Thai Baht" },
  { symbol: "PHP", name: "Philippine Peso" },
  { symbol: "IDR", name: "Indonesian Rupiah" },
  { symbol: "HUF", name: "Hungarian Forint" },
  { symbol: "SEK", name: "Swedish Krona" },
  { symbol: "NZD", name: "New Zealand Dollar" },
];

export function CurrencySelect(props: {
  defaultValue?: string;
  onSelect: (currency: { symbol: string; name: string }) => void;
  popoverContentProps?: PopoverContentProps;
}) {
  const { defaultValue = "USD", onSelect, popoverContentProps } = props;
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
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[75px] justify-between uppercase"
        >
          {value}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[225px] max-h-[400px] p-0 overflow-y-auto"
        align="end"
        {...popoverContentProps}
      >
        <Command>
          <CommandInput
            placeholder="Search currency..."
            onValueChange={setSearch}
            className="h-9"
          />
          <CommandEmpty>No currency found.</CommandEmpty>
          <CommandGroup>
            {filteredCurrencies.map((currency) => (
              <CommandItem
                key={currency.symbol}
                value={currency.symbol}
                onSelect={() => handleSelect(currency)}
              >
                <div className="flex gap-2">
                  <Badge className="w-[45px] h-max flex justify-center" variant="outline">
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
        </Command>
      </PopoverContent>
    </Popover>
  );
}
