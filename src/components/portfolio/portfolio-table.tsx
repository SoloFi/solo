import { useMemo, useState } from "react";
import type { Portfolio, PortfolioHolding, PortfolioTransaction } from "@/api/types";
import type { UTCTimestamp } from "lightweight-charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHeaderGroup,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { currency } from "@/lib/utils";
import ValueChange from "@/components/value-change";
import { ChevronDownIcon, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolioTableData } from "./usePortfolioTableData";
import { Accordion, AccordionContent, AccordionItem } from "../ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TransactionDialog } from "./transaction-dialog";
import { usePortfolioMutation } from "./usePortfolioMutation";
import { TransactionsTable } from "./transaction-table";
import { DeleteDialog } from "./delete-dialog";
import colors from "tailwindcss/colors";
import { ThumbnailChart } from "../charts/thumbnail-chart";
import { useUser } from "../user";

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
  const { currency: userCurrency } = useUser();

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
  const [transaction, setTransaction] = useState<{
    body: Partial<PortfolioTransaction>;
    symbol: string;
  } | null>(null);
  const [holdingToDelete, setHoldingToDelete] = useState<string | null>(null);

  const { deleteHoldingMutation, addTxMutation } = usePortfolioMutation();

  const holdingsMap = useMemo(() => {
    const map = new Map<string, PortfolioHolding>();
    portfolio.holdings.forEach((holding) => {
      map.set(holding.symbol, holding);
    });
    return map;
  }, [portfolio.holdings]);

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
        cell: (cell) => <p className="font-semibold">{cell.getValue()}</p>,
        enableSorting: false,
      }),
      columnHelper.accessor("price", {
        header: "Marktet Price",
        cell: (cell) => currency(cell.getValue(), userCurrency),
        enableSorting: false,
      }),
      columnHelper.accessor("quantity", {
        header: "Shares",
        cell: (cell) => cell.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor("costBasis", {
        header: "Cost Basis",
        cell: (cell) => currency(cell.getValue(), userCurrency),
        enableSorting: false,
      }),
      columnHelper.accessor("value", {
        header: "Portfolio Value",
        cell: (cell) => currency(cell.getValue(), userCurrency),
        enableSorting: true,
        enableMultiSort: false,
      }),
      columnHelper.accessor("change", {
        header: "Total Change",
        cell: (cell) => (
          <div>
            <ValueChange change={cell.getValue().percentChange}>
              {currency(cell.getValue().value, userCurrency)}
            </ValueChange>
            <ValueChange change={cell.getValue().percentChange}>
              ({cell.getValue().percentChange >= 0 ? "+" : ""}
              {cell.getValue().percentChange.toFixed(2)}%)
            </ValueChange>
          </div>
        ),
        enableSorting: true,
        enableMultiSort: false,
      }),
      columnHelper.accessor("last30Days", {
        header: "Last 30 Days",
        cell: (cell) => {
          const data = cell.row.original.last30Days;
          return (
            <ThumbnailChart
              data={data}
              height={50}
              color={
                data?.[0]?.value < data[data.length - 1].value
                  ? colors.green[600]
                  : colors.red[600]
              }
            />
          );
        },
        enableSorting: false,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="hidden group-hover:block">
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setHoldingToDelete(row.original.symbol);
              }}
            >
              <Trash width={16} height={16} />
            </Button>
          </div>
        ),
        enableSorting: false,
        meta: {
          className: "w-[60px]",
        },
      }),
    ];
  }, [userCurrency]);

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
              <TableHeaderGroup headerGroup={headerGroup} key={headerGroup.id} />
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <AccordionItem key={row.id} value={row.original.symbol} asChild>
                <>
                  <TableRow
                    className="group h-[64px] cursor-pointer hover:bg-muted data-[state=open]:rounded-b-none data-[state=open]:bg-muted border-0"
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
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-dashed hover:border-primary !text-primary"
                              onClick={() => {
                                setTransaction({
                                  symbol: row.original.symbol,
                                  body: {},
                                });
                              }}
                            >
                              <Plus width={16} height={16} />
                              Add Transaction
                            </Button>
                          </CardHeader>
                          {(holdingsMap.get(row.original.symbol)?.transactions.length ??
                            0) > 0 && (
                            <CardContent>
                              <TransactionsTable
                                transactions={
                                  holdingsMap.get(row.original.symbol)?.transactions ?? []
                                }
                                portfolioId={portfolio.id}
                                symbol={row.original.symbol}
                                currency={userCurrency}
                              />
                            </CardContent>
                          )}
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
      {transaction && (
        <TransactionDialog
          symbol={transaction.symbol}
          transaction={transaction.body}
          isOpen={!!transaction}
          onOpenChange={(isOpen) => setTransaction((prev) => (isOpen ? prev : null))}
          onSave={async (tx) => {
            await addTxMutation.mutateAsync({
              portfolioId: portfolio.id,
              symbol: transaction.symbol,
              tx,
            });
            setTransaction(null);
          }}
        />
      )}
      {holdingToDelete && (
        <DeleteDialog
          title={`Delete ${holdingToDelete} holding`}
          description="Are you sure you want to delete this holding? This action cannot be undone."
          isOpen={!!holdingToDelete}
          onOpenChange={() => setHoldingToDelete(null)}
          onDelete={async () => {
            await deleteHoldingMutation.mutateAsync({
              portfolioId: portfolio.id,
              symbol: holdingToDelete,
            });
            setHoldingToDelete(null);
          }}
        />
      )}
    </div>
  );
};
