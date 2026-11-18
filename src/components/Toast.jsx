import { useEffect, useState } from 'react'

export function showToast(msg, type = 'info') {
  window.dispatchEvent(new CustomEvent('ssbf:toast', { detail: { msg, type, id: Date.now() + Math.random() } }))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const h = (e) => {
      const t = e.detail
      setToasts(prev => [...prev, t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500)
    }
    window.addEventListener('ssbf:toast', h)
    return () => window.removeEventListener('ssbf:toast', h)
  }, [])
  const colors = { info: 'bg-primary-600', success: 'bg-green-600', error: 'bg-red-600', warn: 'bg-amber-600' }
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`${colors[t.type] || colors.info} text-white px-4 py-3 rounded-xl shadow-lg animate-slideUp max-w-sm`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}