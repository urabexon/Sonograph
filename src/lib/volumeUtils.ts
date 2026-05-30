import type { ChannelVolume } from "../types";

/**
 Compute RMS, peak amplitude, and dBFS values for one channel buffer.
 dB falls to -Infinity for a silent buffer (log10(0)).
*/
export function calculateChannelVolume(data: Float32Array): ChannelVolume {
  let sum = 0;
  let peak = 0;
  for (const value of data) {
    sum += value * value;
    const abs = Math.abs(value);
    if (abs > peak) peak = abs;
  }
  const rms = Math.sqrt(sum / data.length);
  const dB = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  return { rms, dB, peak, peakDb };
}
