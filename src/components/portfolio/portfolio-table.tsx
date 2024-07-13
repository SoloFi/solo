import type { Portfolio } from "@/api/types";
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
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { usd } from "@/lib/utils";
import ValueChange from "@/components/value-change";
import { ArrowDown, ArrowUp, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThumbnailChart } from "../charts/thumbnail-chart";
import colors from "tailwindcss/colors";
import { usePortfolioTableData } from "./usePortfolioTableData";

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

  const data = usePortfolioTableData({
    holdings: portfolio.holdings,
  });

  const columns = useMemo(() => {
    return [
      columnHelper.display({
        id: "expand",
        header: "",
        cell: ({ row }) => (
          <ChevronDownIcon
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
            data-state={row.getIsExpanded() ? "open" : "closed"}
          />
        ),
        enableSorting: false,
        size: 20,
        meta: {
          className: "[&[data-state=open]>svg]:rotate-180",
        },
      }),
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
          console.log(row.getValue());
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
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    enableMultiRemove: true,
    sortDescFirst: true,
    enableSortingRemoval: false,
    enableExpanding: true,
  });

  return (
    <div className="min-h-96">
      {/* <Accordion type="single" collapsible className="flex flex-col w-full gap-1"> */}
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
            <TableRow
              key={row.id}
              className="h-[64px] cursor-pointer"
              onClick={() => row.toggleExpanded()}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cell.column.columnDef.meta?.className}
                  data-state={cell.row.getIsExpanded() ? "open" : "closed"}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* </Accordion> */}
      {table.getRowModel().rows.length === 0 && (
        <div className="flex items-center justify-center text-muted-foreground text-sm h-[64px] w-full">
          <p>No holdings added yet.</p>
        </div>
      )}
    </div>
  );
};
