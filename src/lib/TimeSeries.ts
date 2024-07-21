import { OpUnitType } from "dayjs";
import intesection from "lodash/intersection";
import isNil from "lodash/isNil";
import { dayjs } from "./utils";

export type TimeSeriesValueKey = string;
export type TimeSeriesValue = { time: number } & { [key: string]: string | number };
export type TimeSeriesMap<T extends TimeSeriesValue> = Map<number, T>;

function TimeSeriesValuesFromTimeSeriesMap<T extends TimeSeriesValue>(
  tsMap: TimeSeriesMap<T>,
): TimeSeriesValue[] {
  return Array.from(tsMap.values());
}

class TimeSeries<T extends TimeSeriesValue> {
  private tsMap: TimeSeriesMap<T>;
  private valueKeys: TimeSeriesValueKey[];

  constructor(params: { data: T[]; valueKeys: TimeSeriesValueKey[] }) {
    const { data, valueKeys } = params;
    this.valueKeys = valueKeys;
    this.tsMap = new Map();
    for (const value of data) {
      this.tsMap.set(value.time, value);
    }

    this.fillNullishValues();
    this.normalizeTicks(this.granularityUnit());
  }

  getTimeAxis() {
    return Array.from(this.tsMap.keys());
  }

  getValueAxis() {
    return Array.from(this.tsMap.values());
  }

  granularity() {
    const data = this.getTimeAxis();
    let lowestDiff = Infinity;
    for (let i = 0; i < data.length - 1; i++) {
      const at = dayjs.unix(data[i]);
      const bt = dayjs.unix(data[i + 1]);
      const diff = at.diff(bt);
      if (diff < lowestDiff) lowestDiff = diff;
    }
    return lowestDiff;
  }

  granularityUnit(): OpUnitType {
    const g = this.granularity();
    if (g >= 3600 * 24 * 365)
      return "year"; // 1 YEAR
    else if (g >= 3600 * 24 * 28)
      return "month"; // 1 MONTH
    else if (g >= 3600 * 24 * 5)
      return "week"; // 1 WEEK
    else if (g >= 3600 * 24)
      return "day"; // 1 DAY
    else if (g >= 3600)
      return "hour"; // 1 HOUR
    else if (g >= 60)
      return "minute"; // 1 MINUTE
    else return "second"; // 1 SECOND
  }

  normalizeTicks(unit: OpUnitType) {
    const newTsMap = new Map();
    for (const [time, value] of this.tsMap) {
      const newTime = dayjs.unix(time).startOf(unit).unix();
      newTsMap.set(newTime, value);
    }
    this.tsMap = newTsMap;
  }

  fillNullishValues() {
    let lastKnownValue: T = {} as T;
    for (const [time, tsMapValue] of this.tsMap) {
      if (Object.values(tsMapValue).some(isNil)) this.tsMap.set(time, lastKnownValue);
      else lastKnownValue = tsMapValue;
    }
  }

  static add(a: TimeSeriesValue, b: TimeSeriesValue, keys: TimeSeriesValueKey[]) {
    const newValue: TimeSeriesValue = {} as TimeSeriesValue;
    for (const key of keys) {
      if (typeof a[key] === "string" || typeof b[key] === "string") continue;
      newValue[key] = a[key] + b[key];
    }
    return newValue;
  }

  static multiply(a: TimeSeriesValue, b: TimeSeriesValue, keys: TimeSeriesValueKey[]) {
    const newValue: TimeSeriesValue = {} as TimeSeriesValue;
    for (const key of keys) {
      if (typeof a[key] === "string" || typeof b[key] === "string") continue;
      newValue[key] = a[key] * b[key];
    }
    return newValue;
  }

  static intersection(
    a: TimeSeries<TimeSeriesValue>,
    b: TimeSeries<TimeSeriesValue>,
    operation: (
      a: TimeSeriesValue,
      b: TimeSeriesValue,
      keys: TimeSeriesValueKey[],
    ) => TimeSeriesValue,
  ) {
    const newTsMap: TimeSeriesMap<TimeSeriesValue> = new Map();
    for (const [time, value] of a.tsMap) {
      const otherValue = b.tsMap.get(time);
      if (otherValue) {
        const newValue = operation(
          value,
          otherValue,
          intesection(a.valueKeys, b.valueKeys),
        );
        newTsMap.set(time, newValue);
      }
    }
    return new TimeSeries({
      data: TimeSeriesValuesFromTimeSeriesMap(newTsMap),
      valueKeys: a.valueKeys,
    });
  }

  static intersectSeries(
    series: TimeSeries<TimeSeriesValue>[],
    operation: (
      a: TimeSeriesValue,
      b: TimeSeriesValue,
      keys: TimeSeriesValueKey[],
    ) => TimeSeriesValue,
  ) {
    let result = series[0];
    for (let i = 1; i < series.length; i++) {
      result = TimeSeries.intersection(result, series[i], operation);
    }
    return result;
  }
}

export default TimeSeries;
