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
import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { usd } from "@/lib/utils";

type PortfolioTableData = {
  symbol: string;
  price: number;
  quantity: number;
  value: number;
  change: number;
};

const columnHelper = createColumnHelper<PortfolioTableData>();

export const PortfolioTable = (props: {
  holdings: Portfolio["holdings"];
  symbolsData: Record<string, CandlestickData[] | undefined>;
}) => {
  const { holdings, symbolsData } = props;

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
      return {
        symbol,
        price,
        quantity,
        value,
        change,
      };
    });
  }, [holdings, symbolsData]);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor("symbol", {
        header: "Symbol",
        cell: (row) => row.getValue(),
      }),
      columnHelper.accessor("price", {
        header: "Price",
        cell: (row) => usd(row.getValue()),
      }),
      columnHelper.accessor("quantity", {
        header: "Quantity",
        cell: (row) => row.getValue(),
      }),
      columnHelper.accessor("value", {
        header: "Value",
        cell: (row) => usd(row.getValue()),
      }),
      columnHelper.accessor("change", {
        header: "Change",
        cell: (row) => usd(row.getValue()),
      }),
    ];
  }, []);

  const table = useReactTable({ columns, data, getCoreRowModel: getCoreRowModel() });

  return (
    <Table>
      {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} colSpan={header.colSpan}>
                {flexRender(header.column.columnDef.header, header.getContext())}
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
