import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import { startAutoSync } from './firebase/sync'
import { initInstallCapture } from './lib/install'

// Перехват beforeinstallprompt — до рендера, событие может прилететь рано
initInstallCapture()
registerSW({ immediate: true })
startAutoSync()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
