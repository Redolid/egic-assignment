import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// IBM Plex Sans + its Arabic companion: one designed family for the Latin UI and the Arabic
// names shown in the ID reader and traders map. Self-hosted, only the subsets in use.
import '@fontsource-variable/ibm-plex-sans/wght.css'
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
