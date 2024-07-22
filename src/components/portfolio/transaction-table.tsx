import { PortfolioTransaction, TransactionType } from "@/api/types";
import { dayjs, formatCurrency } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Edit, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderGroup,
  TableRow,
} from "../ui/table";
import { DeleteDialog } from "./delete-dialog";
import { TransactionDialog } from "./transaction-dialog";
import { usePortfolioMutation } from "./usePortfolioMutation";
import { useUser } from "../user";

const transactionColumnHelper = createColumnHelper<PortfolioTransaction>();

export const TransactionsTable = (props: {
  transactions: PortfolioTransaction[];
  symbol: string;
  portfolioId: string;
}) => {
  const { transactions, symbol, portfolioId } = props;
  const { currency } = useUser();
  const [sorting, setSorting] = useState<SortingState>([{ id: "time", desc: true }]);
  const [txToEdit, setTxToEdit] = useState<PortfolioTransaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<PortfolioTransaction | null>(null);

  const { editTxMutation, deleteTxMutation } = usePortfolioMutation();

  const transactionColumns = useMemo(() => {
    return [
      transactionColumnHelper.accessor("time", {
        header: "Date",
        cell: (cell) => dayjs.unix(cell.getValue()).format("MMMM DD, YYYY"),
        enableSorting: true,
      }),
      transactionColumnHelper.accessor("type", {
        header: "Transaction Type",
        cell: (cell) => (
          <Badge
            className={
              cell.getValue() === TransactionType.BUY
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }
          >
            {cell.getValue()}
          </Badge>
        ),
        enableSorting: false,
      }),
      transactionColumnHelper.accessor("price", {
        header: "Marktet Price",
        cell: (cell) => formatCurrency(cell.getValue(), currency),
        enableSorting: false,
      }),
      transactionColumnHelper.accessor("quantity", {
        header: "Shares",
        cell: (cell) => cell.getValue(),
        enableSorting: false,
      }),
      transactionColumnHelper.display({
        header: "Total Cost",
        cell: (cell) =>
          formatCurrency(cell.row.original.price * cell.row.original.quantity, currency),
        enableSorting: false,
      }),
      transactionColumnHelper.display({
        id: "actions",
        cell: (cell) => {
          return (
            <div className="hidden group-hover:flex justify-end space-x-2">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => setTxToEdit(cell.row.original)}
              >
                <Edit width={14} height={14} />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() => setTxToDelete(cell.row.original)}
              >
                <Trash width={14} height={14} />
              </Button>
            </div>
          );
        },
        meta: {
          className: "w-[120px]",
        },
        enableSorting: false,
      }),
    ];
  }, [currency]);

  const table = useReactTable({
    data: transactions,
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableHeaderGroup headerGroup={headerGroup} key={headerGroup.id} />
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="group h-12">
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cell.column.columnDef.meta?.className}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {txToEdit && (
        <TransactionDialog
          symbol={symbol}
          transaction={txToEdit}
          isOpen={!!txToEdit}
          onOpenChange={(isOpen) => setTxToEdit((prev) => (isOpen ? prev : null))}
          onSave={async (tx) => {
            await editTxMutation.mutateAsync({
              portfolioId,
              symbol,
              tx,
            });
            setTxToEdit(null);
          }}
        />
      )}
      {txToDelete && (
        <DeleteDialog
          title={`Delete ${symbol} transaction`}
          description="Are you sure you want to delete this transaction? This action cannot be undone."
          isOpen={!!txToDelete}
          onOpenChange={() => setTxToDelete((prev) => (prev ? null : prev))}
          onDelete={async () => {
            await deleteTxMutation.mutateAsync({
              portfolioId,
              symbol,
              txId: txToDelete.id,
            });
            setTxToDelete(null);
          }}
        />
      )}
    </>
  );
};
