import { useCallback, useSyncExternalStore } from "react";
import type {
  PitchData,
  PitchHistoryEntry,
  VolumeLevelData,
} from "../types";
import {
  AUDIO_BUFFER_SIZE,
  ANALYSER_SMOOTHING_PITCH,
  ANALYSER_SMOOTHING_STEREO,
  DEFAULT_SAMPLE_RATE,
} from "../constants/audio";

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

// Audio resources held by the active capture session.
type AudioResources = {
  audioContext: AudioContext;
  stream: MediaStream;
  // Mono analyser for pitch detection (smoothing=0, raw waveform)
  analyser: AnalyserNode;
  dataArray: Float32Array;
  // Stereo analysers for L/R volume meters (smoothing=0.3, smoothed)
  leftAnalyser: AnalyserNode;
  leftDataArray: Float32Array;
  rightAnalyser: AnalyserNode;
  rightDataArray: Float32Array;
};

let resources: AudioResources | null = null;

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

function notifyListeners(listeners: ListenerSet): void {
  listeners.forEach((listener) => listener());
}

function updateState(partial: Partial<AudioCaptureState>): void {
  const prev = state;
  state = { ...state, ...partial };

  if (partial.isActive !== undefined && partial.isActive !== prev.isActive) {
    notifyListeners(isActiveListeners);
  }
  if (
    partial.currentPitch !== undefined ||
    partial.pitchHistory !== undefined ||
    partial.pitchTimestamp !== undefined
  ) {
    pitchSnapshot = {
      currentPitch: state.currentPitch,
      pitchHistory: state.pitchHistory,
    };
    notifyListeners(pitchListeners);
  }
  if (partial.volumeLevel !== undefined) {
    notifyListeners(volumeListeners);
  }
  if (partial.stream !== undefined) {
    notifyListeners(streamListeners);
  }
}

// ============================================================================
// Audio Lifecycle (start / stop)
// ============================================================================

async function startAudio(deviceId?: string): Promise<void> {
  // Disable all browser-side processing — we need the raw waveform.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2,
    },
  });

  const audioContext = new AudioContext();

  // Mono analyser for pitch detection (raw waveform)
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = AUDIO_BUFFER_SIZE;
  analyser.smoothingTimeConstant = ANALYSER_SMOOTHING_PITCH;

  // L/R analysers for volume meters (smoothed)
  const leftAnalyser = audioContext.createAnalyser();
  leftAnalyser.fftSize = AUDIO_BUFFER_SIZE;
  leftAnalyser.smoothingTimeConstant = ANALYSER_SMOOTHING_STEREO;

  const rightAnalyser = audioContext.createAnalyser();
  rightAnalyser.fftSize = AUDIO_BUFFER_SIZE;
  rightAnalyser.smoothingTimeConstant = ANALYSER_SMOOTHING_STEREO;

  // Wire the audio graph:
  //   source ──▶ analyser (mono)
  //          └─▶ splitter ──▶ leftAnalyser
  //                       └─▶ rightAnalyser
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const channelSplitter = audioContext.createChannelSplitter(2);
  source.connect(channelSplitter);
  channelSplitter.connect(leftAnalyser, 0);
  channelSplitter.connect(rightAnalyser, 1);

  resources = {
    audioContext,
    stream,
    analyser,
    dataArray: new Float32Array(analyser.fftSize),
    leftAnalyser,
    leftDataArray: new Float32Array(leftAnalyser.fftSize),
    rightAnalyser,
    rightDataArray: new Float32Array(rightAnalyser.fftSize),
  };

  updateState({
    isActive: true,
    sampleRate: audioContext.sampleRate,
    stream,
  });
}

function stopAudio(): void {
  if (!resources) return;

  resources.stream.getTracks().forEach((track) => track.stop());
  void resources.audioContext.close();
  resources = null;

  updateState({
    isActive: false,
    stream: null,
  });
}

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

export function useAudioControls(): {
  readonly startAudio: (deviceId?: string) => Promise<void>;
  readonly stopAudio: () => void;
} {
  const start = useCallback(
    (deviceId?: string): Promise<void> => startAudio(deviceId),
    [],
  );
  const stop = useCallback(() => stopAudio(), []);
  return { startAudio: start, stopAudio: stop };
}
