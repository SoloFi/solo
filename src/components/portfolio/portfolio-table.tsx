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
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { usd } from "@/lib/utils";
import ValueChange from "@/components/value-change";
import { ArrowDown, ArrowUp, ChevronDownIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThumbnailChart } from "../charts/thumbnail-chart";
import colors from "tailwindcss/colors";
import { usePortfolioTableData } from "./usePortfolioTableData";
import { Accordion, AccordionContent, AccordionItem } from "../ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
  const [expanded, setExpanded] = useState<string>("");

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
      <Accordion
        type="single"
        value={expanded}
        onValueChange={setExpanded}
        collapsible
        className="flex flex-col w-full gap-1"
      >
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
              <AccordionItem key={row.id} value={row.original.symbol} asChild>
                <>
                  <TableRow
                    className="h-[64px] cursor-pointer hover:bg-muted data-[state=open]:rounded-b-none data-[state=open]:bg-muted border-0"
                    onClick={() =>
                      setExpanded(
                        expanded === row.original.symbol ? "" : row.original.symbol,
                      )
                    }
                    data-state={expanded === row.original.symbol ? "open" : "closed"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cell.column.columnDef.meta?.className}
                        data-state={
                          cell.row.original.symbol === expanded ? "open" : "closed"
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="!bg-muted">
                    <TableCell colSpan={columns.length} className="!p-0">
                      <AccordionContent className="flex p-2 justify-center">
                        <Card className="w-full rounded-none">
                          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                            <CardTitle>Transactions</CardTitle>
                            <Button size="sm">
                              <Plus width={16} height={16} />
                              Add Transaction
                            </Button>
                          </CardHeader>
                          <CardContent></CardContent>
                        </Card>
                      </AccordionContent>
                    </TableCell>
                  </TableRow>
                </>
              </AccordionItem>
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
