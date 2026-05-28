import { describe, it, expect } from "vitest";
import { differenceFunction } from "./pitchDetection";

// Generate a sine wave for testing
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

    // Expected period in samples: 44100 / 440 ≈ 100.23
    const expectedPeriod = Math.round(sampleRate / frequency);

    // d[expectedPeriod] should be much smaller than d[expectedPeriod / 2]
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
