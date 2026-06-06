import { memo } from "react";

import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FEATURE_KEYS = ["display", "adjust", "record", "practice"] as const;

const HOW_TO_KEYS = ["allow", "play", "adjust"] as const;

type AboutDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
};

export const AboutDialog = memo(function AboutDialog({
  open,
  onClose,
}: AboutDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("about.title")}</DialogTitle>
          <DialogDescription>{t("about.tagline")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p>{t("about.overview")}</p>
          <section className="space-y-1">
            <h3 className="font-medium">{t("about.featuresTitle")}</h3>
            <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
              {FEATURE_KEYS.map((key) => (
                <li key={key}>{t(`about.features.${key}`)}</li>
              ))}
            </ul>
          </section>
          <section className="space-y-1">
            <h3 className="font-medium">{t("about.howToTitle")}</h3>
            <ol className="list-decimal pl-5 space-y-0.5 text-muted-foreground">
              {HOW_TO_KEYS.map((key) => (
                <li key={key}>{t(`about.howTo.${key}`)}</li>
              ))}
            </ol>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
});
