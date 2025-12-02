import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ position = 'top-right' }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);

  // Update current language when i18n language changes
  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  // Function to change language using i18next
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' }
  ];

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setCurrentLang(langCode);
    setIsOpen(false);
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-20 right-6', // Positioned below header to avoid overlap
    'top-left': 'top-20 left-6'
  };

  const dropdownPosition = position.includes('bottom') ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div className={`fixed ${positionClasses[position]} z-[9999]`}>
      {/* Language Dropdown */}
      {isOpen && (
        <div
          className={`absolute ${dropdownPosition} right-0 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden`}
          style={{
            width: '280px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          <div className="p-3 bg-gradient-to-r from-[#00f5a0]/10 to-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              {t('common.selectLanguage')}
            </h3>
          </div>
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                  currentLang === lang.code ? 'bg-[#00f5a0]/10' : ''
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className={`text-sm ${
                  currentLang === lang.code ? 'font-semibold text-[#00f5a0]' : 'text-gray-700'
                }`}>
                  {lang.name}
                </span>
                {currentLang === lang.code && (
                  <span className="ml-auto text-[#00f5a0] text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg border border-gray-200 p-3 transition-all hover:shadow-xl flex items-center space-x-2"
        style={{ minWidth: '50px', minHeight: '50px' }}
        title="Change Language"
      >
        <Globe className="w-6 h-6" style={{ color: '#00f5a0' }} />
        {currentLang !== 'en' && (
          <span className="text-xs font-medium pr-1">
            {languages.find(l => l.code === currentLang)?.flag}
          </span>
        )}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
