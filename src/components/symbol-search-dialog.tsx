import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { useDebounceValue } from "usehooks-ts";
import { useEffect, useState } from "react";
import { searchSymbol } from "@/api/query/symbol";
import { SearchItem } from "@/api/YahooSearch";

const SymbolSearchDialog = (props: {
  isOpen?: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { isOpen, onOpenChange } = props;
  const [query, setQuery] = useDebounceValue("", 500);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);

  const groups = searchItems.reduce(
    (acc, item) => {
      if (acc[item.quoteType]) {
        acc[item.quoteType].push(item);
      } else {
        acc[item.quoteType] = [item];
      }
      return acc;
    },
    {} as Record<string, SearchItem[]>,
  );
  const resultGroups = Object.entries(groups).map(([key, items]) => ({
    key,
    items,
  }));

  useEffect(() => {
    if (!validQuery(query)) return;
    const handleSearch = async () => {
      try {
        const items = await searchSymbol(query);
        setSearchItems(items);
      } catch (error) {
        console.error(error);
      }
    };
    handleSearch();
  }, [query]);

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput
        onValueChange={(search) => {
          if (!validQuery(search)) {
            setSearchItems([]);
          }
          setQuery(search);
        }}
        placeholder="Search for symbols..."
      />
      <CommandList className="max-h-[400px]">
        {resultGroups.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
        {resultGroups.map(({ key, items }, index) => {
          return (
            <div key={`group-${key}`}>
              <CommandGroup key={key} heading={key.toUpperCase()}>
                {items.map((item) => (
                  <CommandItem key={item.symbol}>
                    <span className="mr-4 font-semibold">{item.symbol}</span>
                    <span className="text-foreground/70">{item.shortName}</span>
                    <span className="ml-auto text-foreground/70">{item.exchange}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {index < resultGroups.length - 1 && <CommandSeparator />}
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
};

export default SymbolSearchDialog;

function validQuery(query: string) {
  return query.trim() !== "" && query.length >= 3;
}
