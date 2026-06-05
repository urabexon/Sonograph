import { Save, Square } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ControlPanelProps = {
  readonly onStop: () => void;
  readonly onSave?: () => void;
  readonly isSaving?: boolean;
  readonly recordingDuration?: number;
  readonly durationPresets?: readonly number[];
  readonly onDurationChange?: (seconds: number) => void;
};

export function ControlPanel({
  onStop,
  onSave,
  isSaving = false,
  recordingDuration,
  durationPresets,
  onDurationChange,
}: ControlPanelProps) {
  const { t } = useTranslation();

  const formatPreset = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return t("control.duration.seconds", { value: secs });
    if (secs === 0) return t("control.duration.minutes", { value: mins });
    return t("control.duration.minutesSeconds", { mins, secs });
  };

  const showPresets =
    durationPresets !== undefined && onDurationChange !== undefined;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3">
        {showPresets && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {t("control.durationLabel")}
            </span>
            <div className="flex flex-wrap justify-center gap-1">
              {durationPresets.map((preset) => (
                <Button
                  key={preset}
                  variant={
                    preset === recordingDuration ? "secondary" : "outline"
                  }
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onDurationChange(preset)}
                >
                  {formatPreset(preset)}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={onSave}
            variant="default"
            size="lg"
            disabled={!onSave || isSaving}
          >
            <Save />
            {t("control.save")}
          </Button>
          <Button onClick={onStop} variant="outline" size="lg">
            <Square />
            {t("control.stop")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
