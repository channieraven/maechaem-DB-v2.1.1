import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { OfflineProvider } from './contexts/OfflineContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <OfflineProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </OfflineProvider>
    </AuthProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}
