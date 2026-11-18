import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, money, memberPaid } from '../store'
import { Search, X, Users, Wallet, FileBarChart, Receipt, PieChart, Bell, Target, LayoutDashboard, ArrowRight } from 'lucide-react'

const PAGES = [
  { to: '/', label: 'Dashibodi', icon: LayoutDashboard, keys: 'dashboard dashibodi nyumbani' },
  { to: '/members', label: 'Wanabodi / Wanachama', icon: Users, keys: 'members wanachama wanabodi' },
  { to: '/contributions', label: 'Michango ya Maalum', icon: Target, keys: 'michango campaigns' },
  { to: '/payments', label: 'Malipo', icon: Wallet, keys: 'malipo payments risiti' },
  { to: '/expenses', label: 'Matumizi', icon: Receipt, keys: 'matumizi expenses' },
  { to: '/budgets', label: 'Bajeti', icon: PieChart, keys: 'bajeti budgets' },
  { to: '/reports', label: 'Ripoti', icon: FileBarChart, keys: 'ripoti reports csv pdf' },
  { to: '/notifications', label: 'Arifa / Madeni', icon: Bell, keys: 'arifa notifications madeni' },
]

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const s = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(v => !v) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => { setCursor(0) }, [q, open])

  const term = q.trim().toLowerCase()
  const members = term
    ? s.members.filter(m => (m.fullName || '').toLowerCase().includes(term) || (m.phone || '').includes(term) || (m.email || '').toLowerCase().includes(term)).slice(0, 6)
    : []
  const pages = term ? PAGES.filter(p => p.label.toLowerCase().includes(term) || p.keys.includes(term)).slice(0, 4) : []

  const openMember = (m) => {
    setOpen(false); setQ('')
    navigate('/members', { state: { focusMember: m.id } })
  }
  const openPage = (p) => { setOpen(false); setQ(''); navigate(p.to) }

  const flat = [...members.map(m => ({ type: 'member', item: m })), ...pages.map(p => ({ type: 'page', item: p }))]

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(flat.length - 1, c + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(0, c - 1)) }
    if (e.key === 'Enter' && flat[cursor]) {
      e.preventDefault()
      const row = flat[cursor]
      if (row.type === 'member') openMember(row.item); else openPage(row.item)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 modal-backdrop flex items-start justify-center z-50 p-4 pt-20" onMouseDown={() => setOpen(false)}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scaleIn overflow-hidden" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b border-gray-200">
          <Search size={18} className="text-gray-400" />
          <input autoFocus className="flex-1 outline-none text-sm bg-transparent" placeholder="Tafuta mwanachama au ukurasa... (Ctrl+K)" value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKeyDown} />
          <button onClick={() => setOpen(false)} aria-label="Funga"><X size={18} /></button>
        </div>
        <div className="max-h-80 overflow-auto">
          {members.length > 0 && <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Wanachama</div>}
          {members.map((m, i) => (
            <button key={m.id} onMouseEnter={() => setCursor(i)} onClick={() => openMember(m)}
              className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition ${cursor === i ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex items-center justify-center shrink-0">{(m.fullName || '?').slice(0, 2).toUpperCase()}</span>
                <span className="truncate">
                  <span className="block text-sm font-medium truncate">{m.fullName}</span>
                  <span className="block text-[11px] text-gray-500">{m.phone || m.position || 'Mwanachama'}</span>
                </span>
              </span>
              <span className="text-xs text-green-600 font-semibold shrink-0">{money(memberPaid(m.id, s.payments))}</span>
            </button>
          ))}
          {pages.length > 0 && <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Kurasa</div>}
          {pages.map((p, i) => {
            const idx = members.length + i
            const Icon = p.icon
            return (
              <button key={p.to} onMouseEnter={() => setCursor(idx)} onClick={() => openPage(p)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm transition ${cursor === idx ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                <Icon size={16} className="text-gray-400" /> {p.label}
                <ArrowRight size={14} className="ml-auto text-gray-300" />
              </button>
            )
          })}
          {term && flat.length === 0 && <div className="p-6 text-sm text-gray-500 text-center">Hakuna matokeo ya “{q}”.</div>}
          {!term && <div className="p-4 text-xs text-gray-400 text-center">Andika jina la mwanachama, simu, au jina la ukurasa.</div>}
        </div>
      </div>
    </div>
  )
}
