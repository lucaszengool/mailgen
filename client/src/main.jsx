import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter as Router } from 'react-router-dom'
import { TranslationProvider } from 'react-auto-google-translate'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import App from './App.jsx'
import './index.css'

// Import Clerk publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <TranslationProvider originalLang="en">
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <Router>
            <App />
          </Router>
        </ClerkProvider>
      </TranslationProvider>
    </I18nextProvider>
  </React.StrictMode>,
)