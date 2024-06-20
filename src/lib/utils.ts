import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs, { type Dayjs, type ManipulateType } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export { dayjs };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hexTransp(hexColor: string, alpha: number) {
  const map = (value: number, oldRange: [number, number], newRange: [number, number]) => {
    const newValue =
      ((value - oldRange[0]) * (newRange[1] - newRange[0])) /
        (oldRange[1] - oldRange[0]) +
      newRange[0];
    return Math.round(Math.min(Math.max(newValue, newRange[0]), newRange[1]));
  };
  if (alpha > 100 || alpha < 0) return "ff";
  const byteValue = map(alpha, [0, 100], [0, 255]);
  let hexValue = byteValue.toString(16);
  if (hexValue.length === 1) hexValue = `0${hexValue}`;
  return `${hexColor}${hexValue}`;
}

export function usd(value: number, decimals = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  }).format(value);
}

export function dayjsRange(params: {
  start: Dayjs;
  end: Dayjs;
  value: number;
  unit: ManipulateType;
}) {
  const { start, end, value, unit } = params;
  const range = [];
  let current = start;
  while (!current.isAfter(end)) {
    range.push(current);
    current = current.add(value, unit);
  }
  return range;
}

export function percentChange(oldValue: number, newValue: number) {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : Infinity;
  }
  return ((newValue - oldValue) / oldValue) * 100;
}
