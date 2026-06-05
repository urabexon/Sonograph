import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/hooks/useSettings";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
);
