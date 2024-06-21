import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default function ValueChange(props: {
  change: number;
  threshold?: number;
  children?: ReactNode;
  className?: string;
}) {
  const { children, change, threshold = 0, className } = props;

  return (
    <div
      className={cn(
        "flex items-center font-semibold",
        change >= threshold ? "text-green-600" : "text-red-600",
        className,
      )}
    >
      {children}
    </div>
  );
}
