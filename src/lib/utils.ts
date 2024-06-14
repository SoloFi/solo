import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hexTransp(hexColor: string, alpha: number) {
  const map = (
    value: number,
    oldRange: [number, number],
    newRange: [number, number],
  ) => {
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
