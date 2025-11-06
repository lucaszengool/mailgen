import React, { useContext, useState } from 'react';
import { TranslationContext } from 'react-auto-google-translate';
import { Globe } from 'lucide-react';

const AutoLanguageSelector = () => {
  const { changeLanguage } = useContext(TranslationContext);
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(
    localStorage.getItem('userLanguage') || 'en'
  );

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  ];

  const handleLanguageChange = async (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('userLanguage', langCode);
    setIsOpen(false);

    // Change language using react-auto-google-translate
    if (changeLanguage) {
      await changeLanguage(langCode);
    }
  };

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div className="relative">
      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Change Language"
      >
        <Globe className="w-5 h-5 text-gray-700" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Globe className="w-4 h-4" />
                Select Language
              </div>
            </div>

            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                  currentLang === lang.code ? 'bg-green-50' : ''
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className={`text-sm ${
                  currentLang === lang.code ? 'font-semibold text-green-600' : 'text-gray-700'
                }`}>
                  {lang.name}
                </span>
                {currentLang === lang.code && (
                  <span className="ml-auto text-green-600 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AutoLanguageSelector;
