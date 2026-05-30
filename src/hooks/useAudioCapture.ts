import { useSyncExternalStore } from "react";
import type {
  PitchData,
  PitchHistoryEntry,
  VolumeLevelData,
} from "../types";
import { DEFAULT_SAMPLE_RATE } from "../constants/audio";

// ============================================================================
// State
// ============================================================================

type AudioCaptureState = {
  readonly isActive: boolean;
  readonly sampleRate: number;
  readonly stream: MediaStream | null;
  readonly currentPitch: PitchData;
  readonly pitchHistory: readonly PitchHistoryEntry[];
  readonly pitchTimestamp: number;
  readonly volumeLevel: VolumeLevelData;
};

const DEFAULT_PITCH: PitchData = {
  frequency: null,
  note: null,
  cents: 0,
  timestamp: Date.now(),
};

const DEFAULT_CHANNEL = { rms: 0, dB: -Infinity, peak: 0, peakDb: -Infinity };

const DEFAULT_VOLUME: VolumeLevelData = {
  left: DEFAULT_CHANNEL,
  right: DEFAULT_CHANNEL,
  mono: DEFAULT_CHANNEL,
  isStereo: false,
};

const createInitialState = (): AudioCaptureState => ({
  isActive: false,
  sampleRate: DEFAULT_SAMPLE_RATE,
  stream: null,
  currentPitch: DEFAULT_PITCH,
  pitchHistory: [],
  pitchTimestamp: Date.now(),
  volumeLevel: DEFAULT_VOLUME,
});

let state: AudioCaptureState = createInitialState();

// Cached snapshot for useSyncExternalStore. The hook compares references,
// so getSnapshot must return the same object when nothing has changed.
type PitchSnapshot = {
  readonly currentPitch: PitchData;
  readonly pitchHistory: readonly PitchHistoryEntry[];
};

let pitchSnapshot: PitchSnapshot = {
  currentPitch: state.currentPitch,
  pitchHistory: state.pitchHistory,
};

// ============================================================================
// Listener Management (separate per data channel for selective re-renders)
// ============================================================================

type ListenerSet = Set<() => void>;
const isActiveListeners: ListenerSet = new Set();
const pitchListeners: ListenerSet = new Set();
const volumeListeners: ListenerSet = new Set();
const streamListeners: ListenerSet = new Set();

// ============================================================================
// Subscribe Functions (called by useSyncExternalStore)
// ============================================================================

function subscribeIsActive(listener: () => void): () => void {
  isActiveListeners.add(listener);
  return () => isActiveListeners.delete(listener);
}

function subscribePitch(listener: () => void): () => void {
  pitchListeners.add(listener);
  return () => pitchListeners.delete(listener);
}

function subscribeVolume(listener: () => void): () => void {
  volumeListeners.add(listener);
  return () => volumeListeners.delete(listener);
}

function subscribeStream(listener: () => void): () => void {
  streamListeners.add(listener);
  return () => streamListeners.delete(listener);
}

// ============================================================================
// Public Hooks
// ============================================================================

export function useIsActive(): boolean {
  return useSyncExternalStore(subscribeIsActive, () => state.isActive);
}

export function usePitchData(): PitchSnapshot {
  return useSyncExternalStore(subscribePitch, () => pitchSnapshot);
}

export function useVolumeLevelData(): VolumeLevelData {
  return useSyncExternalStore(subscribeVolume, () => state.volumeLevel);
}

export function useAudioStream(): MediaStream | null {
  return useSyncExternalStore(subscribeStream, () => state.stream);
}
