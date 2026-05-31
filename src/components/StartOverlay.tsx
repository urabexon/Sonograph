import { Loader2, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type StartOverlayProps = {
  readonly onStart: () => void;
  readonly isLoading?: boolean;
  readonly error?: string | null;
};

export function StartOverlay({
  onStart,
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

        <Button
          onClick={onStart}
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              {t("start.loading")}
            </>
          ) : (
            <>
              <Play />
              {t("start.button")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
