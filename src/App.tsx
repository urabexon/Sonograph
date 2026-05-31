import { useTranslation } from "react-i18next";

import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  const { t } = useTranslation();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-svh flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
          <h1 className="text-3xl font-bold">{t("app.title")}</h1>
          <p className="text-muted-foreground">{t("app.tagline")}</p>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
