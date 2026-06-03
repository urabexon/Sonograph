import { useCallback, useEffect, useRef, useState } from "react";
import { del, get, set } from "idb-keyval";

import {
  RECORDING_LIST_KEY,
  downloadFileName,
  partitionByExpiry,
  recordingKey,
  sortByNewest,
  toRecordingMeta,
} from "@/lib/recordingUtils";
import type { AudioFormat, Recording, RecordingMeta } from "@/types";
import { convertAudioBlob } from "@/utils/audioConverter";

// Read/manage side of the recording store: lists saved recordings, deletes, and plays them back

type RecordingStorageResult = {
  readonly recordings: readonly RecordingMeta[];
  readonly isLoading: boolean;
  readonly isConverting: boolean;
  readonly refresh: () => Promise<void>;
  // Return whether the action succeeded so the UI can show accurate feedback.
  readonly deleteRecording: (id: string) => Promise<boolean>;
  readonly downloadRecording: (
    id: string,
    format?: AudioFormat,
  ) => Promise<boolean>;
  readonly playRecording: (id: string) => Promise<void>;
  readonly stopPlayback: () => void;
  readonly seek: (time: number) => void;
  readonly playingId: string | null;
  readonly playbackTime: number;
  readonly playbackDuration: number;
};

export function useRecordingStorage(): RecordingStorageResult {
  const [recordings, setRecordings] = useState<readonly RecordingMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  const cleanupPlayback = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPlayingId(null);
    setPlaybackTime(0);
    setPlaybackDuration(0);
  }, []);

  useEffect(() => cleanupPlayback, [cleanupPlayback]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const ids = (await get<string[]>(RECORDING_LIST_KEY)) ?? [];

      // Look up each recording's expiry, then let the pure helper decide which
      // survive. A missing record (expiresAt 0) is treated as expired.
      const records = await Promise.all(
        ids.map((id) => get<Recording>(recordingKey(id))),
      );
      const entries = ids.map((id, i) => ({
        id,
        expiresAt: records[i]?.expiresAt ?? 0,
        recording: records[i],
      }));
      const { valid, expired } = partitionByExpiry(entries, Date.now());

      if (expired.length > 0) {
        await Promise.all(expired.map((e) => del(recordingKey(e.id))));
        await set(
          RECORDING_LIST_KEY,
          valid.map((v) => v.id),
        );
      }

      const metas = valid
        .map((v) => v.recording)
        .filter((r): r is Recording => r !== undefined)
        .map(toRecordingMeta);
      setRecordings(sortByNewest(metas));
    } catch {
      // Storage unavailable: leave the current list as-is.
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRecording = useCallback(
    async (id: string): Promise<boolean> => {
      if (playingId === id) cleanupPlayback();
      try {
        await del(recordingKey(id));
        const ids = (await get<string[]>(RECORDING_LIST_KEY)) ?? [];
        await set(
          RECORDING_LIST_KEY,
          ids.filter((item) => item !== id),
        );
        setRecordings((current) => current.filter((r) => r.id !== id));
        return true;
      } catch {
        return false;
      }
    },
    [playingId, cleanupPlayback],
  );

  const downloadRecording = useCallback(
    async (id: string, format: AudioFormat = "wav"): Promise<boolean> => {
      let recording: Recording | undefined;
      try {
        recording = await get<Recording>(recordingKey(id));
      } catch {
        return false;
      }
      if (!recording) return false;

      setIsConverting(true);
      try {
        const { blob, extension } = await convertAudioBlob(
          recording.audioBlob,
          format,
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadFileName(recording.createdAt, extension);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
      } catch {
        // Decode/encode failed: nothing downloaded.
        return false;
      } finally {
        setIsConverting(false);
      }
    },
    [],
  );

  const playRecording = useCallback(
    async (id: string): Promise<void> => {
      cleanupPlayback();

      let recording: Recording | undefined;
      try {
        recording = await get<Recording>(recordingKey(id));
      } catch {
        return;
      }
      if (!recording) return;

      const url = URL.createObjectURL(recording.audioBlob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      const storedDuration = recording.duration;
      audio.onloadedmetadata = () => {
        setPlaybackDuration(
          Number.isFinite(audio.duration) ? audio.duration : storedDuration,
        );
      };
      audio.onended = cleanupPlayback;

      setPlayingId(id);
      try {
        await audio.play();
      } catch {
        cleanupPlayback();
        return;
      }

      const tick = () => {
        if (!audioRef.current) return;
        setPlaybackTime(audioRef.current.currentTime);
        if (!audioRef.current.paused && !audioRef.current.ended) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [cleanupPlayback],
  );

  const stopPlayback = useCallback(() => {
    cleanupPlayback();
  }, [cleanupPlayback]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(time, audioRef.current.duration));
    audioRef.current.currentTime = clamped;
    setPlaybackTime(clamped);
  }, []);

  return {
    recordings,
    isLoading,
    isConverting,
    refresh,
    deleteRecording,
    downloadRecording,
    playRecording,
    stopPlayback,
    seek,
    playingId,
    playbackTime,
    playbackDuration,
  };
}
