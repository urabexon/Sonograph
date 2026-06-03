import type { Recording, RecordingMeta } from "@/types";

// Recordings are kept for 7 days, then auto-pruned on the next load
export const RECORDING_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// IndexedDB keys. Centralized so the write path and the read path can never drift apart
export const RECORDING_LIST_KEY = "recording-list";

export function recordingKey(id: string): string {
  return `recording-${id}`;
}

// Absolute expiry timestamp for a recording created at `createdAt`
export function expiresAtFrom(createdAt: number): number {
  return createdAt + RECORDING_TTL_MS;
}

export function isExpired(expiresAt: number, now: number): boolean {
  return expiresAt <= now;
}

// Splits entries into still-valid and expired, preserving input order
export function partitionByExpiry<T extends { readonly expiresAt: number }>(
  entries: readonly T[],
  now: number,
): { readonly valid: readonly T[]; readonly expired: readonly T[] } {
  const valid: T[] = [];
  const expired: T[] = [];
  for (const entry of entries) {
    if (isExpired(entry.expiresAt, now)) {
      expired.push(entry);
    } else {
      valid.push(entry);
    }
  }
  return { valid, expired };
}

// Strips the heavy audio Blob, leaving only what the list UI needs.
export function toRecordingMeta(recording: Recording): RecordingMeta {
  return {
    id: recording.id,
    createdAt: recording.createdAt,
    expiresAt: recording.expiresAt,
    duration: recording.duration,
  };
}

// Newest first, without mutating the input.
export function sortByNewest(
  metas: readonly RecordingMeta[],
): readonly RecordingMeta[] {
  return [...metas].sort((a, b) => b.createdAt - a.createdAt);
}

// Builds a filesystem-safe download name from the creation time, e.g
export function downloadFileName(createdAt: number, extension: string): string {
  const stamp = new Date(createdAt)
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-");
  return `recording-${stamp}.${extension}`;
}

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// "m:ss". Guards Infinity/NaN/negative
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString()}:${secs.toString().padStart(2, "0")}`;
}

// Structured remaining-time so the UI can localize the wording itself
export type TimeRemaining =
  | { readonly kind: "expired" }
  | { readonly kind: "days"; readonly value: number }
  | { readonly kind: "hours"; readonly value: number }
  | { readonly kind: "soon" };

export function timeRemaining(expiresAt: number, now: number): TimeRemaining {
  const ms = expiresAt - now;
  if (ms < 0) return { kind: "expired" };
  const days = Math.floor(ms / MS_PER_DAY);
  if (days > 0) return { kind: "days", value: days };
  const hours = Math.floor((ms % MS_PER_DAY) / MS_PER_HOUR);
  if (hours > 0) return { kind: "hours", value: hours };
  return { kind: "soon" };
}
