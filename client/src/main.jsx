import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter as Router } from 'react-router-dom'
import { TranslationProvider } from 'react-auto-google-translate'
import App from './App.jsx'
import './index.css'

// Import Clerk publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

// Detect user's browser language
const getUserLanguage = () => {
  const savedLang = localStorage.getItem('userLanguage');
  if (savedLang) return savedLang;

  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0]; // e.g., 'en-US' -> 'en'

  localStorage.setItem('userLanguage', langCode);
  return langCode;
};

const userLanguage = getUserLanguage();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TranslationProvider originalLang="en" targetLang={userLanguage}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <Router>
          <App />
        </Router>
      </ClerkProvider>
    </TranslationProvider>
  </React.StrictMode>,
)