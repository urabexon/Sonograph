import { useCallback, useEffect, useSyncExternalStore } from "react";
import type {
  PitchData,
  PitchHistoryEntry,
  VolumeLevelData,
} from "../types";
import {
  AUDIO_BUFFER_SIZE,
  ANALYSER_SMOOTHING_PITCH,
  ANALYSER_SMOOTHING_STEREO,
  DEFAULT_NOISE_GATE_THRESHOLD,
  DEFAULT_SAMPLE_RATE,
  PITCH_HISTORY_DURATION_MS,
  PITCH_TIMEOUT_MS,
  STEREO_CHECK_FRAMES,
} from "../constants/audio";
import { detectPitchJS, getRMS } from "../lib/pitchDetection";
import { calculateChannelVolume, checkIsStereo } from "../lib/volumeUtils";

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
  // Mono analyser for pitch detection
  analyser: AnalyserNode;
  dataArray: Float32Array<ArrayBuffer>;
  // Stereo analysers for L/R volume meters
  leftAnalyser: AnalyserNode;
  leftDataArray: Float32Array<ArrayBuffer>;
  rightAnalyser: AnalyserNode;
  rightDataArray: Float32Array<ArrayBuffer>;
  // Handle for the running RAF loop
  animationFrameId: number | null;
};

let resources: AudioResources | null = null;

// Adjustable from UI via useNoiseGateEffect.
let noiseGateThreshold = DEFAULT_NOISE_GATE_THRESHOLD;

// Rolling 30-second history of detected pitches. Module-level so the loop
// can mutate it in O(1) per frame without going through state on every push.
let pitchHistory: PitchHistoryEntry[] = [];

/*
  Stereo detection:
  - decided once per stream, then cached
  - null   → not yet decided (still checking)
  - true   → confirmed stereo (latched)
  - false  → confirmed mono   (latched)
*/
let isStereoDetected: boolean | null = null;
let stereoCheckFrameCount = 0;

function resetStereoDetection(): void {
  isStereoDetected = null;
  stereoCheckFrameCount = 0;
}

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
// Audio Processing Loop
// ============================================================================

function processAudio(): void {
  if (!resources) return;

  // Pull the latest waveform from each analyser.
  resources.analyser.getFloatTimeDomainData(resources.dataArray);
  resources.leftAnalyser.getFloatTimeDomainData(resources.leftDataArray);
  resources.rightAnalyser.getFloatTimeDomainData(resources.rightDataArray);

  // Snapshot the buffers — the analysers overwrite them on the next frame.
  const monoData = new Float32Array(resources.dataArray.length);
  monoData.set(resources.dataArray);

  const leftData = new Float32Array(resources.leftDataArray.length);
  leftData.set(resources.leftDataArray);

  const rightData = new Float32Array(resources.rightDataArray.length);
  rightData.set(resources.rightDataArray);

  const now = Date.now();

  // Detect pitch only when signal energy passes the noise gate.
  const rms = getRMS(monoData);
  if (rms >= noiseGateThreshold) {
    const frequency = detectPitchJS(monoData, state.sampleRate);
    if (frequency > 0) {
      pitchHistory = [...pitchHistory, { frequency, timestamp: now }];
    }
  }

  // Drop entries older than the rolling window
  const cutoff = now - PITCH_HISTORY_DURATION_MS;
  pitchHistory = pitchHistory.filter((entry) => entry.timestamp > cutoff);

  // Show the latest pitch for up to PITCH_TIMEOUT_MS after detection
  const lastEntry = pitchHistory[pitchHistory.length - 1];
  const currentPitch: PitchData =
    lastEntry && now - lastEntry.timestamp < PITCH_TIMEOUT_MS
      ? {
          frequency: lastEntry.frequency,
          note: null,
          cents: 0,
          timestamp: lastEntry.timestamp,
        }
      : { frequency: null, note: null, cents: 0, timestamp: now };

  // Stereo detection: latch true on the first stereo frame, latch false after
  // STEREO_CHECK_FRAMES frames with no stereo signal. Cached afterwards.
  let isStereo = isStereoDetected ?? false;
  if (isStereoDetected === null) {
    stereoCheckFrameCount++;
    if (checkIsStereo(leftData, rightData)) {
      isStereoDetected = true;
      isStereo = true;
    } else if (stereoCheckFrameCount >= STEREO_CHECK_FRAMES) {
      isStereoDetected = false;
    }
  }

  const volumeLevel: VolumeLevelData = {
    left: calculateChannelVolume(leftData),
    right: calculateChannelVolume(rightData),
    mono: calculateChannelVolume(monoData),
    isStereo,
  };

  updateState({
    currentPitch,
    pitchHistory,
    pitchTimestamp: now,
    volumeLevel,
  });

  resources.animationFrameId = requestAnimationFrame(processAudio);
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

  // Wire the audio
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
    animationFrameId: null,
  };

  // Reset history and stereo detection for the new session.
  pitchHistory = [];
  resetStereoDetection();

  updateState({
    isActive: true,
    sampleRate: audioContext.sampleRate,
    stream,
    currentPitch: DEFAULT_PITCH,
    pitchHistory: [],
    pitchTimestamp: Date.now(),
    volumeLevel: DEFAULT_VOLUME,
  });

  processAudio();
}

function stopAudio(): void {
  if (!resources) return;

  if (resources.animationFrameId !== null) {
    cancelAnimationFrame(resources.animationFrameId);
  }
  resources.stream.getTracks().forEach((track) => track.stop());
  void resources.audioContext.close();
  resources = null;
  pitchHistory = [];

  updateState({
    isActive: false,
    stream: null,
    currentPitch: DEFAULT_PITCH,
    pitchHistory: [],
    volumeLevel: DEFAULT_VOLUME,
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

// Apply a noise-gate threshold from the UI side.
// Module-level variable since the value changes infrequently and is not
// subscribed by useSyncExternalStore.
export function useNoiseGateEffect(threshold: number): void {
  useEffect(() => {
    noiseGateThreshold = threshold;
  }, [threshold]);
}
