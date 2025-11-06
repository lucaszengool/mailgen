/**
 * Auto Translation Module
 * Automatically translates all frontend content without pre-defined keys
 */

class AutoTranslate {
  constructor() {
    this.currentLanguage = this.detectUserLanguage();
    this.cache = new Map(); // Cache translations to avoid re-translating
    this.translationObserver = null;
    this.isTranslating = false;
  }

  /**
   * Detect user's language from browser settings
   */
  detectUserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0]; // e.g., 'en-US' -> 'en'

    // Check localStorage for saved preference
    const savedLang = localStorage.getItem('userLanguage');
    if (savedLang) {
      return savedLang;
    }

    // Default to browser language
    localStorage.setItem('userLanguage', langCode);
    return langCode;
  }

  /**
   * Change language and re-translate page
   */
  async changeLanguage(langCode) {
    this.currentLanguage = langCode;
    localStorage.setItem('userLanguage', langCode);

    if (langCode === 'en') {
      // If English, reload to restore original text
      window.location.reload();
    } else {
      // Translate entire page
      await this.translatePage();
    }
  }

  /**
   * Translate text using Google Translate API (free tier via MyMemory API)
   */
  async translateText(text, targetLang) {
    if (!text || text.trim() === '') return text;
    if (targetLang === 'en') return text; // No translation needed for English

    // Check cache first
    const cacheKey = `${text}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Using MyMemory Translation API (free, no API key required)
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        this.cache.set(cacheKey, translated);
        return translated;
      }

      return text; // Return original if translation fails
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  /**
   * Translate all text nodes in the page
   */
  async translatePage() {
    if (this.isTranslating) return;
    this.isTranslating = true;

    try {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip scripts, styles, and empty text nodes
            if (
              node.parentElement.tagName === 'SCRIPT' ||
              node.parentElement.tagName === 'STYLE' ||
              node.parentElement.tagName === 'NOSCRIPT' ||
              !node.textContent.trim()
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      // Translate in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < textNodes.length; i += batchSize) {
        const batch = textNodes.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (textNode) => {
            const originalText = textNode.textContent.trim();
            if (originalText) {
              // Store original text as data attribute
              if (!textNode.parentElement.dataset.originalText) {
                textNode.parentElement.dataset.originalText = originalText;
              }

              const translated = await this.translateText(originalText, this.currentLanguage);
              textNode.textContent = translated;
            }
          })
        );

        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Translate input placeholders
      const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
      for (const input of inputs) {
        if (input.placeholder) {
          if (!input.dataset.originalPlaceholder) {
            input.dataset.originalPlaceholder = input.placeholder;
          }
          input.placeholder = await this.translateText(input.placeholder, this.currentLanguage);
        }
      }

      // Translate button aria-labels and titles
      const elementsWithTitle = document.querySelectorAll('[title]');
      for (const element of elementsWithTitle) {
        if (element.title) {
          if (!element.dataset.originalTitle) {
            element.dataset.originalTitle = element.title;
          }
          element.title = await this.translateText(element.title, this.currentLanguage);
        }
      }

    } catch (error) {
      console.error('Page translation error:', error);
    } finally {
      this.isTranslating = false;
    }
  }

  /**
   * Watch for DOM changes and translate new content
   */
  startObserving() {
    // Disconnect existing observer
    if (this.translationObserver) {
      this.translationObserver.disconnect();
    }

    if (this.currentLanguage === 'en') {
      return; // No need to observe if English
    }

    this.translationObserver = new MutationObserver((mutations) => {
      // Debounce translations
      clearTimeout(this.observerTimeout);
      this.observerTimeout = setTimeout(() => {
        this.translatePage();
      }, 500);
    });

    this.translationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  /**
   * Stop observing DOM changes
   */
  stopObserving() {
    if (this.translationObserver) {
      this.translationObserver.disconnect();
    }
  }

  /**
   * Initialize auto-translation
   */
  async init() {
    // If not English, translate the page
    if (this.currentLanguage !== 'en') {
      await this.translatePage();
      this.startObserving();
    }
  }
}

// Export singleton instance
const autoTranslate = new AutoTranslate();
export default autoTranslate;
