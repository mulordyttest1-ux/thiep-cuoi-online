"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadLang, saveLang } from "@/lib/store";
import { t, type Dict, type UiLang } from "@/lib/i18n";

const Ctx = createContext<{ lang: UiLang; setLang: (l: UiLang) => void; dict: Dict }>({
  lang: "vi",
  setLang: () => {},
  dict: t("vi"),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UiLang>("vi");
  useEffect(() => {
    try {
      setLangState(loadLang());
    } catch {
      setLangState("vi");
    }
  }, []);
  const setLang = (l: UiLang) => {
    setLangState(l);
    try {
      saveLang(l);
    } catch {
      // bỏ qua
    }
  };
  return <Ctx.Provider value={{ lang, setLang, dict: t(lang) }}>{children}</Ctx.Provider>;
}

export function useLanguage() {
  return useContext(Ctx);
}
