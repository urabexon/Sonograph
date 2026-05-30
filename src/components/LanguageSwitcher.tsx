import { useTranslation } from "react-i18next";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

const LABELS: Record<SupportedLanguage, string> = {
  ja: "JA",
  en: "EN",
  fr: "FR",
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (
    SUPPORTED_LANGUAGES as readonly string[]
  ).includes(i18n.resolvedLanguage ?? "")
    ? (i18n.resolvedLanguage as SupportedLanguage)
    : "ja";

  return (
    <Tabs
      value={current}
      onValueChange={(value) => void i18n.changeLanguage(value)}
    >
      <TabsList>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <TabsTrigger key={lang} value={lang}>
            {LABELS[lang]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
