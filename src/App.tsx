import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ControlPanel } from "@/components/ControlPanel";
import { Header } from "@/components/Header";
import { PitchInfo } from "@/components/PitchInfo";
import { RecordingList } from "@/components/RecordingList";
import { SettingsDialog } from "@/components/SettingsDialog";
import { StartOverlay } from "@/components/StartOverlay";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TunerDisplay } from "@/components/TunerDisplay";
import { VolumeLevel } from "@/components/VolumeLevel";
import { RECORDING_DURATION_SECONDS } from "@/constants/audio";
import {
  useAudioControls,
  useAudioStream,
  useIsActive,
  useNoiseGateEffect,
  usePitchData,
  useVolumeLevelData,
} from "@/hooks/useAudioCapture";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";
import { useRecordingBuffer } from "@/hooks/useRecordingBuffer";
import { useRecordingStorage } from "@/hooks/useRecordingStorage";
import { SettingsProvider, useSettings } from "@/hooks/useSettings";
import type { AudioFormat } from "@/types";

function SettingsAudioBridge() {
  const { state } = useSettings();
  useNoiseGateEffect(state.advanced.noiseGateThreshold);
  return null;
}

function AutoStartBridge() {
  const { state } = useSettings();
  const { startAudio } = useAudioControls();
  const autoStartRef = useRef(state.autoStart);
  const didRun = useRef(false);
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    if (autoStartRef.current) void startAudio();
  }, [startAudio]);
  return null;
}

function WithDefaultFormat({
  children,
}: {
  readonly children: (format: AudioFormat) => ReactNode;
}) {
  const { state } = useSettings();
  return <>{children(state.audioFormat)}</>;
}

const PitchInfoContainer = memo(function PitchInfoContainer() {
  const { currentPitch } = usePitchData();
  const { state } = useSettings();
  return (
    <PitchInfo
      pitch={currentPitch}
      notation={state.notation}
      accidental={state.accidental}
      tuningOptions={state.advanced}
      centThreshold={state.advanced.centThreshold}
    />
  );
});

const VolumeLevelContainer = memo(function VolumeLevelContainer() {
  const volumeLevel = useVolumeLevelData();
  return <VolumeLevel volume={volumeLevel} />;
});

const TunerDisplayContainer = memo(function TunerDisplayContainer() {
  const { pitchHistory, timestamp } = usePitchData();
  const { state } = useSettings();
  return (
    <TunerDisplay
      pitchHistory={pitchHistory}
      now={timestamp}
      notation={state.notation}
      accidental={state.accidental}
    />
  );
});

function App() {
  const { t } = useTranslation();
  const isActive = useIsActive();
  const { startAudio, stopAudio } = useAudioControls();

  const { devices, isLoading, error, refreshDevices } = useMicrophoneDevices();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recordingsOpen, setRecordingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userPickedDeviceId, setUserPickedDeviceId] = useState("");

  // Continuously buffer the active mic stream so it can be saved
  const stream = useAudioStream();
  const { saveRecording } = useRecordingBuffer(
    stream,
    RECORDING_DURATION_SECONDS,
  );
  const {
    recordings,
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
  } = useRecordingStorage();
  // Auto-pick the first available device until the user explicitly chooses one.
  const selectedDeviceId = userPickedDeviceId || devices[0]?.deviceId || "";

  const handleStart = useCallback(() => {
    void startAudio(selectedDeviceId || undefined);
  }, [startAudio, selectedDeviceId]);

  const handleStop = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const handleDeviceChange = useCallback(
    (deviceId: string) => {
      setUserPickedDeviceId(deviceId);
      if (isActive) {
        void startAudio(deviceId);
      }
    },
    [isActive, startAudio],
  );

  const handleRefreshDevices = useCallback(() => {
    void refreshDevices();
  }, [refreshDevices]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const id = await saveRecording();
      if (id) {
        await refresh();
        toast.success(t("toast.saveSuccess"));
      } else {
        toast.error(t("toast.saveEmpty"));
      }
    } catch {
      toast.error(t("toast.saveError"));
    } finally {
      setIsSaving(false);
    }
  }, [saveRecording, refresh, t]);

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await deleteRecording(id);
      toast[ok ? "success" : "error"](
        t(ok ? "toast.deleteSuccess" : "toast.deleteError"),
      );
    },
    [deleteRecording, t],
  );

  const handleDownload = useCallback(
    async (id: string, format: Parameters<typeof downloadRecording>[1]) => {
      const ok = await downloadRecording(id, format);
      toast[ok ? "success" : "error"](
        t(ok ? "toast.downloadStarted" : "toast.downloadError"),
      );
    },
    [downloadRecording, t],
  );

  // Refresh the list right as the dialog opens
  const handleOpenRecordings = useCallback(() => {
    void refresh();
    setRecordingsOpen(true);
  }, [refresh]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <SettingsAudioBridge />
        <AutoStartBridge />
        <div className="min-h-svh flex flex-col bg-background text-foreground">
          <Header
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenRecordings={handleOpenRecordings}
          />
          <SettingsDialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
          <WithDefaultFormat>
            {(defaultFormat) => (
              <RecordingList
                open={recordingsOpen}
                onClose={() => setRecordingsOpen(false)}
                recordings={recordings}
                onDelete={(id) => void handleDelete(id)}
                onDownload={(id, format) => void handleDownload(id, format)}
                onPlay={(id) => void playRecording(id)}
                onStop={stopPlayback}
                onSeek={seek}
                playingId={playingId}
                playbackTime={playbackTime}
                playbackDuration={playbackDuration}
                isConverting={isConverting}
                defaultFormat={defaultFormat}
              />
            )}
          </WithDefaultFormat>
          <main className="flex-1 flex flex-col p-4 gap-4 max-w-4xl mx-auto w-full">
            {isActive && (
              <>
                <PitchInfoContainer />
                <VolumeLevelContainer />
              </>
            )}
            <div className="relative flex-1 min-h-32">
              <TunerDisplayContainer />
              {!isActive && (
                <StartOverlay
                  onStart={handleStart}
                  devices={devices}
                  selectedDeviceId={selectedDeviceId}
                  onDeviceChange={handleDeviceChange}
                  onRefreshDevices={handleRefreshDevices}
                  isLoading={isLoading}
                  error={error}
                />
              )}
            </div>
            {isActive && (
              <ControlPanel
                onStop={handleStop}
                onSave={() => void handleSave()}
                isSaving={isSaving}
              />
            )}
          </main>
        </div>
        <Toaster position="bottom-center" />
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
