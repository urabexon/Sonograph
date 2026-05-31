import { memo, useCallback, useState } from "react";

import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AdvancedSettingsDialog } from "@/components/AdvancedSettingsDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSettings } from "@/hooks/useSettings";
import type { Accidental, Notation } from "@/types";

type SettingsDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

export const SettingsDialog = memo(function SettingsDialog({
  open,
  onClose,
}: SettingsDialogProps) {
  const { t } = useTranslation();
  const { state, update } = useSettings();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleNotationChange = useCallback(
    (value: string) => {
      update((draft) => {
        draft.notation = value as Notation;
      });
    },
    [update],
  );

  const handleAccidentalChange = useCallback(
    (value: string) => {
      update((draft) => {
        draft.accidental = value as Accidental;
      });
    },
    [update],
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>{t("settings.notation.label")}</Label>
            <RadioGroup
              value={state.notation}
              onValueChange={handleNotationChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="letter" id="notation-letter" />
                <Label htmlFor="notation-letter" className="cursor-pointer">
                  {t("settings.notation.letter")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="solfege" id="notation-solfege" />
                <Label htmlFor="notation-solfege" className="cursor-pointer">
                  {t("settings.notation.solfege")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>{t("settings.accidental.label")}</Label>
            <RadioGroup
              value={state.accidental}
              onValueChange={handleAccidentalChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sharp" id="accidental-sharp" />
                <Label htmlFor="accidental-sharp" className="cursor-pointer">
                  {t("settings.accidental.sharp")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flat" id="accidental-flat" />
                <Label htmlFor="accidental-flat" className="cursor-pointer">
                  {t("settings.accidental.flat")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setShowAdvanced(true)}
            >
              {t("settings.advanced.open")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>

      <AdvancedSettingsDialog
        open={showAdvanced}
        onClose={() => setShowAdvanced(false)}
      />
    </Dialog>
  );
});
