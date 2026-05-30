import { describe, it, expect } from "vitest";
import { calculateChannelVolume, checkIsStereo } from "./volumeUtils";

function generateSineWave(
  frequency: number,
  sampleRate: number,
  length: number,
  amplitude = 1,
): Float32Array {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] =
      amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return buffer;
}

describe("calculateChannelVolume", () => {
  it("returns zero RMS and -Infinity dB for a silent buffer", () => {
    const buffer = new Float32Array(2048);
    const result = calculateChannelVolume(buffer);

    expect(result.rms).toBe(0);
    expect(result.peak).toBe(0);
    expect(result.dB).toBe(-Infinity);
    expect(result.peakDb).toBe(-Infinity);
  });

  it("computes correct RMS and dB for a DC signal at 0.5", () => {
    const buffer = new Float32Array(2048).fill(0.5);
    const result = calculateChannelVolume(buffer);
    expect(result.rms).toBeCloseTo(0.5);

    expect(result.dB).toBeCloseTo(20 * Math.log10(0.5));
  });

  it("captures peak amplitude separately from RMS", () => {
    const buffer = generateSineWave(440, 44100, 2048);
    const result = calculateChannelVolume(buffer);

    expect(result.rms).toBeCloseTo(1 / Math.sqrt(2), 1);
    expect(result.peak).toBeCloseTo(1, 1);
    expect(result.peakDb).toBeCloseTo(0, 0);
  });

  it("scales dB logarithmically with amplitude", () => {
    const a = generateSineWave(440, 44100, 2048, 1.0);
    const b = generateSineWave(440, 44100, 2048, 0.5);
    const resultA = calculateChannelVolume(a);
    const resultB = calculateChannelVolume(b);

    expect(resultA.dB - resultB.dB).toBeCloseTo(6, 0);
  });
});

describe("checkIsStereo", () => {
  it("returns false when L and R are identical (mono input duplicated)", () => {
    const data = generateSineWave(440, 44100, 2048);
    const copy = new Float32Array(data);
    expect(checkIsStereo(data, copy)).toBe(false);
  });

  it("returns true when L and R differ significantly (true stereo)", () => {
    const left = generateSineWave(440, 44100, 2048);
    const right = generateSineWave(880, 44100, 2048);
    expect(checkIsStereo(left, right)).toBe(true);
  });

  it("returns false when L/R differ by less than the detection threshold", () => {
    const left = new Float32Array(2048).fill(0.5);
    const right = new Float32Array(2048).fill(0.5001); // below threshold
    expect(checkIsStereo(left, right)).toBe(false);
  });

  it("returns false for two silent buffers", () => {
    const left = new Float32Array(2048);
    const right = new Float32Array(2048);
    expect(checkIsStereo(left, right)).toBe(false);
  });
});
