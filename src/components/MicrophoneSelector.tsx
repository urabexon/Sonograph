import { Loader2, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AudioDevice } from "@/hooks/useMicrophoneDevices";

type MicrophoneSelectorProps = {
  readonly devices: readonly AudioDevice[];
  readonly selectedDeviceId: string;
  readonly onDeviceChange: (deviceId: string) => void;
  readonly isLoading?: boolean;
};

export function MicrophoneSelector({
  devices,
  selectedDeviceId,
  onDeviceChange,
  isLoading = false,
}: MicrophoneSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full flex items-center gap-2">
      <Mic className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select
        value={selectedDeviceId}
        onValueChange={onDeviceChange}
        disabled={isLoading || devices.length === 0}
      >
        <SelectTrigger className="w-full">
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("mic.detecting")}
            </span>
          ) : (
            <SelectValue placeholder={t("mic.placeholder")} />
          )}
        </SelectTrigger>
        <SelectContent>
          {devices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
