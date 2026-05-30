import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function App() {
  const { t } = useTranslation();

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-4">
      <LanguageSwitcher />
      <h1 className="text-3xl font-bold">{t("app.title")}</h1>
      <p className="text-muted-foreground">{t("app.tagline")}</p>
    </div>
  );
}

export default App;
