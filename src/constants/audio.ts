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

// ============================================================================
// Audio Pipeline Constants
// ============================================================================

// How long to keep pitch history
export const PITCH_HISTORY_DURATION_MS = 30000;

// Max time to keep displaying the last frequency before clearing
export const PITCH_TIMEOUT_MS = 200;

// RMS threshold below which pitch detection is skipped
export const DEFAULT_NOISE_GATE_THRESHOLD = 0.01;

// AnalyserNode smoothing
export const ANALYSER_SMOOTHING_PITCH = 0;
export const ANALYSER_SMOOTHING_STEREO = 0.3;

// ============================================================================
// Stereo Detection Constants
// ============================================================================

// Number of initial frames to check stereo before caching the result
export const STEREO_CHECK_FRAMES = 10;

// Samples to compare across L/R per frame during stereo detection
export const STEREO_SAMPLE_COUNT = 200;

// Sample every Nth index when comparing L/R
export const STEREO_SAMPLE_INTERVAL = 5;

// Minimum L/R difference to count as a different sample
export const STEREO_DETECTION_THRESHOLD = 0.005;

// Fraction of samples that must differ to consider input stereo
export const STEREO_DIFF_RATIO = 50;
