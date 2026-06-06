import { useSyncExternalStore } from "react";

import {
  BPM_DEFAULT,
  METRONOME_CLICK_ATTACK,
  METRONOME_CLICK_DECAY,
  METRONOME_CLICK_FREQUENCY,
  METRONOME_SCHEDULE_AHEAD_TIME,
  METRONOME_SCHEDULER_INTERVAL,
  VOLUME_DEFAULT_METRONOME,
  VOLUME_MAX,
  VOLUME_MIN,
} from "@/constants/audio";
import { clampBpm, collectDueBeats, nextBeat } from "@/lib/metronomeUtils";

type MetronomeControl = {
  readonly isPlaying: boolean;
  readonly bpm: number;
  readonly volume: number;
};

type Resources = {
  readonly audioContext: AudioContext;
  nextNoteTime: number;
  timerId: number | null;
};

let control: MetronomeControl = {
  isPlaying: false,
  bpm: BPM_DEFAULT,
  volume: VOLUME_DEFAULT_METRONOME,
};
let beat = 0;
let resources: Resources | null = null;

type ListenerSet = Set<() => void>;
const controlListeners: ListenerSet = new Set();
const beatListeners: ListenerSet = new Set();

function setControl(partial: Partial<MetronomeControl>): void {
  control = { ...control, ...partial };
  controlListeners.forEach((l) => l());
}

function setBeat(value: number): void {
  beat = value;
  beatListeners.forEach((l) => l());
}

function playClick(audioContext: AudioContext, time: number): void {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(METRONOME_CLICK_FREQUENCY, time);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(
    control.volume,
    time + METRONOME_CLICK_ATTACK,
  );
  gain.gain.exponentialRampToValueAtTime(0.001, time + METRONOME_CLICK_DECAY);

  oscillator.start(time);
  oscillator.stop(time + METRONOME_CLICK_DECAY);
}

function scheduler(): void {
  if (!resources) return;
  const { times, nextNoteTime } = collectDueBeats({
    nextNoteTime: resources.nextNoteTime,
    currentTime: resources.audioContext.currentTime,
    scheduleAheadTime: METRONOME_SCHEDULE_AHEAD_TIME,
    bpm: control.bpm,
  });
  for (const time of times) {
    playClick(resources.audioContext, time);
    setBeat(nextBeat(beat));
  }
  resources.nextNoteTime = nextNoteTime;
}

function startMetronome(): void {
  stopMetronome();
  const audioContext = new AudioContext();
  resources = {
    audioContext,
    nextNoteTime: audioContext.currentTime,
    timerId: null,
  };
  setBeat(0);
  resources.timerId = window.setInterval(
    scheduler,
    METRONOME_SCHEDULER_INTERVAL,
  );
  setControl({ isPlaying: true });
}

function stopMetronome(): void {
  if (!resources) return;
  if (resources.timerId !== null) clearInterval(resources.timerId);
  void resources.audioContext.close();
  resources = null;
  setBeat(0);
  setControl({ isPlaying: false });
}

function toggleMetronome(): void {
  if (control.isPlaying) stopMetronome();
  else startMetronome();
}

function setBpm(bpm: number): void {
  setControl({ bpm: clampBpm(bpm) });
}

function setVolume(volume: number): void {
  setControl({ volume: Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume)) });
}

const DEFAULT_CONTROL: MetronomeControl = {
  isPlaying: false,
  bpm: BPM_DEFAULT,
  volume: VOLUME_DEFAULT_METRONOME,
};

type MetronomeControlApi = MetronomeControl & {
  readonly setBpm: (bpm: number) => void;
  readonly setVolume: (volume: number) => void;
  readonly toggle: () => void;
};

export function useMetronomeControl(): MetronomeControlApi {
  const state = useSyncExternalStore(
    (cb) => {
      controlListeners.add(cb);
      return () => controlListeners.delete(cb);
    },
    () => control,
    () => DEFAULT_CONTROL,
  );
  return { ...state, setBpm, setVolume, toggle: toggleMetronome };
}

export function useMetronomeBeat(): number {
  return useSyncExternalStore(
    (cb) => {
      beatListeners.add(cb);
      return () => beatListeners.delete(cb);
    },
    () => beat,
    () => 0,
  );
}
