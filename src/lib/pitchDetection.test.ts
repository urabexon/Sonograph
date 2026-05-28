import { describe, it, expect } from "vitest";
import {
  differenceFunction,
  cumulativeMeanNormalizedDifference,
} from "./pitchDetection";

function generateSineWave(
  frequency: number,
  sampleRate: number,
  length: number,
): Float32Array {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return buffer;
}

describe("differenceFunction", () => {
  it("returns an array half the buffer size", () => {
    const buffer = new Float32Array(2048);
    const result = differenceFunction(buffer);
    expect(result.length).toBe(1024);
  });

  it("d[0] is always 0 (signal vs itself)", () => {
    const buffer = generateSineWave(440, 44100, 2048);
    const result = differenceFunction(buffer);
    expect(result[0]).toBe(0);
  });

  it("has a minimum near the period for a 440Hz sine wave", () => {
    const sampleRate = 44100;
    const frequency = 440;
    const buffer = generateSineWave(frequency, sampleRate, 2048);
    const result = differenceFunction(buffer);

    const expectedPeriod = Math.round(sampleRate / frequency);

    expect(result[expectedPeriod]).toBeLessThan(result[expectedPeriod / 2]);
  });

  it("returns all zeros for a silent (all-zero) buffer", () => {
    const buffer = new Float32Array(2048);
    const result = differenceFunction(buffer);
    for (const value of result) {
      expect(value).toBe(0);
    }
  });
});

describe("cumulativeMeanNormalizedDifference", () => {
  it("cmndf[0] is always 1 by definition", () => {
    const buffer = generateSineWave(440, 44100, 2048);
    const difference = differenceFunction(buffer);
    const cmndf = cumulativeMeanNormalizedDifference(difference);
    expect(cmndf[0]).toBe(1);
  });

  it("returns an array the same length as the input", () => {
    const difference = new Float32Array(1024);
    const cmndf = cumulativeMeanNormalizedDifference(difference);
    expect(cmndf.length).toBe(1024);
  });

  it("drops well below threshold (0.1) near the true period", () => {
    const sampleRate = 44100;
    const frequency = 440;
    const buffer = generateSineWave(frequency, sampleRate, 2048);
    const difference = differenceFunction(buffer);
    const cmndf = cumulativeMeanNormalizedDifference(difference);

    const expectedPeriod = Math.round(sampleRate / frequency);
    expect(cmndf[expectedPeriod]).toBeLessThan(0.1);
  });

  it("normalizes regardless of amplitude (loud vs quiet)", () => {
    const sampleRate = 44100;
    const frequency = 440;
    const loud = generateSineWave(frequency, sampleRate, 2048);
    const quiet = new Float32Array(loud.length);
    for (let i = 0; i < loud.length; i++) quiet[i] = loud[i] * 0.01;

    const loudCmndf = cumulativeMeanNormalizedDifference(
      differenceFunction(loud),
    );
    const quietCmndf = cumulativeMeanNormalizedDifference(
      differenceFunction(quiet),
    );

    const period = Math.round(sampleRate / frequency);
    expect(quietCmndf[period]).toBeCloseTo(loudCmndf[period], 3);
  });
});
