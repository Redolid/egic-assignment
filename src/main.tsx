import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Alexandria (by Egyptian designer Mohamed Gaber): one soft geometric family for the English UI and the
// Arabic names, with tabular figures for the tables. Self-hosted; only the subsets on screen download.
import '@fontsource-variable/alexandria/wght.css'
import './index.css'
import App from './App.tsx'
import { applyInitialTheme } from './lib/theme'

applyInitialTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
