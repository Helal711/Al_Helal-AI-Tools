import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { bn } from '../locales/bn';

export type SupportedLocale = 'en' | 'bn';

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  t: (path: string, fallback?: string) => string;
}

const translations: Record<SupportedLocale, any> = { en, bn };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      return (localStorage.getItem('pixelforge_locale') as SupportedLocale) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLocale = (newLoc: SupportedLocale) => {
    setLocaleState(newLoc);
    try {
      localStorage.setItem('pixelforge_locale', newLoc);
    } catch {
      // ignore
    }
  };

  const t = (path: string, fallback = ''): string => {
    const keys = path.split('.');
    let current = translations[locale];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let enCurrent = translations.en;
        for (const enKey of keys) {
          if (enCurrent && typeof enCurrent === 'object' && enKey in enCurrent) {
            enCurrent = enCurrent[enKey];
          } else {
            return fallback || path;
          }
        }
        return typeof enCurrent === 'string' ? enCurrent : fallback || path;
      }
    }
    return typeof current === 'string' ? current : fallback || path;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
