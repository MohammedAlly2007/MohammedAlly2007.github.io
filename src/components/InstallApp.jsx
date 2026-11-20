import { useEffect, useState } from 'react'
import {
  Download, X, Share, MoreVertical, Monitor, Smartphone, CheckCircle2,
  PlusSquare, ArrowUpRight, RefreshCw, WifiOff, Apple, Chrome, Sparkles,
} from 'lucide-react'

const standalone = () =>
  typeof window !== 'undefined' && (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches
  )

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'android'
  const ua = navigator.userAgent || ''
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (iOS) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

// Keep one shared deferred prompt for the whole app: browsers fire
// `beforeinstallprompt` only once, so every button must read the same value.
let deferredPrompt = null
const watchers = new Set()
const notify = () => watchers.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function useInstall() {
  const [state, setState] = useState(() => ({ installed: standalone(), canPrompt: !!deferredPrompt }))

  useEffect(() => {
    const update = () => setState({ installed: standalone(), canPrompt: !!deferredPrompt })
    watchers.add(update)
    update()
    let mq
    try {
      mq = window.matchMedia('(display-mode: standalone)')
      mq.addEventListener?.('change', update)
    } catch { /* ignore */ }
    return () => {
      watchers.delete(update)
      try { mq?.removeEventListener?.('change', update) } catch { /* ignore */ }
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false
    const p = deferredPrompt
    deferredPrompt = null
    try {
      const res = p.prompt()
      if (res && typeof res.then === 'function') await res.catch(() => {})
      await p.userChoice
      notify()
      setTimeout(notify, 1200)
      return true
    } catch {
      notify()
      return false
    }
  }

  return { ...state, install }
}

const PLATFORMS = [
  { id: 'ios', label: 'iPhone / iPad', icon: Apple },
  { id: 'android', label: 'Android', icon: Smartphone },
  { id: 'desktop', label: 'Kompyuta', icon: Monitor },
]

const STEPS = {
  ios: [
    { icon: Share, title: 'Bonyeza Share', text: 'Kwenye Safari, bonyeza ikoni ya Share (⬆️) kwenye kona ya chini ya skrini.' },
    { icon: PlusSquare, title: 'Ongeza kwenye skrini', text: 'Chagua "Add to Home Screen" (Ongeza kwenye Skrini ya Nyumbani).' },
    { icon: CheckCircle2, title: 'Thibitisha', text: 'Bonyeza "Add" — SmartSoko itaonekana kwenye skrini yako ya nyumbani.' },
  ],
  android: [
    { icon: MoreVertical, title: 'Fungua menyu', text: 'Kwenye Chrome, bonyeza menyu ya dots tatu (⋮) juu kulia.' },
    { icon: Download, title: 'Sakinisha', text: 'Chagua "Install app" au "Add to Home screen".' },
    { icon: CheckCircle2, title: 'Thibitisha', text: 'Bonyeza "Install" — app itaongezwa kwenye simu yako.' },
  ],
  desktop: [
    { icon: ArrowUpRight, title: 'Bonyeza install', text: 'Bonyeza ikoni ya install kwenye upande wa kulia wa address bar, au menyu ya browser.' },
    { icon: Download, title: 'Sakinisha', text: 'Chagua "Install SmartSoko..." / "Sakinisha SmartSoko".' },
    { icon: CheckCircle2, title: 'Fungua', text: 'Bonyeza "Install" — app itafunguka kama programu ya kawaida.' },
  ],
}

function HelpModal({ open, onClose, onRetry, canPrompt }) {
  const [platform, setPlatform] = useState(detectPlatform)
  useEffect(() => { if (open) setPlatform(detectPlatform()) }, [open])
  if (!open) return null
  const steps = STEPS[platform] || STEPS.android

  return (
    <div className="fixed inset-0 modal-backdrop flex items-end sm:items-center justify-center z-[120] p-0 sm:p-4" onMouseDown={onClose}>
      <div className="bg-white dark:bg-[#111a2b] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl animate-scaleIn overflow-hidden max-h-[92vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
        {/* hero */}
        <div className="relative hero-mesh px-5 py-5 text-white overflow-hidden shrink-0">
          <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-6 bottom-0 w-24 h-24 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-lg">
              <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-lg leading-tight">Sakinisha SmartSoko</h3>
              <p className="text-[11px] text-indigo-100/85 mt-0.5">Weka app kwenye simu au kompyuta yako — bure, bila duka la programu.</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 transition" aria-label="Funga">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* platform tabs */}
        <div className="px-4 pt-4 shrink-0">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
            {PLATFORMS.map((p) => {
              const Icon = p.icon
              const active = platform === p.id
              return (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${active ? 'bg-white dark:bg-[#1a2439] text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  <Icon size={14} /> {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* steps */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-navy-900 dark:text-white">
                  <Icon size={14} className="text-primary-500 dark:text-indigo-300" /> {title}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}

          {platform === 'ios' && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <Sparkles size={13} className="mt-0.5 shrink-0" />
              <span>Kwenye iPhone, Apple hairuhusu kusakinisha kiotomatiki — fuata hatua 3 hapo juu. Hatua hizi zitachukua sekunde chache tu.</span>
            </div>
          )}

          <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3 text-[11px] text-gray-600 dark:text-gray-300 flex items-start gap-2">
            <WifiOff size={14} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>Baada ya kusakinisha, SmartSoko inafanya kazi bila mtandao na itasawazisha data yako mtandao unaporejea.</span>
          </div>
        </div>

        {/* footer actions */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-white/10 flex flex-wrap items-center gap-2 shrink-0">
          {canPrompt && (
            <button onClick={onRetry} className="btn-primary flex-1 !py-2.5 text-sm flex items-center justify-center gap-2">
              <Download size={15} /> Sakinisha sasa
            </button>
          )}
          <button onClick={onClose} className="btn-secondary flex-1 !py-2.5 text-sm">
            Nimeelewa
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Install entry point.
 * variant: 'sidebar' | 'icon' | 'inline' | 'card'
 */
export default function InstallApp({ variant = 'inline', className = '', label }) {
  const { installed, canPrompt, install } = useInstall()
  const [help, setHelp] = useState(false)

  const start = async () => {
    if (canPrompt) {
      const done = await install()
      if (done) return
    }
    setHelp(true)
  }

  if (installed) {
    if (variant === 'icon') return null
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-full px-2.5 py-1 ${className}`}>
        <CheckCircle2 size={13} /> App imesakinishwa
      </span>
    )
  }

  if (variant === 'icon') {
    return (
      <>
        <button onClick={start} title="Sakinisha App" aria-label="Sakinisha App"
          className={`p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary-300 hover:text-primary-700 transition shadow-sm ${className}`}>
          <Download size={17} />
        </button>
        <HelpModal open={help} onClose={() => setHelp(false)} onRetry={start} canPrompt={canPrompt} />
      </>
    )
  }

  if (variant === 'card') {
    return (
      <>
        <div className={`card flex items-start gap-4 ${className}`}>
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Download size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-navy-900">Sakinisha Programu (App)</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Weka SmartSoko kwenye simu au kompyuta yako. Itafanya kazi bila mtandao na itasawazisha data mtandao unaporejea.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={start} className="btn-primary flex items-center gap-2 text-sm">
                <Download size={15} /> Sakinisha App
              </button>
              <span className="text-[11px] text-gray-400">Bure — hakuna duka la programu linalohitajika</span>
            </div>
          </div>
        </div>
        <HelpModal open={help} onClose={() => setHelp(false)} onRetry={start} canPrompt={canPrompt} />
      </>
    )
  }

  if (variant === 'sidebar') {
    return (
      <>
        <button onClick={start}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 transition shadow-lg active:scale-95 ${className}`}>
          <Download size={14} /> {label || 'Sakinisha App'}
        </button>
        <HelpModal open={help} onClose={() => setHelp(false)} onRetry={start} canPrompt={canPrompt} />
      </>
    )
  }

  return (
    <>
      <button onClick={start} className={`btn-primary flex items-center gap-2 text-sm ${className}`}>
        <Download size={15} /> {label || 'Sakinisha App'}
      </button>
      <HelpModal open={help} onClose={() => setHelp(false)} onRetry={start} canPrompt={canPrompt} />
    </>
  )
}

/**
 * A slim, dismissible banner for mobile (and any) users who haven't installed.
 * Persisted dismissal in localStorage.
 */
export function InstallBanner() {
  const { installed, canPrompt, install } = useInstall()
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('ssbf_install_banner_dismissed') === '1' } catch { return false }
  })
  const [help, setHelp] = useState(false)

  if (installed || dismissed) return null

  const start = async () => {
    if (canPrompt) {
      const done = await install()
      if (done) return
    }
    setHelp(true)
  }

  return (
    <>
      <div className="mb-4 relative overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-500/10 dark:via-blue-500/5 dark:to-cyan-500/10 px-4 py-3 flex items-center gap-3 no-print">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
          <Download size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Sakinisha SmartSoko kwenye simu yako</div>
          <div className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">Itafanya kazi bila mtandao na itasawazisha data yako.</div>
        </div>
        <button onClick={start} className="btn-primary !py-2 !px-3 text-xs shrink-0">
          Sakinisha
        </button>
        <button onClick={() => { try { localStorage.setItem('ssbf_install_banner_dismissed', '1') } catch {} ; setDismissed(true) }}
          className="p-1 rounded-lg text-indigo-400 hover:bg-indigo-100 dark:hover:bg-white/10 transition shrink-0" aria-label="Funga">
          <X size={16} />
        </button>
      </div>
      <HelpModal open={help} onClose={() => setHelp(false)} onRetry={start} canPrompt={canPrompt} />
    </>
  )
}
