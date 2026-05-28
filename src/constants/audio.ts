// ============================================================================
// Pitch Detection Constants (YIN Algorithm)
// ============================================================================

// Buffer size for pitch detection (power of 2 for FFT compatibility)
export const AUDIO_BUFFER_SIZE = 2048;

// Default sample rate (CD quality)
export const DEFAULT_SAMPLE_RATE = 44100;

// Valid frequency range for pitch detection
// Covers most musical instruments (bass guitar ~40Hz, piccolo ~2000Hz)
export const PITCH_MIN_FREQUENCY = 60; // Hz
export const PITCH_MAX_FREQUENCY = 2000; // Hz

// YIN threshold for periodicity detection (CMNDF)
// Lower = stricter detection, higher = more permissive
export const PITCH_DETECTION_THRESHOLD = 0.1;
