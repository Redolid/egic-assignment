import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Archivo: an industrial grotesk whose width axis gives condensed sheet titles and normal body text
// from one file. Arabic data is set in IBM Plex Sans Arabic. Self-hosted, only the subsets in use.
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
