import { CandlestickData } from "@/api/types";
import { OpUnitType } from "dayjs";
import { UTCTimestamp } from "lightweight-charts";
import isNil from "lodash/isNil";
import { dayjs } from "./utils";

abstract class TimeSeries<T extends { time: UTCTimestamp }> {
  protected data: T[];

  constructor(data: T[]) {
    this.data = this.sortByTime(
      data.filter((data) => Object.values(data).every((v) => !isNil(v))),
    );
    this.normalizeTicks(this.granularityUnit());
  }

  protected sortByTime(data: T[]): T[] {
    return data.sort((a, b) => a.time - b.time);
  }

  abstract combine(other: TimeSeries<T>, op: (a: T, b: T) => T): TimeSeries<T>;

  protected abstract createEmpty(time: UTCTimestamp): T;

  getTimeAxis(): UTCTimestamp[] {
    return this.data.map((point) => point.time);
  }

  getValueAxis(): T[] {
    return this.data;
  }

  granularity(): number {
    const times = this.getTimeAxis();
    let lowestDiff = Infinity;
    for (let i = 0; i < times.length - 1; i++) {
      const diff = Math.abs(times[i] - times[i + 1]);
      if (diff < lowestDiff) lowestDiff = diff;
    }
    return lowestDiff;
  }

  granularityUnit(): OpUnitType {
    const g = this.granularity();
    if (g >= 3600 * 24 * 365) return "year";
    else if (g >= 3600 * 24 * 28) return "month";
    else if (g >= 3600 * 24 * 5) return "week";
    else if (g >= 3600 * 24) return "day";
    else if (g >= 3600) return "hour";
    else if (g >= 60) return "minute";
    else return "second";
  }

  normalizeTicks(unit: OpUnitType): this {
    this.data = this.data.map((point) => ({
      ...point,
      time: dayjs.unix(point.time).utc().startOf(unit).unix(),
    }));
    return this;
  }

  protected getValueAtTime(time: UTCTimestamp): T | undefined {
    return this.data.find((point) => point.time === time);
  }

  static addMultiple<T extends TimeSeries<{ time: UTCTimestamp }>>(
    series: T[],
  ): T {
    if (series.length === 0) {
      throw new Error("Cannot add an empty array of time series");
    }
    return series.reduce((acc, curr) => acc.add(curr) as T);
  }

  abstract add(other: TimeSeries<T>): TimeSeries<T>;
  abstract multiply(other: TimeSeries<T>): TimeSeries<T>;
}

export interface LineChartData {
  time: UTCTimestamp;
  value: number;
}

class LineTimeSeries extends TimeSeries<LineChartData> {
  constructor(data: LineChartData[]) {
    super(data);
  }

  combine(
    other: LineTimeSeries,
    op: (a: LineChartData, b: LineChartData) => LineChartData,
  ): LineTimeSeries {
    const allTimes = [
      ...new Set([...this.getTimeAxis(), ...other.getTimeAxis()]),
    ].sort((a, b) => a - b);
    const newData: LineChartData[] = [];

    let lastThis: LineChartData | null = null;
    let lastOther: LineChartData | null = null;

    for (const time of allTimes) {
      const thisValue: LineChartData =
        this.getValueAtTime(time) || lastThis || this.createEmpty(time);
      thisValue.time = time;
      const otherValue: LineChartData =
        other.getValueAtTime(time) || lastOther || other.createEmpty(time);
      otherValue.time = time;

      const combinedValue = op(thisValue, otherValue);

      if (
        combinedValue.value !== 0 ||
        (thisValue.value !== 0 && otherValue.value !== 0)
      ) {
        newData.push(combinedValue);
      }

      lastThis = thisValue.value !== 0 ? { ...thisValue, time } : lastThis;
      lastOther = otherValue.value !== 0 ? { ...otherValue, time } : lastOther;
    }

    return new LineTimeSeries(newData);
  }

  protected createEmpty(time: UTCTimestamp): LineChartData {
    return { time, value: 0 };
  }

  add(other: LineTimeSeries): LineTimeSeries {
    return this.combine(other, (a, b) => ({
      time: a.time,
      value: a.value + b.value,
    }));
  }

  multiply(other: LineTimeSeries): LineTimeSeries {
    return this.combine(other, (a, b) => ({
      time: a.time,
      value: (a.value || 1) * (b.value || 1),
    }));
  }
}

class CandlestickTimeSeries extends TimeSeries<CandlestickData> {
  constructor(data: CandlestickData[]) {
    super(data);
  }

  combine(
    other: CandlestickTimeSeries,
    op: (a: CandlestickData, b: CandlestickData) => CandlestickData,
  ): CandlestickTimeSeries {
    const allTimes = [
      ...new Set([...this.getTimeAxis(), ...other.getTimeAxis()]),
    ].sort((a, b) => a - b);
    const newData: CandlestickData[] = [];

    let lastThis: CandlestickData | null = null;
    let lastOther: CandlestickData | null = null;

    for (const time of allTimes) {
      const thisValue: CandlestickData =
        this.getValueAtTime(time) || lastThis || this.createEmpty(time);
      thisValue.time = time;
      const otherValue: CandlestickData =
        other.getValueAtTime(time) || lastOther || other.createEmpty(time);
      otherValue.time = time;

      const combinedValue = op(thisValue, otherValue);

      if (
        !this.isDefaultCandle(combinedValue) ||
        (!this.isDefaultCandle(thisValue) && !this.isDefaultCandle(otherValue))
      ) {
        newData.push(combinedValue);
      }
      lastThis = !this.isDefaultCandle(thisValue) ? thisValue : lastThis;
      lastOther = !this.isDefaultCandle(otherValue) ? otherValue : lastOther;
    }

    return new CandlestickTimeSeries(newData);
  }

  protected createEmpty(time: UTCTimestamp): CandlestickData {
    return { time, open: 0, high: 0, low: 0, close: 0, volume: 0 };
  }

  private isDefaultCandle(candle: CandlestickData): boolean {
    return (
      candle.open === 0 &&
      candle.high === 0 &&
      candle.low === 0 &&
      candle.close === 0
    );
  }

  add(other: CandlestickTimeSeries): CandlestickTimeSeries {
    return this.combine(other, (a, b) => ({
      time: a.time,
      open: a.open + b.open,
      high: a.high + b.high,
      low: a.low + b.low,
      close: a.close + b.close,
    }));
  }

  multiply(other: CandlestickTimeSeries): CandlestickTimeSeries {
    return this.combine(other, (a, b) => ({
      time: a.time,
      open: (a.open || 1) * (b.open || 1),
      high: (a.high || 1) * (b.high || 1),
      low: (a.low || 1) * (b.low || 1),
      close: (a.close || 1) * (b.close || 1),
    }));
  }
}

export { CandlestickTimeSeries, LineTimeSeries };
