import { useCallback, useState } from "react";
import { Portfolio, PortfolioHolding } from "@/api/types";
import { Button } from "@/components/ui/button";
import { cn, getForegroundColor, stringToColor } from "@/lib/utils";
import { Activity, DollarSign } from "lucide-react";
import SymbolSearchDialog from "@/components/symbol-search-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { SearchItem } from "@/api/YahooSearch";
import { Badge } from "@/components/ui/badge";

export function PortfolioEditor(props: {
  onPortfolioUpdate: (portfolio: Portfolio) => void;
  initialData?: Portfolio;
}) {
  const { initialData, onPortfolioUpdate } = props;
  const [portfolio, setPortfolio] = useState<Portfolio>(
    initialData ?? {
      id: "",
      name: "",
      holdings: [],
    },
  );

  const [symbolSearchOpen, setSymbolSearchOpen] = useState(false);

  const addHolding = useCallback(
    (item: SearchItem) => {
      const newHoldings: PortfolioHolding[] = [...portfolio.holdings];
      // make sure the holding is not already in the list
      if (newHoldings.find((holding) => holding.symbol === item.symbol)) {
        return;
      }
      newHoldings.push({
        symbol: item.symbol,
        shortName: item.shortName,
        type: item.quoteType,
        currency: "USD",
      });
      const newPortfolio = { ...portfolio, holdings: newHoldings };
      setPortfolio(newPortfolio);
      onPortfolioUpdate(newPortfolio);
    },
    [onPortfolioUpdate, portfolio],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="justify-start p-2 h-max"
          onClick={() => setSymbolSearchOpen(true)}
        >
          <span className="p-1 rounded-sm bg-indigo-500 text-white mr-2">
            <Activity className="w-4 h-4" />
          </span>
          Add Stock, ETF, Crypto, etc.
        </Button>
        <Button variant="secondary" className="justify-start p-2 h-max">
          <span className="p-1 rounded-sm bg-emerald-600 text-white mr-2">
            <DollarSign className="w-4 h-4" />
          </span>
          Add Cash Balance
        </Button>
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Portfolio Holdings</h2>
        <Separator />
        <Accordion type="single" collapsible className="flex flex-col w-full gap-1">
          {portfolio.holdings.length > 0 ? (
            portfolio.holdings.map((holding, index) => {
              return (
                <AccordionItem
                  key={`${holding}-${index}`}
                  value={holding.symbol}
                  className="border-none"
                >
                  <AccordionTrigger
                    iconSide="left"
                    className={cn(
                      "rounded-md p-3 bg-background hover:bg-muted data-[state=open]:rounded-b-none data-[state=open]:bg-muted data-[state=open]:border-b",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold">{holding.shortName}</div>
                        <div className="text-foreground/70">{holding.symbol}</div>
                      </div>
                      <Badge
                        className={cn(
                          "uppercase text-xs px-1 py-0.5 shadow-none",
                          getForegroundColor(
                            stringToColor(holding.type),
                            "text-white",
                            "text-black",
                          ),
                        )}
                        style={{ background: stringToColor(holding.type) }}
                      >
                        {holding.type}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 rounded-b-md bg-muted/50 border border-t-0">
                    Yes. It adheres to the WAI-ARIA design pattern.
                  </AccordionContent>
                </AccordionItem>
              );
            })
          ) : (
            <div className="text-gray-500 text-sm text-center py-3">
              No holdings added yet.
            </div>
          )}
        </Accordion>
      </div>
      {symbolSearchOpen && (
        <SymbolSearchDialog
          isOpen={symbolSearchOpen}
          onOpenChange={setSymbolSearchOpen}
          onSelect={(item) => {
            setSymbolSearchOpen(false);
            addHolding(item);
          }}
        />
      )}
    </div>
  );
}
