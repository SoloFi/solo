import { PortfolioTransaction, TransactionType } from "@/api/types";
import { currency, dayjs } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderGroup,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Edit, Trash } from "lucide-react";

const transactionColumnHelper = createColumnHelper<PortfolioTransaction>();

export const TransactionsTable = (props: {
  txCurrency: string;
  transactions: PortfolioTransaction[];
}) => {
  const { txCurrency, transactions } = props;
  const [sorting, setSorting] = useState<SortingState>([{ id: "time", desc: true }]);

  const transactionColumns = useMemo(() => {
    return [
      transactionColumnHelper.accessor("time", {
        header: "Date",
        cell: (cell) => dayjs(cell.getValue() * 1000).format("MMMM DD, YYYY"),
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
        cell: (cell) => currency(cell.getValue(), txCurrency),
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
          currency(cell.row.original.price * cell.row.original.quantity, txCurrency),
        enableSorting: false,
      }),
      transactionColumnHelper.display({
        id: "actions",
        cell: () => {
          return (
            <div className="hidden group-hover:flex justify-end space-x-2">
              <Button size="icon" variant="outline" className="h-7 w-7">
                <Edit width={14} height={14} />
              </Button>
              <Button size="icon" variant="outline" className="h-7 w-7">
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
  }, [txCurrency]);

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
              <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
