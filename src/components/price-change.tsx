import { cn, usd } from "@/lib/utils";

export default function PriceChange(props: {
  value: number;
  percentChange: number;
  className?: string;
}) {
  const { value, percentChange, className } = props;

  return (
    <div
      className={cn(
        "flex items-center font-semibold",
        percentChange > 0 ? "text-green-500" : "text-red-500",
        className,
      )}
    >
      <span>
        {percentChange > 0 ? "+" : ""}
        {usd(value)}
      </span>
      <span className="ml-2">
        ({percentChange > 0 ? "+" : ""}
        {percent(percentChange)})
      </span>
    </div>
  );
}

function percent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}
