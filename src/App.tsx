import { memo, useCallback, useEffect, useState } from "react";

import { ControlPanel } from "@/components/ControlPanel";
import { Header } from "@/components/Header";
import { PitchInfo } from "@/components/PitchInfo";
import { StartOverlay } from "@/components/StartOverlay";
import { ThemeProvider } from "@/components/theme-provider";
import { TunerDisplay } from "@/components/TunerDisplay";
import { VolumeLevel } from "@/components/VolumeLevel";
import {
  useAudioControls,
  useIsActive,
  usePitchData,
  useVolumeLevelData,
} from "@/hooks/useAudioCapture";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";

// Containers that subscribe to high-frequency data are isolated and memoized
// so that the rest of the tree (Header, ControlPanel, StartOverlay) does not
// re-render at 60fps.

const PitchInfoContainer = memo(function PitchInfoContainer() {
  const { currentPitch } = usePitchData();
  return <PitchInfo pitch={currentPitch} />;
});

const VolumeLevelContainer = memo(function VolumeLevelContainer() {
  const volumeLevel = useVolumeLevelData();
  return <VolumeLevel volume={volumeLevel} />;
});

const TunerDisplayContainer = memo(function TunerDisplayContainer() {
  const { pitchHistory } = usePitchData();
  return <TunerDisplay pitchHistory={pitchHistory} now={Date.now()} />;
});

function App() {
  const isActive = useIsActive();
  const { startAudio, stopAudio } = useAudioControls();

  const { devices, isLoading, error, refreshDevices } = useMicrophoneDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  useEffect(() => {
    if (devices.length > 0 && selectedDeviceId === "") {
      setSelectedDeviceId(devices[0].deviceId);
    }
  }, [devices, selectedDeviceId]);

  const handleStart = useCallback(() => {
    void startAudio(selectedDeviceId || undefined);
  }, [startAudio, selectedDeviceId]);

  const handleStop = useCallback(() => {
    stopAudio();
  }, [stopAudio]);

  const handleDeviceChange = useCallback(
    (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      if (isActive) {
        void startAudio(deviceId);
      }
    },
    [isActive, startAudio],
  );

  const handleRefreshDevices = useCallback(() => {
    void refreshDevices();
  }, [refreshDevices]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-svh flex flex-col bg-background text-foreground">
        <Header />
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

          {isActive && <ControlPanel onStop={handleStop} />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
