import { Save, Square } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ControlPanelProps = {
  readonly onStop: () => void;
  readonly onSave?: () => void;
  readonly isSaving?: boolean;
};

export function ControlPanel({
  onStop,
  onSave,
  isSaving = false,
}: ControlPanelProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-2">
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
      </CardContent>
    </Card>
  );
}
