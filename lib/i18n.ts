// lib/i18n.ts

import i18n from "i18next";
import detector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

const getInitialLanguage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const language = localStorage.getItem("I18N_LANGUAGE");
    if (!language) {
      localStorage.setItem("I18N_LANGUAGE", "en");
      return "en";
    }
    return language;
  }
  return "en"; 
};

i18n
  .use(detector)
  .use(Backend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
    debug: false,
  });

export default i18n;