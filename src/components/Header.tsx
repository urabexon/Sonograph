import { Info, ListMusic, Menu, Settings } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function GitHubIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

type HeaderProps = {
  readonly onOpenRecordings?: () => void;
  readonly onOpenSettings?: () => void;
  readonly onOpenAbout?: () => void;
};

export function Header({
  onOpenRecordings,
  onOpenSettings,
  onOpenAbout,
}: HeaderProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="p-4 border-b">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{t("app.title")}</h1>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onOpenRecordings}>
            <ListMusic />
            {t("header.recordings")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onOpenSettings}>
            <Settings />
            {t("header.settings")}
          </Button>
          <Button variant="ghost" size="icon" onClick={onOpenAbout} aria-label={t("header.about")}>
            <Info />
          </Button>
          <LanguageSwitcher />
          <ModeToggle />
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/urabexon/Sonograph"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <GitHubIcon className="h-[1.2rem] w-[1.2rem]" />
            </a>
          </Button>
        </div>

        {/* Mobile menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label={t("header.menu")}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle>{t("header.menu")}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-4 px-2">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onOpenRecordings?.();
                  setIsMenuOpen(false);
                }}
              >
                <ListMusic className="mr-2 h-4 w-4" />
                {t("header.recordings")}
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onOpenSettings?.();
                  setIsMenuOpen(false);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                {t("header.settings")}
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  onOpenAbout?.();
                  setIsMenuOpen(false);
                }}
              >
                <Info className="mr-2 h-4 w-4" />
                {t("header.about")}
              </Button>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm">{t("common.language")}</span>
                <LanguageSwitcher />
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm">{t("header.theme")}</span>
                <ModeToggle />
              </div>
              <Button variant="ghost" className="justify-start" asChild>
                <a
                  href="https://github.com/urabexon/Sonograph"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitHubIcon className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
