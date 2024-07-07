import { Portfolio, PortfolioHolding } from "@/api/types";
import { Button } from "@/components/ui/button";
import { usd } from "@/lib/utils";
import { Activity, DollarSign } from "lucide-react";
import { useCallback, useState } from "react";
import SymbolSearchDialog from "@/components/symbol-search-dialog";
import { Separator } from "@/components/ui/separator";

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
    (symbol: string) => {
      const newHoldings: PortfolioHolding[] = [...portfolio.holdings];
      newHoldings.push({
        symbol,
        currency: "USD",
      });
      setPortfolio({ ...portfolio, holdings: newHoldings });
    },
    [portfolio],
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
          <span className="p-1 rounded-sm bg-emerald-500 text-white mr-2">
            <DollarSign className="w-4 h-4" />
          </span>
          Add Cash Balance
        </Button>
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Portfolio Holdings</h2>
        <Separator />
        {portfolio.holdings.length > 0 ? (
          portfolio.holdings.map((holding) => {
            return (
              <div key={holding.symbol} className="flex items-center justify-between">
                <div className="rounded-sm p-2">
                  <div className="text-lg font-semibold">{holding.symbol}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 text-sm text-center py-3">
            No holdings added yet.
          </div>
        )}
      </div>
      {symbolSearchOpen && (
        <SymbolSearchDialog
          isOpen={symbolSearchOpen}
          onOpenChange={setSymbolSearchOpen}
          onSymbolSelect={(symbol) => {
            setSymbolSearchOpen(false);
            addHolding(symbol);
          }}
        />
      )}
    </div>
  );
}
