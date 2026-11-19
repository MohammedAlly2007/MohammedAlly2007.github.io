import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Target, Wallet, Receipt, FileBarChart, PieChart, Bell, Settings as SettingsIcon, History, LogOut, Menu, Moon, Sun, Search, X, MessageSquare } from 'lucide-react'
import { logout, roleLabel, useStore, unreadChatCount } from '../store'
import { useState, useEffect } from 'react'

const baseNav = [
  { to: '/', label: 'Dashibodi', icon: LayoutDashboard },
  { to: '/members', label: 'Wanabodi', icon: Users },
  { to: '/contributions', label: 'Michango', icon: Target },
  { to: '/payments', label: 'Malipo', icon: Wallet },
  { to: '/expenses', label: 'Matumizi', icon: Receipt },
  { to: '/budgets', label: 'Bajeti', icon: PieChart },
  { to: '/reports', label: 'Ripoti', icon: FileBarChart },
  { to: '/chat', label: 'Live Chat', icon: MessageSquare },
  { to: '/notifications', label: 'Arifa', icon: Bell },
]

export default function Layout({ session, children }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const state = useStore()
  const unread = unreadChatCount(state)
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setOpen(false) }, [loc.pathname])

  const nav = session?.role === 'cfo'
    ? [...baseNav, { to: '/audit', label: 'Audit Log', icon: History }, { to: '/settings', label: 'Mipangilio', icon: SettingsIcon }]
    : baseNav

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = String(session?.name || '?').split(/\s+/)
    .map(w => w.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?'
  const role = session?.role

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* sidebar */}
      <aside className={`fixed md:sticky md:top-0 z-30 inset-y-0 left-0 h-screen w-64 shrink-0 flex flex-col bg-gradient-to-b from-navy-900 via-navy-800 to-primary-900 text-white transform transition-transform duration-300 shadow-2xl ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-5 border-b border-navy-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center font-black text-lg shadow-lg">S</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">SmartSoko</h1>
            <p className="text-xs text-gray-300">Fedha za Bodi</p>
          </div>
          <button className="md:hidden ml-auto text-gray-300" onClick={() => setOpen(false)} aria-label="Funga menyu"><X size={18} /></button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto" aria-label="Menyu kuu">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to))
            return (
              <Link key={to} to={to} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={18} /> {label}
                {to === '/chat' && unread > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-navy-800 space-y-1">
          <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/10 hover:text-white transition">
            <Search size={14} /> Tafuta <span className="ml-auto rounded border border-white/20 px-1.5 py-0.5 text-[10px]">Ctrl K</span>
          </button>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">{initials}</div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate">{session?.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{roleLabel(role)}</div>
            </div>
          </div>
          <button onClick={() => setDark(d => !d)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/10 hover:text-white transition">
            {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-300 hover:bg-red-500/15 hover:text-red-200 transition">
            <LogOut size={14} /> Toka (Logout)
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b p-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setOpen(true)} aria-label="Fungua menyu"><Menu /></button>
          <span className="font-semibold text-sm">SmartSoko Fedha</span>
          <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-primary-50 text-primary-700 font-semibold">{roleLabel(role)}</span>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto animate-fadeIn">{children}</main>
        <footer className="text-center text-[11px] text-gray-400 py-3 no-print">© {new Date().getFullYear()} SmartSoko — Mfumo wa Fedha za Bodi</footer>
      </div>
    </div>
  )
}
