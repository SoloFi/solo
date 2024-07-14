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

const transactionColumnHelper = createColumnHelper<PortfolioTransaction>();

export const TransactionsTable = (props: { transactions: PortfolioTransaction[] }) => {
  const { transactions } = props;
  const [sorting, setSorting] = useState<SortingState>([{ id: "time", desc: true }]);

  const transactionColumns = useMemo(() => {
    return [
      transactionColumnHelper.accessor("time", {
        header: "Date",
        cell: (row) => dayjs(row.getValue() * 1000).format("MMMM DD, YYYY"),
        enableSorting: true,
      }),
      transactionColumnHelper.accessor("type", {
        header: "Transaction Type",
        cell: (row) => (
          <Badge
            className={
              row.getValue() === TransactionType.BUY
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }
          >
            {row.getValue()}
          </Badge>
        ),
        enableSorting: false,
      }),
      transactionColumnHelper.accessor("price", {
        header: "Marktet Price",
        cell: (row) => currency(row.getValue()),
        enableSorting: false,
      }),
      transactionColumnHelper.accessor("quantity", {
        header: "Shares",
        cell: (row) => row.getValue(),
        enableSorting: false,
      }),
    ];
  }, []);

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
          <TableHeaderGroup headerGroup={headerGroup} />
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
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
