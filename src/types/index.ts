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
