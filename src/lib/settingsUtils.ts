import {
  DEFAULT_ADVANCED_SETTINGS,
  DEFAULT_SETTINGS,
  type Accidental,
  type AdvancedSettings,
  type AudioFormat,
  type Notation,
  type Settings,
  type Temperament,
  type Transposition,
} from "@/types";

// Each sanitizer accepts an `unknown` (anything from localStorage) and either
// returns a valid value or falls back to the default. Per-field isolation keeps
// a single corrupted field from wiping out the whole settings object.

function sanitizeNotation(value: unknown): Notation {
  return value === "letter" || value === "solfege"
    ? value
    : DEFAULT_SETTINGS.notation;
}

function sanitizeAccidental(value: unknown): Accidental {
  return value === "sharp" || value === "flat"
    ? value
    : DEFAULT_SETTINGS.accidental;
}

function sanitizeAudioFormat(value: unknown): AudioFormat {
  return value === "wav" || value === "mp3"
    ? value
    : DEFAULT_SETTINGS.audioFormat;
}

function sanitizeTemperament(value: unknown): Temperament {
  return value === "equal" || value === "just"
    ? value
    : DEFAULT_ADVANCED_SETTINGS.temperament;
}

const TRANSPOSITIONS: readonly Transposition[] = [
  "C",
  "Bb",
  "Eb",
  "F",
  "G",
  "A",
];

function sanitizeTransposition(value: unknown): Transposition {
  return TRANSPOSITIONS.includes(value as Transposition)
    ? (value as Transposition)
    : DEFAULT_ADVANCED_SETTINGS.transposition;
}

function sanitizeReferenceFrequency(value: unknown): number {
  return typeof value === "number" && value >= 400 && value <= 480
    ? value
    : DEFAULT_ADVANCED_SETTINGS.referenceFrequency;
}

function sanitizeCentThreshold(value: unknown): number {
  return typeof value === "number" && value >= 1 && value <= 50
    ? value
    : DEFAULT_ADVANCED_SETTINGS.centThreshold;
}

function sanitizeNoiseGateThreshold(value: unknown): number {
  return typeof value === "number" && value >= 0.001 && value <= 0.1
    ? value
    : DEFAULT_ADVANCED_SETTINGS.noiseGateThreshold;
}

function sanitizeAdvanced(value: unknown): AdvancedSettings {
  if (!value || typeof value !== "object") return DEFAULT_ADVANCED_SETTINGS;
  const v = value as Record<string, unknown>;
  return {
    referenceFrequency: sanitizeReferenceFrequency(v.referenceFrequency),
    transposition: sanitizeTransposition(v.transposition),
    centThreshold: sanitizeCentThreshold(v.centThreshold),
    temperament: sanitizeTemperament(v.temperament),
    noiseGateThreshold: sanitizeNoiseGateThreshold(v.noiseGateThreshold),
  };
}

/**
 Validate a value parsed from localStorage and return a complete Settings.
 Each field is sanitized independently so partial corruption is tolerated.
*/
export function sanitizeSettings(value: unknown): Settings {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS;
  const v = value as Record<string, unknown>;
  return {
    notation: sanitizeNotation(v.notation),
    accidental: sanitizeAccidental(v.accidental),
    audioFormat: sanitizeAudioFormat(v.audioFormat),
    advanced: sanitizeAdvanced(v.advanced),
  };
}
