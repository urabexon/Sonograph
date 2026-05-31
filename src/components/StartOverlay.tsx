import { Loader2, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MicrophoneSelector } from "@/components/MicrophoneSelector";
import { Button } from "@/components/ui/button";
import type { AudioDevice } from "@/hooks/useMicrophoneDevices";

type StartOverlayProps = {
  readonly onStart: () => void;
  readonly devices: readonly AudioDevice[];
  readonly selectedDeviceId: string;
  readonly onDeviceChange: (deviceId: string) => void;
  readonly onRefreshDevices: () => void;
  readonly isLoading?: boolean;
  readonly error?: string | null;
};

export function StartOverlay({
  onStart,
  devices,
  selectedDeviceId,
  onDeviceChange,
  onRefreshDevices,
  isLoading = false,
  error = null,
}: StartOverlayProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg border">
      <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t("app.title")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("start.instruction")}
          </p>
        </div>

        {error && (
          <div className="w-full p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {devices.length > 0 ? (
          <MicrophoneSelector
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={onDeviceChange}
            isLoading={isLoading}
          />
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{t("mic.detecting")}</span>
          </div>
        ) : (
          <Button onClick={onRefreshDevices} variant="secondary">
            {t("mic.detectButton")}
          </Button>
        )}

        <Button
          onClick={onStart}
          size="lg"
          className="w-full"
          disabled={devices.length === 0}
        >
          <Play />
          {t("start.button")}
        </Button>
      </div>
    </div>
  );
}
