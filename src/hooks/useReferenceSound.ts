import { useCallback, useEffect, useRef, useState } from "react";

import {
  REFERENCE_FADE_SECONDS,
  VOLUME_DEFAULT_REFERENCE,
} from "@/constants/audio";

export type WaveformType = "sine" | "square" | "sawtooth" | "triangle";

export const WAVEFORM_TYPES: readonly WaveformType[] = [
  "sine",
  "square",
  "sawtooth",
  "triangle",
];

type Resources = {
  readonly audioContext: AudioContext;
  readonly oscillator: OscillatorNode;
  readonly gain: GainNode;
};

type ReferenceSound = {
  readonly isPlaying: boolean;
  readonly frequency: number;
  readonly waveform: WaveformType;
  readonly volume: number;
  readonly setFrequency: (frequency: number) => void;
  readonly setWaveform: (waveform: WaveformType) => void;
  readonly setVolume: (volume: number) => void;
  readonly toggle: () => void;
};

export function useReferenceSound(initialFrequency: number): ReferenceSound {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(initialFrequency);
  const [waveform, setWaveform] = useState<WaveformType>("sine");
  const [volume, setVolume] = useState(VOLUME_DEFAULT_REFERENCE);

  const resourcesRef = useRef<Resources | null>(null);

  const stop = useCallback(() => {
    const resources = resourcesRef.current;
    if (!resources) return;
    resourcesRef.current = null;
    setIsPlaying(false);

    const now = resources.audioContext.currentTime;
    const end = now + REFERENCE_FADE_SECONDS;
    resources.gain.gain.setValueAtTime(resources.gain.gain.value, now);
    resources.gain.gain.exponentialRampToValueAtTime(0.001, end);
    resources.oscillator.stop(end);
    void resources.audioContext.close();
  }, []);

  const start = useCallback(() => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // Exponential ramp can't touch 0, so start from a tiny value
    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(volume, 0.001),
      now + REFERENCE_FADE_SECONDS,
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    resourcesRef.current = { audioContext, oscillator, gain };
    setIsPlaying(true);
  }, [frequency, waveform, volume]);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else start();
  }, [isPlaying, start, stop]);

  useEffect(() => {
    const resources = resourcesRef.current;
    if (!resources) return;
    const now = resources.audioContext.currentTime;
    resources.oscillator.frequency.setValueAtTime(frequency, now);
    resources.oscillator.type = waveform;
    resources.gain.gain.setValueAtTime(Math.max(volume, 0.0001), now);
  }, [frequency, waveform, volume]);

  useEffect(() => {
    return () => {
      const resources = resourcesRef.current;
      if (resources) {
        resources.oscillator.stop();
        void resources.audioContext.close();
      }
    };
  }, []);

  return {
    isPlaying,
    frequency,
    waveform,
    volume,
    setFrequency,
    setWaveform,
    setVolume,
    toggle,
  };
}
