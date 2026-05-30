import type { ChannelVolume } from "../types";
import {
  STEREO_DETECTION_THRESHOLD,
  STEREO_DIFF_RATIO,
  STEREO_SAMPLE_COUNT,
  STEREO_SAMPLE_INTERVAL,
} from "../constants/audio";

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

/**
 Decide whether a stereo input is genuinely stereo by sampling L/R differences.
 Counts samples that differ by more than the threshold; if more than 1/DIFF_RATIO
 of the sampled positions differ, treat as stereo.
*/
export function checkIsStereo(
  left: Float32Array,
  right: Float32Array,
): boolean {
  const checkSamples = Math.min(STEREO_SAMPLE_COUNT, left.length);
  let diffCount = 0;

  for (let i = 0; i < checkSamples; i += STEREO_SAMPLE_INTERVAL) {
    if (Math.abs(left[i] - right[i]) > STEREO_DETECTION_THRESHOLD) {
      diffCount++;
    }
  }

  return diffCount > checkSamples / STEREO_DIFF_RATIO;
}
