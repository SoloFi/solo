import { OpUnitType } from "dayjs";
import intesection from "lodash/intersection";
import isNil from "lodash/isNil";
import { dayjs } from "./utils";

export type TimeSeriesValueKey = string;
export type TimeSeriesValue = { time: number } & Record<TimeSeriesValueKey, unknown>;
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
    return Array.from(this.tsMap.keys()).sort();
  }

  getValueAxis() {
    return Array.from(this.tsMap.values()).sort((a, b) => a.time - b.time);
  }

  granularity() {
    const data = this.getTimeAxis();
    let lowestDiff = Infinity;
    for (let i = 0; i < data.length - 1; i++) {
      const diff = Math.abs(data[i] - data[i + 1]);
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
      newTsMap.set(newTime, { ...value, time: newTime });
    }
    this.tsMap = newTsMap;
  }

  fillNullishValues() {
    let lastKnownValue: T = {} as T;
    for (const [time, tsMapValue] of this.tsMap) {
      if (Object.values(tsMapValue).some(isNil)) this.tsMap.set(time, { ...lastKnownValue, time });
      else lastKnownValue = tsMapValue;
    }
  }

  static add(a: TimeSeriesValue, b: TimeSeriesValue, keys: TimeSeriesValueKey[]) {
    const newValue: TimeSeriesValue = {} as TimeSeriesValue;
    for (const key of keys) {
      if (typeof a[key] === "number" && typeof b[key] === "number") {
        newValue[key] = a[key] + b[key];
      }
    }
    return newValue;
  }

  static multiply(a: TimeSeriesValue, b: TimeSeriesValue, keys: TimeSeriesValueKey[]) {
    const newValue: TimeSeriesValue = {} as TimeSeriesValue;
    for (const key of keys) {
      if (typeof a[key] === "number" && typeof b[key] === "number") {
        newValue[key] = a[key] * b[key];
      }
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
    const commonKeys = intesection(a.valueKeys, b.valueKeys);
    for (const [time, value] of a.tsMap) {
      const otherValue = b.tsMap.get(time);
      if (otherValue) {
        const newValue = operation(
          value,
          otherValue,
          commonKeys,
        );
        newTsMap.set(time, { ...newValue, time });
      }
    }
    return new TimeSeries({
      data: TimeSeriesValuesFromTimeSeriesMap(newTsMap),
      valueKeys: commonKeys,
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
    // sort series by latest first time
    series.sort((a, b) => b.getTimeAxis()[0] - a.getTimeAxis()[0]);
    let result = series[0];
    for (let i = 1; i < series.length; i++) {
      result = TimeSeries.intersection(result, series[i], operation);
    }
    return result;
  }
}

export default TimeSeries;
