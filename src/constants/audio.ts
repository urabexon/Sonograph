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

// Default seconds of audio the recording ring buffer retains
export const RECORDING_DURATION_SECONDS = 30;

// Bounds and quick-pick presets for the configurable recording duration
export const RECORDING_DURATION_MIN = 1; // 1 second
export const RECORDING_DURATION_MAX = 600; // 10 minutes
export const RECORDING_DURATION_PRESETS: readonly number[] = [
  15, 30, 60, 90, 120, 180,
];

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

// ============================================================================
// Metronome Constants
// ============================================================================

export const BPM_MIN = 20;
export const BPM_MAX = 999;
export const BPM_DEFAULT = 120;

// Beats per measure; the first beat of each measure is accented.
export const METRONOME_BEATS_PER_MEASURE = 4;
export const METRONOME_SCHEDULE_AHEAD_TIME = 0.1; // seconds
export const METRONOME_SCHEDULER_INTERVAL = 25; // milliseconds

// Click tone: a short 1000Hz sine with a fast attack and exponential decay
export const METRONOME_CLICK_FREQUENCY = 1000; // Hz
export const METRONOME_CLICK_ATTACK = 0.001; // seconds
export const METRONOME_CLICK_DECAY = 0.05; // seconds

// Volume range shared by audio tools (0 = silent, 1 = full scale)
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;
export const VOLUME_DEFAULT_METRONOME = 0.5;
export const VOLUME_DEFAULT_REFERENCE = 0.3;

// Fade applied when starting/stopping the reference tone to avoid click/pop
export const REFERENCE_FADE_SECONDS = 0.05;
