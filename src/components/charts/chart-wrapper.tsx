import { ReactNode } from "@tanstack/react-router";

export default function ChartWrapper(props: { children: ReactNode; height?: number }) {
  const { children, height } = props;
  return (
    <div
      className="flex w-full overflow-hidden relative"
      style={{ height: height ?? 400 }}
    >
      <div className="absolute w-full h-full">{children}</div>
    </div>
  );
}
