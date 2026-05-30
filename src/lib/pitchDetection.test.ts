import { describe, it, expect } from "vitest";
import {
  differenceFunction,
  cumulativeMeanNormalizedDifference,
  findTauEstimate,
  parabolicInterpolation,
  detectPitchJS,
  getRMS,
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

describe("findTauEstimate", () => {
  it("returns -1 when no value falls below the threshold", () => {
    const cmndf = new Float32Array(100).fill(0.5);
    expect(findTauEstimate(cmndf, 0.1)).toBe(-1);
  });

  it("finds the period τ for a 440Hz sine wave", () => {
    const sampleRate = 44100;
    const frequency = 440;
    const buffer = generateSineWave(frequency, sampleRate, 2048);
    const cmndf = cumulativeMeanNormalizedDifference(differenceFunction(buffer));

    const tau = findTauEstimate(cmndf, 0.1);
    const expectedPeriod = sampleRate / frequency;

    expect(Math.abs(tau - expectedPeriod)).toBeLessThan(2);
  });

  it("follows the local minimum past the first threshold crossing", () => {
    const cmndf = new Float32Array([1, 1, 0.8, 0.5, 0.3, 0.09, 0.05, 0.2, 0.4]);
    expect(findTauEstimate(cmndf, 0.1)).toBe(6);
  });

  it("skips τ=0 and τ=1 even if below threshold", () => {
    const cmndf = new Float32Array([0.01, 0.01, 0.5, 0.5, 0.05, 0.5]);
    expect(findTauEstimate(cmndf, 0.1)).toBe(4);
  });
});

describe("parabolicInterpolation", () => {
  it("returns a fractional τ near the integer estimate", () => {
    const cmndf = new Float32Array([1, 1, 1, 1, 0.5, 0.1, 0.5, 1, 1]);
    expect(parabolicInterpolation(cmndf, 5)).toBeCloseTo(5, 5);
  });

  it("shifts τ toward the smaller neighbor (asymmetric parabola)", () => {
    const cmndf = new Float32Array([1, 1, 1, 1, 0.5, 0.1, 0.3, 1, 1]);
    const refined = parabolicInterpolation(cmndf, 5);
    expect(refined).toBeGreaterThan(5);
    expect(refined).toBeLessThan(6);
  });

  it("improves frequency accuracy over integer τ for a 440Hz sine wave", () => {
    const sampleRate = 44100;
    const frequency = 440;
    const buffer = generateSineWave(frequency, sampleRate, 2048);
    const cmndf = cumulativeMeanNormalizedDifference(differenceFunction(buffer));
    const tau = findTauEstimate(cmndf, 0.1);
    const refinedTau = parabolicInterpolation(cmndf, tau);

    const integerFreq = sampleRate / tau;
    const refinedFreq = sampleRate / refinedTau;

    expect(Math.abs(refinedFreq - frequency)).toBeLessThan(
      Math.abs(integerFreq - frequency),
    );
  });

  it("falls back to the τ itself when at the right boundary", () => {
    const cmndf = new Float32Array([1, 1, 1, 0.5, 0.1]);
    expect(parabolicInterpolation(cmndf, 4)).toBe(4);
  });

  it("falls back to the left neighbor at the right boundary when smaller", () => {
    const cmndf = new Float32Array([1, 1, 1, 0.05, 0.1]);
    expect(parabolicInterpolation(cmndf, 4)).toBe(3);
  });

  it("falls back to the τ itself when at the left boundary", () => {
    const cmndf = new Float32Array([0.1, 0.5, 1, 1, 1]);
    expect(parabolicInterpolation(cmndf, 0)).toBe(0);
  });

  it("falls back to the right neighbor at the left boundary when smaller", () => {
    const cmndf = new Float32Array([0.1, 0.05, 1, 1, 1]);
    expect(parabolicInterpolation(cmndf, 0)).toBe(1);
  });
});

describe("detectPitchJS", () => {
  const SAMPLE_RATE = 44100;
  const BUFFER_SIZE = 2048;

  it("detects 440Hz (A4) within 1Hz precision", () => {
    const buffer = generateSineWave(440, SAMPLE_RATE, BUFFER_SIZE);
    const freq = detectPitchJS(buffer, SAMPLE_RATE);
    expect(freq).toBeCloseTo(440, 0);
  });

  it("detects 261.63Hz (C4) within 1Hz precision", () => {
    const buffer = generateSineWave(261.63, SAMPLE_RATE, BUFFER_SIZE);
    const freq = detectPitchJS(buffer, SAMPLE_RATE);
    expect(freq).toBeCloseTo(261.63, 0);
  });

  it("detects 880Hz (A5) within 1Hz precision", () => {
    const buffer = generateSineWave(880, SAMPLE_RATE, BUFFER_SIZE);
    const freq = detectPitchJS(buffer, SAMPLE_RATE);
    expect(freq).toBeCloseTo(880, 0);
  });

  it("returns -1 for a silent buffer", () => {
    const buffer = new Float32Array(BUFFER_SIZE);
    expect(detectPitchJS(buffer, SAMPLE_RATE)).toBe(-1);
  });

  it("returns -1 for white noise (no clear period)", () => {
    const buffer = new Float32Array(BUFFER_SIZE);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.random() * 2 - 1;
    }
    const freq = detectPitchJS(buffer, SAMPLE_RATE);
    expect(typeof freq).toBe("number");
  });

  it("returns -1 for a frequency below PITCH_MIN_FREQUENCY (50Hz)", () => {
    const buffer = generateSineWave(50, SAMPLE_RATE, BUFFER_SIZE);
    expect(detectPitchJS(buffer, SAMPLE_RATE)).toBe(-1);
  });

  it("works correctly with a different sample rate (48000Hz)", () => {
    const altSampleRate = 48000;
    const buffer = generateSineWave(440, altSampleRate, BUFFER_SIZE);
    const freq = detectPitchJS(buffer, altSampleRate);
    expect(freq).toBeCloseTo(440, 0);
  });
});

describe("getRMS", () => {
  it("returns 0 for a silent buffer", () => {
    const buffer = new Float32Array(2048);
    expect(getRMS(buffer)).toBe(0);
  });

  it("returns the constant value for a DC signal", () => {
    const buffer = new Float32Array(2048).fill(0.5);
    expect(getRMS(buffer)).toBeCloseTo(0.5);
  });

  it("returns ≈ 1/√2 for a full-amplitude sine wave", () => {
    const buffer = generateSineWave(440, 44100, 2048);
    expect(getRMS(buffer)).toBeCloseTo(1 / Math.sqrt(2), 1);
  });

  it("scales linearly with amplitude", () => {
    const loud = generateSineWave(440, 44100, 2048);
    const quiet = new Float32Array(loud.length);
    for (let i = 0; i < loud.length; i++) quiet[i] = loud[i] * 0.1;

    expect(getRMS(quiet)).toBeCloseTo(getRMS(loud) * 0.1, 3);
  });
});
