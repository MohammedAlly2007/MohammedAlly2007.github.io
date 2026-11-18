import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

// PWA: register the service worker with an explicit no-cache update check.
// When a fresh worker takes control (e.g. after a new deployment), reload once
// so the page is not left showing a stale bundle.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const hadController = !!navigator.serviceWorker.controller
      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      reg.update().catch(() => {})
      let reloading = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading || !hadController) return
        reloading = true
        window.location.reload()
      })
    } catch {
      /* offline / unsupported */
    }
  })
}
