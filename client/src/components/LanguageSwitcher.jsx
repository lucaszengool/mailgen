import React, { useContext, useState } from 'react';
import { TranslationContext } from 'react-auto-google-translate';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ position = 'bottom-right' }) => {
  const { changeLanguage } = useContext(TranslationContext);
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

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
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const dropdownPosition = position.includes('bottom') ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
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
          <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-sm flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Select Language
            </h3>
          </div>
          <div className="py-1">
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
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg border border-gray-200 p-3 transition-all hover:shadow-xl flex items-center space-x-2"
        style={{ minWidth: '50px', minHeight: '50px' }}
        title="Change Language"
      >
        <Globe className="w-6 h-6" style={{ color: '#00f0a0' }} />
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
