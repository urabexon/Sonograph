import {
  PITCH_DETECTION_THRESHOLD,
  PITCH_MIN_FREQUENCY,
  PITCH_MAX_FREQUENCY,
} from "../constants/audio";

/**
 Small d[τ] means τ is a candidate period.
*/
export function differenceFunction(buffer: Float32Array): Float32Array {
  const halfBufferSize = Math.floor(buffer.length / 2);
  const difference = new Float32Array(halfBufferSize);

  for (let tau = 0; tau < halfBufferSize; tau++) {
    let sum = 0;
    for (let i = 0; i < halfBufferSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    difference[tau] = sum;
  }

  return difference;
}

/**
 Normalizes the difference function so a fixed threshold can be used regardless of input amplitude.
 cmndf[0] is set to 1 by definition.
*/
export function cumulativeMeanNormalizedDifference(
  difference: Float32Array,
): Float32Array {
  const cmndf = new Float32Array(difference.length);
  cmndf[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau < difference.length; tau++) {
    runningSum += difference[tau];
    cmndf[tau] = (difference[tau] * tau) / runningSum;
  }

  return cmndf;
}

/**
 Find the first τ where cmndf drops below the threshold, then follow it down to the local minimum to avoid stopping before the true period.
 Returns -1 when no τ satisfies the threshold (no detectable pitch).
*/
export function findTauEstimate(
  cmndf: Float32Array,
  threshold: number,
): number {
  for (let tau = 2; tau < cmndf.length; tau++) {
    if (cmndf[tau] < threshold) {
      while (tau + 1 < cmndf.length && cmndf[tau + 1] < cmndf[tau]) {
        tau++;
      }
      return tau;
    }
  }
  return -1;
}

/**
 Refine the integer τ estimate to sub-sample precision by fitting a parabola through (τ-1, τ, τ+1) and returning its vertex.
 Falls back to the smaller neighbor when τ sits on the array boundary.
*/
export function parabolicInterpolation(
  cmndf: Float32Array,
  tauEstimate: number,
): number {
  const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
  const x2 =
    tauEstimate + 1 < cmndf.length ? tauEstimate + 1 : tauEstimate;

  if (x0 === tauEstimate) {
    return cmndf[tauEstimate] <= cmndf[x2] ? tauEstimate : x2;
  }
  if (x2 === tauEstimate) {
    return cmndf[tauEstimate] <= cmndf[x0] ? tauEstimate : x0;
  }

  const s0 = cmndf[x0];
  const s1 = cmndf[tauEstimate];
  const s2 = cmndf[x2];
  return tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
}

/**
 Run the full YIN pipeline on a buffer and return the detected frequency.
 Returns -1 when no valid pitch is found or the frequency is out of range.
*/
export function detectPitchJS(
  buffer: Float32Array,
  sampleRate: number,
): number {
  const difference = differenceFunction(buffer);
  const cmndf = cumulativeMeanNormalizedDifference(difference);
  const tauEstimate = findTauEstimate(cmndf, PITCH_DETECTION_THRESHOLD);

  if (tauEstimate === -1) {
    return -1;
  }

  const refinedTau = parabolicInterpolation(cmndf, tauEstimate);
  const frequency = sampleRate / refinedTau;

  if (frequency < PITCH_MIN_FREQUENCY || frequency > PITCH_MAX_FREQUENCY) {
    return -1;
  }

  return frequency;
}

/**
 Compute the root mean square of the buffer.
 Used as a quick signal-energy check (noise gating) before running YIN.
*/
export function getRMS(buffer: Float32Array): number {
  let sum = 0;
  for (const value of buffer) {
    sum += value * value;
  }
  return Math.sqrt(sum / buffer.length);
}
