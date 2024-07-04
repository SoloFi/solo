import type { Portfolio } from "@/api/types";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
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
import { dayjs, percentChange, usd } from "@/lib/utils";
import ValueChange from "../value-change";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "../ui/button";
import { getCostBasisAtTime } from "./utils";
import { ThumbnailChart } from "../charts/thumbnail-chart";
import colors from "tailwindcss/colors";

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
      if (!buys) {
        return {
          symbol,
          price: 0,
          quantity: 0,
          value: 0,
          costBasis: 0,
          change: {
            value: 0,
            percentChange: 0,
          },
          last30Days: [],
        };
      }
      const lastBuy = buys[buys.length - 1];
      const chartData = symbolsData[symbol];
      const lastData = chartData ? chartData[chartData.length - 1] : undefined;
      const price = lastData?.close ?? lastBuy.price;
      const quantity = buys.reduce((acc, buy) => acc + buy.quantity, 0);
      const value = price * quantity;
      const costBasis = getCostBasisAtTime(entry, dayjs().utc().unix() as UTCTimestamp);
      const last30Days =
        chartData?.slice(-30).map((data) => ({
          time: data.time as UTCTimestamp,
          value: data.close,
        })) ?? [];
      // fill in null values with last known non-null value
      let lastKnownValue = 0;
      for (let i = 0; i < last30Days.length; i++) {
        if (last30Days[i].value === null) {
          last30Days[i].value = lastKnownValue;
        } else {
          lastKnownValue = last30Days[i].value;
        }
      }
      return {
        symbol,
        price,
        quantity,
        value,
        costBasis,
        change: {
          value: value - costBasis,
          percentChange: percentChange(costBasis, value),
        },
        last30Days,
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
        cell: (row) => (
          <ThumbnailChart
            data={row.getValue()}
            height={50}
            color={
              row.getValue()[0].value < row.getValue()[row.getValue().length - 1].value
                ? colors.green[600]
                : colors.red[600]
            }
          />
        ),
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
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} colSpan={header.colSpan}>
                <div className="flex items-center">
                  <p>{flexRender(header.column.columnDef.header, header.getContext())}</p>
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
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
