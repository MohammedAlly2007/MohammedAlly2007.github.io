import { useState } from 'react'

let resolver = null
let setter = null

export function confirmAction(message) {
  return new Promise((resolve) => {
    resolver = resolve
    if (setter) setter({ open: true, message })
  })
}

export default function ConfirmModal() {
  const [state, setState] = useState({ open: false, message: '' })
  setter = setState
  const close = (val) => { setState({ open: false, message: '' }); if (resolver) { resolver(val); resolver = null } }
  if (!state.open) return null
  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scaleIn shadow-2xl">
        <p className="text-gray-800 mb-5">{state.message}</p>
        <div className="flex gap-2">
          <button onClick={() => close(true)} className="btn-danger flex-1">Thibitisha</button>
          <button onClick={() => close(false)} className="btn-secondary flex-1">Ghairi</button>
        </div>
      </div>
    </div>
  )
}