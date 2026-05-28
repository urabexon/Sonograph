// YIN step 1: difference function
// d[τ] = Σ (x[i] - x[i+τ])²
// Small d[τ] means τ is a candidate period.
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
