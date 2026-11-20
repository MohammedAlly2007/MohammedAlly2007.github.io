import { Link } from 'react-router-dom'
import {
  Wallet, TrendingDown, PiggyBank, AlertCircle, Clock, ArrowUpRight, Users, Target,
  Sparkles, ChevronRight, Trophy, CalendarDays, HandCoins, Activity,
} from 'lucide-react'
import {
  useStore, totalCollected, totalExpenses, balance, memberStatus, memberExpected,
  memberPaid, money, pendingExpenses, formatDate,
} from '../store'
import StatCard from '../components/StatCard'
import { InstallBanner } from '../components/InstallApp'

function Donut({ segments, size = 132, stroke = 14 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-200/70 dark:text-slate-700" />
      {segments.map((s, i) => {
        const len = (s.value / total) * c
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray .8s ease' }} />
        )
        offset += len
        return el
      })}
    </svg>
  )
}

export default function Dashboard({ canEdit }) {
  const s = useStore()
  const collected = totalCollected(s.payments)
  const spent = totalExpenses(s.expenses)
  const bal = balance(s.payments, s.expenses)
  const owed = s.members.filter(m => memberStatus(m, s.campaigns, s.payments) === 'owes').length
  const none = s.members.filter(m => memberStatus(m, s.campaigns, s.payments) === 'none').length
  const complete = s.members.filter(m => memberStatus(m, s.campaigns, s.payments) === 'complete').length
  const pending = pendingExpenses(s.expenses)
  const expected = s.members.reduce((sum, m) => sum + memberExpected(m, s.campaigns), 0)
  const rate = expected ? Math.min(100, Math.round(collected / expected * 100)) : 0
  const recent = s.payments.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5)
  const firstName = String(s.session?.name || '').replace(/\(.*?\)/g, '').trim().split(/\s+/)[0] || 'Mwanabodi'

  const monthly = {}
  s.payments.forEach(p => { const m = (p.date || '').slice(0, 7); if (!m) return; monthly[m] = monthly[m] || { inc: 0, exp: 0 }; monthly[m].inc += Number(p.amount) })
  s.expenses.filter(e => (e.status || 'approved') === 'approved').forEach(e => { const m = (e.date || '').slice(0, 7); if (!m) return; monthly[m] = monthly[m] || { inc: 0, exp: 0 }; monthly[m].exp += Number(e.amount) })
  const keys = Object.keys(monthly).sort().slice(-6)
  const maxMonth = Math.max(1, ...keys.map(k => Math.max(monthly[k].inc, monthly[k].exp)))

  const spark = (arr) => {
    const max = Math.max(1, ...arr)
    return arr.map(v => v / max)
  }
  const last6 = keys.map(k => monthly[k])

  const donut = [
    { label: 'Waliokamilisha', value: complete, color: '#10b981' },
    { label: 'Wanaodaiwa', value: owed, color: '#f59e0b' },
    { label: 'Hawajachangia', value: none, color: '#f43f5e' },
  ]

  const cards = [
    { label: 'Iliyokusanywa', value: money(collected), hint: `${s.payments.length} malipo yamerekodiwa`, icon: Wallet, gradient: 'from-emerald-500 to-teal-600', accent: 'text-emerald-600', bars: spark(last6.map(m => m.inc || 0)) },
    { label: 'Iliyotumika', value: money(spent), hint: `${s.expenses.length} matumizi`, icon: TrendingDown, gradient: 'from-rose-500 to-pink-600', accent: 'text-rose-600', bars: spark(last6.map(m => m.exp || 0)) },
    { label: 'Salio la Mfuko', value: money(bal), hint: bal >= 0 ? 'Mfuko uko salama' : 'Mfuko umepungua', icon: PiggyBank, gradient: 'from-indigo-500 to-blue-600', accent: 'text-indigo-600', bars: spark(last6.map(m => Math.max(0, (m.inc || 0) - (m.exp || 0)))) },
    { label: 'Wanaodaiwa', value: String(owed + none), hint: `${complete} wamekamilisha`, icon: AlertCircle, gradient: 'from-amber-500 to-orange-600', accent: 'text-amber-600' },
  ]

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Habari za asubuhi'
    if (h < 17) return 'Habari za mchana'
    return 'Habari za jioni'
  })()

  return (
    <div className="space-y-5">
      <div className="md:hidden"><InstallBanner /></div>
      <section className="hero-mesh relative overflow-hidden rounded-3xl p-5 sm:p-7 text-white shadow-2xl shadow-indigo-900/25 animate-slideUp">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/20 blur-2xl animate-floatSlow" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-cyan-300/30 blur-2xl animate-float" />
        </div>

        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/15 border border-white/25 rounded-full px-3 py-1 backdrop-blur">
              <Sparkles size={12} /> {new Date().toLocaleDateString('sw-TZ', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {greeting}, {firstName} 👋
            </h2>
            <p className="text-sm text-indigo-100/85 mt-1.5 max-w-lg">
              Hii ni picha ya haraka ya fedha za bodi ya SmartSoko. Kila mchango, malipo na matumizi — mahali pamoja.
            </p>
            <div className="flex flex-wrap gap-2 mt-5 no-print">
              {canEdit && (
                <Link to="/payments" className="hero-cta inline-flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">
                  <HandCoins size={16} /> Rekodi Malipo
                </Link>
              )}
              <Link to="/reports" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all backdrop-blur active:scale-95">
                <Activity size={16} /> Ripoti
              </Link>
              <Link to="/chat" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all backdrop-blur active:scale-95">
                Live Chat <ChevronRight size={15} />
              </Link>
            </div>
          </div>

          {/* progress ring */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-32 h-32 sm:w-44 sm:h-44">
              <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 drop-shadow-xl">
                <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="14" />
                <circle cx="80" cy="80" r="64" fill="none" stroke="url(#ringGrad)" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${(rate / 100) * 2 * Math.PI * 64} ${2 * Math.PI * 64}`} style={{ transition: 'stroke-dasharray 1s ease' }} />
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a5f3fc" />
                    <stop offset="50%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold tabular">{rate}%</span>
                <span className="text-[10px] text-indigo-100/80 uppercase tracking-widest">Ukusanyaji</span>
              </div>
            </div>
            <div className="absolute -left-2 sm:left-2 top-2 hidden sm:block bg-white/15 backdrop-blur border border-white/25 rounded-xl px-3 py-1.5 text-[10px] shadow-lg animate-float">
              <div className="text-indigo-100/70">Lengo</div>
              <div className="font-bold tabular">{money(expected)}</div>
            </div>
            <div className="absolute -right-1 bottom-1 hidden sm:block bg-white/15 backdrop-blur border border-white/25 rounded-xl px-3 py-1.5 text-[10px] shadow-lg animate-float" style={{ animationDelay: '1.2s' }}>
              <div className="text-indigo-100/70">Salio</div>
              <div className="font-bold tabular">{money(bal)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- KPI ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {pending.length > 0 && (
        <Link to="/expenses" className="block relative overflow-hidden rounded-2xl border border-amber-200/80 dark:border-amber-500/30 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-500/15 dark:via-orange-500/10 dark:to-amber-500/15 px-4 py-3.5 flex items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Clock size={19} />
          </span>
          <div className="text-sm min-w-0">
            <strong className="text-amber-800">Matumizi {pending.length} yanasubiri idhini</strong>
            <span className="text-amber-700"> — jumla {money(pending.reduce((x, e) => x + Number(e.amount || 0), 0))}.</span>
            <span className="text-amber-600 text-xs"> Bofya kuangalia.</span>
          </div>
          <ArrowUpRight size={18} className="ml-auto text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
        </Link>
      )}

      {/* ---------- CHART + DONUT ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-navy-900 flex items-center gap-2"><Activity size={17} className="text-indigo-500" /> Mwenendo wa Fedha</h3>
              <p className="text-[11px] text-gray-500">Mapato dhidi ya matumizi kwa miezi 6</p>
            </div>
            <div className="flex gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600" /> Mapato</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-rose-400 to-rose-600" /> Matumizi</span>
            </div>
          </div>

          {keys.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mb-2 animate-float"><Activity size={22} /></div>
              <p className="text-sm text-gray-500">Hakuna data ya miezi bado.</p>
              <p className="text-[11px] text-gray-400">Rekodi malipo kuanza kuona mwenendo.</p>
            </div>
          ) : (
            <div className="flex items-end gap-2 sm:gap-4 h-48 px-1">
              {keys.map((k, i) => (
                <div key={k} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="flex gap-1 items-end h-40 w-full justify-center">
                    <div className="w-2.5 sm:w-4 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 group-hover:opacity-80"
                      style={{ height: `${Math.max(3, monthly[k].inc / maxMonth * 100)}%`, animation: `drawBar .7s ease ${i * 0.06}s both`, transformOrigin: 'bottom' }}
                      title={`Mapato ${money(monthly[k].inc)}`} />
                    <div className="w-2.5 sm:w-4 rounded-t-md bg-gradient-to-t from-rose-600 to-rose-400 transition-all duration-500 group-hover:opacity-80"
                      style={{ height: `${Math.max(3, monthly[k].exp / maxMonth * 100)}%`, animation: `drawBar .7s ease ${i * 0.06 + 0.1}s both`, transformOrigin: 'bottom' }}
                      title={`Matumizi ${money(monthly[k].exp)}`} />
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">{new Date(k + '-01').toLocaleDateString('sw-TZ', { month: 'short' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-navy-900 flex items-center gap-2 mb-1"><Users size={17} className="text-indigo-500" /> Hali ya Wanabodi</h3>
          <p className="text-[11px] text-gray-500 mb-2">Mgawanyo wa michango</p>
          <div className="flex items-center justify-center relative my-2">
            <Donut segments={donut} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-navy-900 tabular">{s.members.length}</span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400">Wanabodi</span>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {donut.map(d => (
              <div key={d.label} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-gray-600 flex-1">{d.label}</span>
                <span className="font-bold tabular text-navy-900">{d.value}</span>
              </div>
            ))}
          </div>
          <Link to="/notifications" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:gap-2 transition-all">Tuma vikumbusho <ChevronRight size={13} /></Link>
        </div>
      </div>

      {/* ---------- 3 COLUMNS ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* top contributors */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-navy-900 flex items-center gap-2"><Trophy size={17} className="text-amber-500" /> Wachangiaji Bora</h3>
            <Link to="/members" className="text-[11px] text-indigo-600 hover:underline">Wote</Link>
          </div>
          {(() => {
            const top = [...s.members].map(m => ({ m, paid: memberPaid(m.id, s.payments) })).sort((a, b) => b.paid - a.paid).slice(0, 5)
            if (!top.length) return <EmptyRow icon={Users} text="Hakuna wanabodi bado." />
            const max = Math.max(1, top[0].paid)
            const medals = ['from-amber-400 to-yellow-500', 'from-slate-300 to-slate-400', 'from-orange-400 to-amber-600']
            return top.map(({ m, paid }, i) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-100/80 last:border-0 group">
                <span className={`w-7 h-7 shrink-0 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow bg-gradient-to-br ${medals[i] || 'from-indigo-400 to-blue-500'}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate group-hover:text-indigo-700 transition">{m.fullName}</div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${medals[i] || 'from-indigo-400 to-blue-500'}`} style={{ width: `${Math.round(paid / max * 100)}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 tabular shrink-0">{money(paid)}</span>
              </div>
            ))
          })()}
        </div>

        {/* campaigns */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-navy-900 flex items-center gap-2"><Target size={17} className="text-fuchsia-500" /> Michango Maalum</h3>
            <Link to="/contributions" className="text-[11px] text-indigo-600 hover:underline">Zaidi</Link>
          </div>
          {s.campaigns.length === 0 && <EmptyRow icon={Target} text="Hakuna michango maalum." />}
          {s.campaigns.slice(0, 4).map(c => {
            const paid = s.payments.filter(p => p.campaignId === c.id).reduce((x, p) => x + Number(p.amount), 0)
            const pct = c.targetAmount ? Math.min(100, Math.round(paid / c.targetAmount * 100)) : 0
            return (
              <div key={c.id} className="mb-3.5 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium truncate pr-2">{c.name}</span>
                  <span className="font-bold text-indigo-600 tabular">{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-gray-500 mt-1 tabular">{money(paid)} / {money(c.targetAmount)}</div>
              </div>
            )
          })}
        </div>

        {/* recent payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-navy-900 flex items-center gap-2"><CalendarDays size={17} className="text-emerald-500" /> Malipo ya Karibuni</h3>
            <Link to="/payments" className="text-[11px] text-indigo-600 hover:underline">Yote</Link>
          </div>
          {recent.length === 0 && <EmptyRow icon={Wallet} text="Hakuna malipo bado." />}
          {recent.map(p => {
            const m = s.members.find(x => x.id === p.memberId)
            const ini = String(m?.fullName || '?').split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
            return (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-100/80 last:border-0">
                <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-bold flex items-center justify-center">{ini}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{m?.fullName || 'Mwanachama'}</div>
                  <div className="text-[10px] text-gray-400">{formatDate(p.date)}</div>
                </div>
                <span className="text-xs font-bold text-emerald-600 tabular shrink-0">+{money(p.amount)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EmptyRow({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mb-2 dark:bg-indigo-500/15"><Icon size={20} /></div>
      <p className="text-xs text-gray-500">{text}</p>
    </div>
  )
}
