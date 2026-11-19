import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, sendChat, refreshFromCloud, markChatSeen, initials, roleLabel } from '../store'
import { MessageSquare, Send, RefreshCw, Users, ArrowDown, Smile } from 'lucide-react'
import { showToast } from '../components/Toast'

const ROLE_STYLE = {
  cfo: 'bg-purple-100 text-purple-700',
  ceo: 'bg-amber-100 text-amber-700',
  accountant: 'bg-primary-100 text-primary-700',
  member: 'bg-green-100 text-green-700',
}

const QUICK = ['Asante 👍', 'Sawa, nimekubali', 'Nitakagua na kurudi', 'Tafadhali thibitisha']

function dayLabel(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const today = new Date()
  const yest = new Date(); yest.setDate(today.getDate() - 1)
  const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (same(d, today)) return 'Leo'
  if (same(d, yest)) return 'Jana'
  return d.toLocaleDateString('sw-TZ', { day: '2-digit', month: 'long', year: 'numeric' })
}

function timeLabel(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })
}

export default function LiveChat() {
  const s = useStore()
  const me = s.session
  const [text, setText] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const listRef = useRef(null)
  const endRef = useRef(null)

  const messages = useMemo(
    () => (s.chat || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at)),
    [s.chat]
  )

  const onlineCount = useMemo(() => {
    const cutoff = Date.now() - 5 * 60 * 1000
    const names = new Set(
      messages.filter(m => new Date(m.at).getTime() > cutoff).map(m => m.authorName)
    )
    return Math.max(1, names.size)
  }, [messages])

  const scrollToEnd = (behavior = 'smooth') => {
    const el = listRef.current
    if (!el) return
    if (behavior === 'smooth' && el.scrollTo) el.scrollTo({ top: el.scrollHeight, behavior })
    else el.scrollTop = el.scrollHeight
  }

  // Mark the thread as read while it is open.
  useEffect(() => { markChatSeen() }, [messages.length])

  // Keep the newest message in view when the user is already at the bottom.
  useEffect(() => {
    if (atBottom) scrollToEnd(messages.length > 1 ? 'smooth' : 'auto')
  }, [messages.length, atBottom])

  // Light polling so messages from other people show up within a few seconds.
  useEffect(() => {
    let alive = true
    const tick = async () => {
      setSyncing(true)
      try { await refreshFromCloud() } catch { /* offline is fine */ }
      if (alive) setSyncing(false)
    }
    tick()
    const id = setInterval(tick, 7000)
    const onFocus = () => tick()
    window.addEventListener('focus', onFocus)
    return () => { alive = false; clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [])

  const onScroll = () => {
    const el = listRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    setAtBottom(distance < 80)
  }

  const submit = (value = text) => {
    const body = String(value || '').trim()
    if (!body) return
    const msg = sendChat(body)
    if (!msg) return showToast('Ujumbe haukutumwa — hakikisha umeingia', 'error')
    setText('')
    setAtBottom(true)
    requestAnimationFrame(() => scrollToEnd('smooth'))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const groups = []
  messages.forEach((m) => {
    const label = dayLabel(m.at)
    const last = groups[groups.length - 1]
    if (!last || last.label !== label) groups.push({ label, items: [m] })
    else last.items.push(m)
  })

  const mine = (m) => m.authorId === me?.userId || (!m.authorId && m.authorName === me?.name)

  return (
    <div className="animate-fadeIn">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
            <MessageSquare size={22} className="text-primary-600" /> Live Chat
          </h2>
          <p className="text-xs text-gray-500">Mazungumzo ya papo kwa papo kati ya wajumbe wa bodi</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {onlineCount} mtandaoni
          </span>
          <button
            onClick={async () => { setSyncing(true); await refreshFromCloud(); setSyncing(false); showToast('Ujumbe umesasishwa', 'success') }}
            className="btn-secondary !px-3 !py-2 text-xs flex items-center gap-1.5"
            title="Sasisha ujumbe"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> Sasisha
          </button>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden flex flex-col h-[calc(100vh-14rem)] min-h-[420px]">
        {/* thread */}
        <div
          ref={listRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4 bg-gradient-to-b from-white/60 to-primary-50/40"
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-3 animate-float">
                <MessageSquare size={28} className="text-primary-600" />
              </div>
              <h3 className="font-bold text-navy-900">Hakuna ujumbe bado</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Anzisha mazungumzo. Ujumbe wako utaonekana kwa wajumbe wote walioingia kwenye mfumo.
              </p>
            </div>
          )}

          {groups.map((g) => (
            <div key={g.label} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{g.label}</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              {g.items.map((m) => {
                const own = mine(m)
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${own ? 'justify-end' : 'justify-start'} animate-slideUp`}>
                    {!own && (
                      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-navy-700 to-primary-700 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                        {initials(m.authorName)}
                      </div>
                    )}
                    <div className={`max-w-[85%] sm:max-w-[70%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!own && (
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-xs font-semibold text-gray-700">{m.authorName}</span>
                          <span className={`badge !px-1.5 !py-0 !text-[9px] ${ROLE_STYLE[m.role] || ROLE_STYLE.member}`}>
                            {roleLabel(m.role)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-sm ${
                          own
                            ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-br-md'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        {m.body}
                      </div>
                      <div className={`text-[10px] text-gray-400 mt-0.5 px-1 ${own ? 'text-right' : ''}`}>
                        {timeLabel(m.at)}{own ? ' · Wewe' : ''}
                      </div>
                    </div>
                    {own && (
                      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                        {initials(m.authorName)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* jump-to-bottom */}
        {!atBottom && messages.length > 0 && (
          <div className="relative">
            <button
              onClick={() => { setAtBottom(true); scrollToEnd('smooth') }}
              className="absolute -top-12 right-4 z-10 w-9 h-9 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 transition active:scale-95"
              title="Nenda chini"
            >
              <ArrowDown size={16} />
            </button>
          </div>
        )}

        {/* quick replies */}
        <div className="px-3 sm:px-5 pt-2 flex gap-2 overflow-x-auto no-print">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => submit(q)}
              className="shrink-0 text-[11px] bg-white/80 border border-gray-200 text-gray-600 rounded-full px-3 py-1 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* composer */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white/80">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                className="input !py-2.5 resize-none leading-relaxed"
                rows={1}
                maxLength={1000}
                placeholder="Andika ujumbe... (Enter kutuma, Shift+Enter mstari mpya)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Ujumbe"
              />
              <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Smile size={11} /> Ujumbe unaonekana kwa wote
                </span>
                <span className={`text-[10px] ${text.length > 900 ? 'text-amber-600' : 'text-gray-400'}`}>{text.length}/1000</span>
              </div>
            </div>
            <button
              onClick={() => submit()}
              disabled={!text.trim()}
              className="btn-primary !px-4 !py-3 flex items-center gap-2 disabled:opacity-40"
              aria-label="Tuma ujumbe"
            >
              <Send size={16} /> <span className="hidden sm:inline">Tuma</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
        <Users size={13} />
        Ujumbe {messages.length} · Unasawazisha kila sekunde 7
        {syncing && <RefreshCw size={12} className="animate-spin text-primary-500" />}
      </div>
    </div>
  )
}
