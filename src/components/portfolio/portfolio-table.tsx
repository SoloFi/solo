import type { Portfolio } from "@/api/portfolio";
import type { CandlestickData } from "lightweight-charts";
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
import { usd } from "@/lib/utils";
import PriceChange from "../price-change";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "../ui/button";

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
};

const columnHelper = createColumnHelper<PortfolioTableData>();

export const PortfolioTable = (props: {
  holdings: Portfolio["holdings"];
  symbolsData: Record<string, CandlestickData[] | undefined>;
}) => {
  const { holdings, symbolsData } = props;
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

  const data = useMemo(() => {
    return holdings.map((entry) => {
      const symbol = entry.symbol;
      const buys = entry.buys;
      const lastBuy = buys[buys.length - 1];
      const chartData = symbolsData[symbol];
      const lastData = chartData ? chartData[chartData.length - 1] : undefined;
      const price = lastData?.close ?? lastBuy.price;
      const quantity = buys.reduce((acc, buy) => acc + buy.quantity, 0);
      const value = price * quantity;
      const change = ((lastData?.close ?? 0) - lastBuy.price) * quantity;
      const costBasis = buys.reduce((acc, buy) => acc + buy.price * buy.quantity, 0);
      const percentChange = change / costBasis;
      return {
        symbol,
        price,
        quantity,
        value,
        costBasis,
        change: {
          value: change,
          percentChange,
        },
      };
    });
  }, [holdings, symbolsData]);

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
          <PriceChange
            value={row.getValue().value}
            percentChange={row.getValue().percentChange}
          />
        ),
        enableSorting: true,
        enableMultiSort: false,
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
    <Table>
      {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} colSpan={header.colSpan}>
                <div className="flex items-center">
                  <p>{flexRender(header.column.columnDef.header, header.getContext())}</p>
                  {header.column.getCanSort() ? (
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
                  ) : (
                    ""
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
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className="text-lg">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
