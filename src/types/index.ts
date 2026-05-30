// Note name notation system
export type Notation = "letter" | "solfege";

// Accidental preference for display
export type Accidental = "sharp" | "flat";

// Tuning system: equal temperament or just intonation
export type Temperament = "equal" | "just";

// Transposition for wind instruments
// (semitones offset from concert pitch)
export type Transposition =
  | "C" // Concert pitch (0)
  | "Bb" // B♭ instruments (-2)
  | "Eb" // E♭ instruments (+3)
  | "F" // F instruments (-5)
  | "G" // G instruments (+5)
  | "A"; // A instruments (+3)

export const TRANSPOSITION_SEMITONES: Record<Transposition, number> = {
  C: 0,
  Bb: -2,
  Eb: 3,
  F: -5,
  G: 5,
  A: 3,
};

/**
 Current pitch reading from the audio pipeline
 frequency / note are null when no pitch is detected
*/
export type PitchData = {
  readonly frequency: number | null;
  readonly note: string | null;
  readonly cents: number;
  readonly timestamp: number;
};

// One entry in the rolling pitch history
export type PitchHistoryEntry = {
  readonly frequency: number;
  readonly timestamp: number;
};

// Volume level for one channel
export type ChannelVolume = {
  readonly rms: number;
  readonly dB: number; // current dBFS (-Infinity = silence, 0 = max)
  readonly peak: number;
  readonly peakDb: number; // peak dBFS in the recent window
};

// Volume data for stereo or mono input
export type VolumeLevelData = {
  readonly left: ChannelVolume;
  readonly right: ChannelVolume;
  readonly mono: ChannelVolume;
  readonly isStereo: boolean;
};
