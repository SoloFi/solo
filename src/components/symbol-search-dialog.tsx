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
import { searchSymbol } from "@/query/symbol";
import { SearchItem } from "@/api/YahooSearch";

const SymbolSearchDialog = (props: {
  isOpen?: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: SearchItem) => void;
}) => {
  const { isOpen, onOpenChange, onSelect } = props;
  const [query, setQuery] = useDebounceValue("", 150);
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

  const handleSelect = (item: SearchItem) => {
    onSelect(item);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <h1 className="text-lg font-semibold px-4 pt-3">Search for a symbol</h1>
      <CommandInput
        onValueChange={(search) => {
          if (!validQuery(search)) {
            setSearchItems([]);
          }
          setQuery(search);
        }}
        placeholder="Example: AAPL, apple, etc."
      />
      {resultGroups.length === 0 ? (
        <CommandList className="max-h-[400px] border-t">
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      ) : (
        <CommandList className="max-h-[400px] border-t">
          {resultGroups.map(({ key, items }, index) => {
            return (
              <div key={`group-${key}`}>
                <CommandGroup key={key} heading={key.toUpperCase()}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.symbol}
                      onClick={() => {}}
                      className="cursor-pointer pointer-events-auto !py-0 !px-0"
                    >
                      <button
                        onClick={() => {
                          handleSelect(item);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSelect(item);
                          }
                        }}
                        className="px-2 py-3 w-full flex justify-start"
                      >
                        <span className="mr-4 font-semibold">{item.symbol}</span>
                        <span className="text-foreground/70">{item.shortName}</span>
                        <span className="ml-auto text-foreground/70">
                          {item.exchange}
                        </span>
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {index < resultGroups.length - 1 && <CommandSeparator />}
              </div>
            );
          })}
        </CommandList>
      )}
    </CommandDialog>
  );
};

export default SymbolSearchDialog;

function validQuery(query: string) {
  return query.trim() !== "" && query.length >= 3;
}
