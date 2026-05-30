import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  const { t } = useTranslation();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-svh flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <LanguageSwitcher />
        <h1 className="text-3xl font-bold">{t("app.title")}</h1>
        <p className="text-muted-foreground">{t("app.tagline")}</p>
      </div>
    </ThemeProvider>
  );
}

export default App;
