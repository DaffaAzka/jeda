import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

import { locales } from "@/components/editor/locales";

export type Language = "en" | "id" | "ar" | "he";

export type Direction = "ltr" | "rtl";

export type LocalizedText = Partial<Record<Language, string>>;

export const languageOptions = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic (العربية)" },
  { value: "he", label: "Hebrew (עברית)" },
] as const;

const LANGUAGE_DIRECTION: Record<Language, Direction> = {
  id: "ltr",
  en: "ltr",
  ar: "rtl",
  he: "rtl",
};

type LanguageContextType = {
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
};

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({
  children,
  defaultLanguage = "id",
}: {
  children: ReactNode;
  defaultLanguage?: Language;
}) {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "id" as Language,
      setLanguage: () => {},
      dir: "ltr" as Direction,
    };
  }
  const { language, setLanguage } = context;
  const dir = LANGUAGE_DIRECTION[language];
  return { language, setLanguage, dir };
}

export function useTranslation() {
  const { language, setLanguage, dir } = useLanguage();
  const t = (locales as any)[language] ?? locales.en;
  return { t, language, setLanguage, dir };
}
