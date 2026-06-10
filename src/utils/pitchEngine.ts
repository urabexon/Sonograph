import { detectPitchJS, getRMS as getRmsJs } from "@/lib/pitchDetection";
import init, { calculate_rms, detect_pitch } from "@/wasm/pitch";

type PitchImpl = {
  readonly detect: (buffer: Float32Array, sampleRate: number) => number;
  readonly rms: (buffer: Float32Array) => number;
};

const jsImpl: PitchImpl = { detect: detectPitchJS, rms: getRmsJs };
let impl: PitchImpl = jsImpl;
let usingWasm = false;

export async function initPitchEngine(): Promise<void> {
  try {
    await init();
    impl = { detect: detect_pitch, rms: calculate_rms };
    usingWasm = true;
  } catch {
    impl = jsImpl;
    usingWasm = false;
  }
}

export function detectPitch(buffer: Float32Array, sampleRate: number): number {
  return impl.detect(buffer, sampleRate);
}

export function getRMS(buffer: Float32Array): number {
  return impl.rms(buffer);
}

export function isUsingWasm(): boolean {
  return usingWasm;
}
