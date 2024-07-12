import type { CandlestickData, Portfolio } from "@/api/types";
import type { UTCTimestamp } from "lightweight-charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn, usd } from "@/lib/utils";
import ValueChange from "@/components/value-change";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThumbnailChart } from "../charts/thumbnail-chart";
import colors from "tailwindcss/colors";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePortfolioTableData } from "./usePortfolioTableData";
import { useQueries } from "@tanstack/react-query";
import { getSymbolChart } from "@/query/symbol";

type PortfolioTableData = {
  symbol: string;
  price: number;
  quantity: number;
  value: number;
  costBasis: number;
  change: {
    value: number;
    percentChange: number;
  };
  last30Days: {
    time: UTCTimestamp;
    value: number;
  }[];
};

const columnHelper = createColumnHelper<PortfolioTableData>();

export const PortfolioTable = (props: { portfolio: Portfolio }) => {
  const { portfolio } = props;
  const holdings = portfolio.holdings;
  const [sorting, setSorting] = useState([
    {
      id: "value",
      desc: true,
    },
    {
      id: "change",
      desc: true,
    },
  ]);

  const symbolQueries = useQueries({
    queries: portfolio.holdings.map((entry) => {
      const symbol = entry.symbol;
      return {
        queryKey: [symbol, "chart", "1mo"],
        queryFn: async () =>
          getSymbolChart({
            symbol,
            range: "1mo",
          }),
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
      };
    }),
  });

  const symbolsData = useMemo(() => {
    return portfolio.holdings
      .map(({ symbol }, index) => ({
        [symbol]: symbolQueries[index].data,
      }))
      .reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {} as Record<string, CandlestickData[]>,
      );
  }, [portfolio.holdings, symbolQueries]);

  const data = usePortfolioTableData({
    holdings,
    symbolsData,
  });

  const columns = useMemo(() => {
    return [
      columnHelper.accessor("symbol", {
        header: "Asset",
        cell: (row) => <p className="font-semibold">{row.getValue()}</p>,
        enableSorting: false,
      }),
      columnHelper.accessor("price", {
        header: "Price",
        cell: (row) => usd(row.getValue()),
        enableSorting: false,
      }),
      columnHelper.accessor("quantity", {
        header: "Quantity",
        cell: (row) => row.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor("costBasis", {
        header: "Cost Basis",
        cell: (row) => usd(row.getValue()),
        enableSorting: false,
      }),
      columnHelper.accessor("value", {
        header: "Value",
        cell: (row) => usd(row.getValue()),
        enableSorting: true,
        enableMultiSort: false,
      }),
      columnHelper.accessor("change", {
        header: "Change",
        cell: (row) => (
          <div>
            <ValueChange change={row.getValue().percentChange}>
              {usd(row.getValue().value)}
            </ValueChange>
            <ValueChange change={row.getValue().percentChange}>
              ({row.getValue().percentChange >= 0 ? "+" : ""}
              {row.getValue().percentChange.toFixed(2)}%)
            </ValueChange>
          </div>
        ),
        enableSorting: true,
        enableMultiSort: false,
      }),
      columnHelper.accessor("last30Days", {
        header: "Last 30 Days",
        cell: (row) => {
          if (row.getValue()?.length === 0) {
            return <div />;
          }
          <ThumbnailChart
            data={row.getValue()}
            height={50}
            color={
              row.getValue()?.[0]?.value < row.getValue()[row.getValue().length - 1].value
                ? colors.green[600]
                : colors.red[600]
            }
          />;
        },
        enableSorting: false,
      }),
    ];
  }, []);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    enableMultiRemove: true,
    sortDescFirst: true,
    enableSortingRemoval: false,
  });

  return (
    <div className="min-h-96">
      <Accordion type="single" collapsible className="flex flex-col w-full gap-1">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    <div className="flex items-center">
                      <p>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </p>
                      {header.column.getCanSort() && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => header.column.toggleSorting()}
                          className="w-6 h-6 ml-2"
                        >
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowDown className="w-4 h-4" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="h-[64px]">
                <AccordionTrigger
                  iconSide="left"
                  className={cn(
                    "rounded-md p-3 bg-background hover:bg-muted data-[state=open]:rounded-b-none data-[state=open]:bg-muted data-[state=open]:border-b",
                  )}
                >
                  <>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </>
                </AccordionTrigger>
                <AccordionItem value={row.original.symbol} className="table border-none">
                  <AccordionContent className="px-4 py-3 rounded-b-md bg-muted/50 border border-t-0">
                    Yes. It adheres to the WAI-ARIA design pattern.
                  </AccordionContent>
                </AccordionItem>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Accordion>
      {table.getRowModel().rows.length === 0 && (
        <div className="flex items-center justify-center text-muted-foreground text-sm h-[64px] w-full">
          <p>No holdings added yet.</p>
        </div>
      )}
    </div>
  );
};
