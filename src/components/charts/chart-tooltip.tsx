export default function ChartTooltip(props: { time?: string; value?: string }) {
  const { time, value } = props;
  return (
    <div className="absolute top-0 left-0">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-lg">{time}</div>
    </div>
  );
}
