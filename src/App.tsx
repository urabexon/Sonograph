import { useCallback, useEffect, useState } from "react";

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

function App() {
  const isActive = useIsActive();
  const { startAudio, stopAudio } = useAudioControls();
  const { currentPitch, pitchHistory } = usePitchData();
  const volumeLevel = useVolumeLevelData();

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

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-svh flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col p-4 gap-4 max-w-4xl mx-auto w-full">
          {isActive && (
            <>
              <PitchInfo pitch={currentPitch} />
              <VolumeLevel volume={volumeLevel} />
            </>
          )}

          <div className="relative flex-1 min-h-32">
            <TunerDisplay pitchHistory={pitchHistory} now={Date.now()} />
            {!isActive && (
              <StartOverlay
                onStart={handleStart}
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onDeviceChange={handleDeviceChange}
                onRefreshDevices={() => void refreshDevices()}
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
