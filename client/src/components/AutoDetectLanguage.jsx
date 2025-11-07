import { useEffect } from 'react';

const AutoDetectLanguage = () => {
  useEffect(() => {
    // Auto-detect and set language on first load
    const detectAndSetLanguage = () => {
      const savedLang = localStorage.getItem('googtrans');

      // If no saved language, detect from browser
      if (!savedLang || savedLang === '/en/en') {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0]; // e.g., 'en-US' -> 'en'

        // Don't translate if already English
        if (langCode !== 'en') {
          // Set the Google Translate cookie
          const cookieValue = `/en/${langCode}`;
          localStorage.setItem('googtrans', cookieValue);
          document.cookie = `googtrans=${cookieValue}; path=/`;

          // Reload to apply translation
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      }
    };

    // Run detection after a short delay to ensure page is loaded
    const timer = setTimeout(detectAndSetLanguage, 500);
    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
};

export default AutoDetectLanguage;
