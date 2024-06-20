import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function PriceChange(props: {
  percentChange: number;
  children?: ReactNode;
  className?: string;
}) {
  const { children, percentChange, className } = props;

  return (
    <div
      className={cn(
        "flex items-center font-semibold",
        percentChange > 0 ? "text-green-500" : "text-red-500",
        className,
      )}
    >
      {children}
    </div>
  );
}
