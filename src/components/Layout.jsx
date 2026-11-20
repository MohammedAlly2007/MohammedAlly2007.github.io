import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Target, Wallet, Receipt, FileBarChart, PieChart, Bell,
  Settings as SettingsIcon, History, LogOut, Menu, Moon, Sun, Search, X, MessageSquare,
  Download, ChevronRight, Sparkles, ShieldCheck,
} from 'lucide-react'
import { logout, roleLabel, useStore, unreadChatCount } from '../store'
import { useEffect, useState } from 'react'
import InstallApp from './InstallApp'

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

const TITLES = {
  '/': 'Dashibodi',
  '/members': 'Wanabodi',
  '/contributions': 'Michango',
  '/payments': 'Malipo',
  '/expenses': 'Matumizi',
  '/budgets': 'Bajeti',
  '/reports': 'Ripoti',
  '/chat': 'Live Chat',
  '/notifications': 'Arifa',
  '/audit': 'Audit Log',
  '/settings': 'Mipangilio',
}

const GRADIENTS = [
  'from-indigo-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-fuchsia-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-cyan-600',
  'from-rose-500 to-pink-600',
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
  const pageTitle = TITLES[loc.pathname] || (loc.pathname.startsWith('/statement') ? 'Taarifa ya Mwanachama' : 'SmartSoko')
  const pend = (state.expenses || []).filter(e => e.status === 'pending').length
  const today = new Date().toLocaleDateString('sw-TZ', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen flex">
      {/* decorative background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden no-print" aria-hidden="true">
        <div className="mesh-blob animate-floatSlow w-72 h-72 bg-indigo-400/30 -top-16 -left-10 dark:bg-indigo-600/20" />
        <div className="mesh-blob animate-floatSlow w-80 h-80 bg-cyan-300/25 top-1/3 -right-24 dark:bg-cyan-500/10" style={{ animationDelay: '3s' }} />
        <div className="mesh-blob animate-floatSlow w-72 h-72 bg-fuchsia-300/20 bottom-0 left-1/3 dark:bg-fuchsia-600/10" style={{ animationDelay: '6s' }} />
      </div>

      {/* sidebar */}
      <aside className={`fixed md:sticky md:top-0 z-40 inset-y-0 left-0 h-screen w-[17rem] shrink-0 flex flex-col text-white transform transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1220] via-[#101a33] to-[#0b1a2e]" />
        <div className="absolute inset-0 opacity-70"
          style={{ background: 'radial-gradient(420px 220px at 15% 0%, rgba(79,70,229,0.45), transparent 65%), radial-gradient(360px 220px at 100% 100%, rgba(6,182,212,0.28), transparent 65%)' }} />

        <div className="relative p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 via-blue-500 to-cyan-400 flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-900/50 animate-pulseRing">S</div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-base leading-tight tracking-tight">SmartSoko</h1>
            <p className="text-[11px] text-indigo-200/80 flex items-center gap-1"><Sparkles size={10} /> Fedha za Bodi</p>
          </div>
          <button className="md:hidden ml-auto text-gray-300 hover:text-white" onClick={() => setOpen(false)} aria-label="Funga menyu"><X size={18} /></button>
        </div>

        <div className="relative px-4 pb-1 pt-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-indigo-200/50 font-bold">Menyu kuu</span>
        </div>

        <nav className="relative p-3 space-y-1 flex-1 overflow-y-auto" aria-label="Menyu kuu">
          {nav.map(({ to, label, icon: Icon }, i) => {
            const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to))
            return (
              <Link key={to} to={to} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/95 text-indigo-700 shadow-lg shadow-indigo-950/30'
                    : 'text-indigo-100/75 hover:bg-white/10 hover:text-white'
                }`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-cyan-400" />}
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  active ? `bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} text-white shadow` : 'bg-white/5 text-indigo-200 group-hover:bg-white/10'
                }`}>
                  <Icon size={16} />
                </span>
                <span className="truncate">{label}</span>
                {to === '/chat' && unread > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
                {to === '/expenses' && pend > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold flex items-center justify-center">{pend}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="relative p-3 space-y-2 border-t border-white/10">
          <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-indigo-100/70 hover:bg-white/10 hover:text-white transition border border-white/10 bg-white/5">
            <Search size={14} /> Tafuta <span className="ml-auto rounded-md border border-white/20 px-1.5 py-0.5 text-[10px]">Ctrl K</span>
          </button>

          <InstallApp variant="sidebar" />

          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-[11px] font-bold ring-2 ring-white/20">{initials}</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate">{session?.name}</div>
              <div className="text-[10px] text-indigo-200/70 truncate flex items-center gap-1"><ShieldCheck size={9} /> {roleLabel(role)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setDark(d => !d)} className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] text-indigo-100/80 hover:bg-white/10 hover:text-white transition">
              {dark ? <Sun size={13} /> : <Moon size={13} />} {dark ? 'Light' : 'Dark'}
            </button>
            <button onClick={handleLogout} className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] text-rose-200 hover:bg-rose-500/20 hover:text-white transition">
              <LogOut size={13} /> Toka
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="relative flex-1 flex flex-col min-w-0">
        {/* mobile header */}
        <header className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/70 px-3 py-2.5 flex items-center gap-3 no-print">
          <button onClick={() => setOpen(true)} aria-label="Fungua menyu" className="p-1.5 rounded-lg hover:bg-gray-100 transition"><Menu size={20} /></button>
          <div className="min-w-0">
            <div className="text-[10px] text-gray-400 leading-none">SmartSoko</div>
            <div className="font-bold text-sm truncate leading-tight">{pageTitle}</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <InstallApp variant="icon" className="!p-2" />
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition">
              <Bell size={18} />
              {pend > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />}
            </Link>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-white text-[10px] font-bold flex items-center justify-center">{initials}</div>
        </header>

        {/* desktop topbar */}
        <header className="hidden md:flex items-center gap-4 px-6 py-3.5 bg-white/60 backdrop-blur-xl border-b border-white/60 sticky top-0 z-20 no-print">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span>SmartSoko</span><ChevronRight size={11} /><span className="text-gray-600 font-medium">{pageTitle}</span>
            </div>
            <h2 className="text-lg font-bold text-navy-900 leading-tight">{pageTitle}</h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:inline text-[11px] text-gray-400 mr-2">{today}</span>
            <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-white/80 border border-gray-200 rounded-xl px-3 py-2 hover:border-primary-300 hover:text-primary-700 transition shadow-sm">
              <Search size={14} /> Tafuta <span className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px]">Ctrl K</span>
            </button>
            <InstallApp variant="icon" />
            <Link to="/notifications" className="relative p-2.5 rounded-xl bg-white/80 border border-gray-200 hover:border-primary-300 hover:text-primary-700 transition shadow-sm" aria-label="Arifa">
              <Bell size={17} />
              {pend > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold flex items-center justify-center">{pend}</span>}
            </Link>
            <Link to="/chat" className="relative p-2.5 rounded-xl bg-white/80 border border-gray-200 hover:border-primary-300 hover:text-primary-700 transition shadow-sm" aria-label="Live Chat">
              <MessageSquare size={17} />
              {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[9px] font-bold flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
            </Link>
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-gray-200/80">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white text-[11px] font-bold flex items-center justify-center shadow ring-2 ring-white">{initials}</div>
              <div className="hidden xl:block leading-tight">
                <div className="text-xs font-semibold text-gray-800 max-w-[150px] truncate">{session?.name}</div>
                <div className="text-[10px] text-gray-400">{roleLabel(role)}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex-1 p-4 md:p-6 lg:p-7 overflow-auto animate-fadeIn">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
        <footer className="text-center text-[11px] text-gray-400 py-3 no-print">© {new Date().getFullYear()} SmartSoko — Mfumo wa Fedha za Bodi</footer>
      </div>
    </div>
  )
}
