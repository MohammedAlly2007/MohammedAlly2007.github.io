import { useEffect, useState } from 'react'
import {
  Download, X, Share, MoreVertical, Monitor, Smartphone, CheckCircle2,
  PlusSquare, ArrowUpRight, RefreshCw, WifiOff,
} from 'lucide-react'

const standalone = () =>
  typeof window !== 'undefined' && (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches
  )

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'desktop'
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
      // Chrome may return a promise here; never leave it unhandled.
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

const STEPS = {
  ios: {
    icon: Smartphone,
    title: 'Sakinisha kwenye iPhone / iPad',
    steps: [
      { icon: Share, text: 'Bonyeza ikoni ya Share kwenye kona ya chini ya Safari.' },
      { icon: PlusSquare, text: 'Chagua "Add to Home Screen" (Ongeza kwenye Skrini ya Nyumbani).' },
      { icon: CheckCircle2, text: 'Bonyeza "Add" — SmartSoko itaonekana kwenye skrini yako ya nyumbani.' },
    ],
  },
  android: {
    icon: Smartphone,
    title: 'Sakinisha kwenye Android',
    steps: [
      { icon: MoreVertical, text: 'Bonyeza menyu ya dots tatu juu kulia kwenye Chrome.' },
      { icon: Download, text: 'Chagua "Install app" au "Add to Home screen".' },
      { icon: CheckCircle2, text: 'Bonyeza "Install" — app itaongezwa kwenye simu yako.' },
    ],
  },
  desktop: {
    icon: Monitor,
    title: 'Sakinisha kwenye kompyuta',
    steps: [
      { icon: ArrowUpRight, text: 'Bonyeza ikoni ya install kwenye upande wa kulia wa address bar, au menyu ya browser.' },
      { icon: Download, text: 'Chagua "Install SmartSoko..." / "Sakinisha SmartSoko".' },
      { icon: CheckCircle2, text: 'Bonyeza "Install" — app itafunguka kama programu ya kawaida.' },
    ],
  },
}

function HelpModal({ open, onClose, onRetry, canPrompt }) {
  const [platform, setPlatform] = useState(detectPlatform)
  useEffect(() => { if (open) setPlatform(detectPlatform()) }, [open])
  if (!open) return null
  const info = STEPS[platform] || STEPS.desktop
  const PlatformIcon = info.icon

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[120] p-4" onMouseDown={onClose}>
      <div className="bg-white dark:bg-[#111a2b] rounded-2xl w-full max-w-lg shadow-2xl animate-scaleIn overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <div className="relative hero-mesh px-5 py-4 text-white overflow-hidden">
          <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
              <PlatformIcon size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold leading-tight">{info.title}</h3>
              <p className="text-[11px] text-indigo-100/80">Hatua {info.steps.length} kwa urahisi</p>
            </div>
            <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-white/15 transition" aria-label="Funga">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {info.steps.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary-50 text-primary-600 dark:bg-indigo-500/15 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                {i + 1}
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
                <Icon size={15} className="mt-0.5 shrink-0 text-primary-500" />
                <span>{text}</span>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={() => setPlatform(p => (p === 'ios' ? 'android' : p === 'android' ? 'desktop' : 'ios'))}
              className="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} /> Niko kwenye kifaa kingine
            </button>
            {canPrompt && (
              <button onClick={onRetry} className="btn-primary !py-2 !px-3 text-xs">Sakinisha sasa</button>
            )}
          </div>

          <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3 text-[11px] text-gray-600 dark:text-gray-300 flex items-start gap-2">
            <WifiOff size={14} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>Baada ya kusakinisha, SmartSoko inafanya kazi bila mtandao na itasawazisha data yako mtandao unaporejea.</span>
          </div>
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
        <HelpModal open={help} onClose={() => setHelp(false)} onRetry={start} canPrompt={canPrompt} />
      </div>
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
