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
