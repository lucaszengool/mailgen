import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  // Load translation files from public/locales
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language if detected language not available
    fallbackLng: 'en',

    // Supported languages
    supportedLngs: ['en', 'es', 'fr', 'de', 'zh-CN', 'ja', 'ko', 'pt', 'ru', 'ar', 'hi', 'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id'],

    // Debug mode (set to false in production)
    debug: false,

    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],

      // Keys to lookup language from
      lookupLocalStorage: 'i18nextLng',

      // Cache user language
      caches: ['localStorage'],

      // Optional expire and domain for language cookie
      cookieMinutes: 10080, // 7 days
    },

    // Backend options
    backend: {
      // Path to translation files
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // React options
    react: {
      // Wait for translations to load before rendering
      useSuspense: true,
    },

    // Namespace
    ns: ['translation'],
    defaultNS: 'translation',

    // Interpolation options
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
  });

export default i18n;
