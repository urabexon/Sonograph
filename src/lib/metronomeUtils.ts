import {
  BPM_MAX,
  BPM_MIN,
  METRONOME_BEATS_PER_MEASURE,
} from "@/constants/audio";

// Clamps a BPM value to the allowed range
export function clampBpm(bpm: number): number {
  return Math.max(BPM_MIN, Math.min(BPM_MAX, bpm));
}

export function secondsPerBeat(bpm: number): number {
  return 60 / bpm;
}

// The first beat of each measure is the downbeat
export function isDownbeat(beat: number): boolean {
  return beat % METRONOME_BEATS_PER_MEASURE === 0;
}

// Advances the next beat index, wrapping at the measure boundary
export function nextBeat(beat: number): number {
  return (beat + 1) % METRONOME_BEATS_PER_MEASURE;
}

// collects every beat that falls within the look-ahead window
export function collectDueBeats(params: {
  readonly nextNoteTime: number;
  readonly currentTime: number;
  readonly scheduleAheadTime: number;
  readonly bpm: number;
}): { readonly times: readonly number[]; readonly nextNoteTime: number } {
  const spb = secondsPerBeat(params.bpm);
  const horizon = params.currentTime + params.scheduleAheadTime;
  const times: number[] = [];
  let t = params.nextNoteTime;
  while (t < horizon) {
    times.push(t);
    t += spb;
  }
  return { times, nextNoteTime: t };
}
