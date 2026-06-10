use wasm_bindgen::prelude::*;

// Mirror of the JS constants
const THRESHOLD: f32 = 0.1;
const MIN_FREQUENCY: f32 = 60.0;
const MAX_FREQUENCY: f32 = 2000.0;

/// small values mark candidate periods
fn difference_function(buffer: &[f32]) -> Vec<f32> {
    let half = buffer.len() / 2;
    let mut difference = vec![0.0f32; half];
    for tau in 0..half {
        let mut sum = 0.0f32;
        for i in 0..half {
            let delta = buffer[i] - buffer[i + tau];
            sum += delta * delta;
        }
        difference[tau] = sum;
    }
    difference
}

/// Normalize so a fixed threshold works regardless of amplitude. cmndf[0] = 1
fn cumulative_mean_normalized_difference(difference: &[f32]) -> Vec<f32> {
    let mut cmndf = vec![0.0f32; difference.len()];
    if cmndf.is_empty() {
        return cmndf;
    }
    cmndf[0] = 1.0;
    let mut running_sum = 0.0f32;
    for tau in 1..difference.len() {
        running_sum += difference[tau];
        cmndf[tau] = (difference[tau] * tau as f32) / running_sum;
    }
    cmndf
}

/// First τ below the threshold, walked down to the local minimum. -1 = none
fn find_tau_estimate(cmndf: &[f32], threshold: f32) -> i32 {
    let mut tau = 2;
    while tau < cmndf.len() {
        if cmndf[tau] < threshold {
            while tau + 1 < cmndf.len() && cmndf[tau + 1] < cmndf[tau] {
                tau += 1;
            }
            return tau as i32;
        }
        tau += 1;
    }
    -1
}

/// Sub-sample refinement via a parabola through
fn parabolic_interpolation(cmndf: &[f32], tau_estimate: usize) -> f32 {
    let x0 = if tau_estimate < 1 {
        tau_estimate
    } else {
        tau_estimate - 1
    };
    let x2 = if tau_estimate + 1 < cmndf.len() {
        tau_estimate + 1
    } else {
        tau_estimate
    };

    if x0 == tau_estimate {
        return if cmndf[tau_estimate] <= cmndf[x2] {
            tau_estimate as f32
        } else {
            x2 as f32
        };
    }
    if x2 == tau_estimate {
        return if cmndf[tau_estimate] <= cmndf[x0] {
            tau_estimate as f32
        } else {
            x0 as f32
        };
    }

    let s0 = cmndf[x0];
    let s1 = cmndf[tau_estimate];
    let s2 = cmndf[x2];
    tau_estimate as f32 + (s2 - s0) / (2.0 * (2.0 * s1 - s2 - s0))
}

/// Full YIN pipeline. Returns the frequency in Hz, or -1.0
fn detect_pitch_impl(buffer: &[f32], sample_rate: f32) -> f32 {
    let difference = difference_function(buffer);
    let cmndf = cumulative_mean_normalized_difference(&difference);
    let tau_estimate = find_tau_estimate(&cmndf, THRESHOLD);
    if tau_estimate == -1 {
        return -1.0;
    }
    let refined_tau = parabolic_interpolation(&cmndf, tau_estimate as usize);
    let frequency = sample_rate / refined_tau;
    if frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY {
        return -1.0;
    }
    frequency
}

/// Root mean square of the buffer (signal energy for noise gating)
fn rms_impl(buffer: &[f32]) -> f32 {
    if buffer.is_empty() {
        return 0.0;
    }
    let sum: f32 = buffer.iter().map(|v| v * v).sum();
    (sum / buffer.len() as f32).sqrt()
}

#[wasm_bindgen]
pub fn detect_pitch(buffer: &[f32], sample_rate: f32) -> f32 {
    detect_pitch_impl(buffer, sample_rate)
}

#[wasm_bindgen]
pub fn calculate_rms(buffer: &[f32]) -> f32 {
    rms_impl(buffer)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f32::consts::PI;

    fn sine(freq: f32, sample_rate: f32, n: usize) -> Vec<f32> {
        (0..n)
            .map(|i| (2.0 * PI * freq * i as f32 / sample_rate).sin())
            .collect()
    }

    #[test]
    fn detects_a440() {
        let buffer = sine(440.0, 44100.0, 2048);
        let freq = detect_pitch_impl(&buffer, 44100.0);
        assert!((freq - 440.0).abs() < 1.0, "got {freq}");
    }

    #[test]
    fn detects_low_and_high_notes() {
        for target in [110.0, 220.0, 880.0] {
            let buffer = sine(target, 44100.0, 2048);
            let freq = detect_pitch_impl(&buffer, 44100.0);
            assert!((freq - target).abs() < 2.0, "target {target}, got {freq}");
        }
    }

    #[test]
    fn returns_minus_one_for_silence() {
        let buffer = vec![0.0f32; 2048];
        assert_eq!(detect_pitch_impl(&buffer, 44100.0), -1.0);
    }

    #[test]
    fn rejects_out_of_range_frequencies() {
        // 30Hz is below MIN_FREQUENCY
        let buffer = sine(30.0, 44100.0, 4096);
        assert_eq!(detect_pitch_impl(&buffer, 44100.0), -1.0);
    }

    #[test]
    fn rms_matches_known_values() {
        assert_eq!(rms_impl(&[0.5, -0.5, 0.5, -0.5]), 0.5);
        assert_eq!(rms_impl(&[0.0, 0.0]), 0.0);
        assert_eq!(rms_impl(&[]), 0.0);
    }
}
