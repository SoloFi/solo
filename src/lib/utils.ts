import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs, { type Dayjs, type ManipulateType } from "dayjs";
import utc from "dayjs/plugin/utc";
import colors from "tailwindcss/colors";

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

export function stringToColor(str: string) {
  const themeColors = [
    colors.amber[600],
    colors.lime[600],
    colors.emerald[600],
    colors.cyan[600],
    colors.blue[600],
    colors.violet[600],
    colors.fuchsia[600],
    colors.rose[600],
  ];
  const hash = hashString(str);
  const index = hash % themeColors.length;
  console.log("index", hash, index);
  return themeColors[index];
}

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getForegroundColor(
  hexColor: string,
  lightColor = "white",
  darkColor = "black",
) {
  const threshold = 0.5; // adjust this value to fine-tune the contrast threshold
  const rgb = hexToRgb(hexColor);
  if (!rgb) return lightColor;
  const luminance = calculateLuminance(rgb);
  return luminance > threshold ? darkColor : lightColor;
}

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function calculateLuminance(rgb: { r: number; g: number; b: number }) {
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
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

export function parseJwt(token: string) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );
  return JSON.parse(jsonPayload);
}
