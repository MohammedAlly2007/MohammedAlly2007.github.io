import { Link } from 'react-router-dom'
import { useStore, totalCollected, totalExpenses, balance, memberStatus, memberExpected, memberPaid, money, pendingExpenses } from '../store'
import { Wallet, TrendingDown, PiggyBank, AlertCircle, Clock, ArrowUpRight, Users, Target } from 'lucide-react'

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

  const cards = [
    { label: 'Jumla iliyokusanywa', value: money(collected), icon: Wallet, color: 'text-green-600', bg: 'from-green-100 to-green-200' },
    { label: 'Jumla iliyotumika', value: money(spent), icon: TrendingDown, color: 'text-red-600', bg: 'from-red-100 to-red-200' },
    { label: 'Salio la mfuko', value: money(bal), icon: PiggyBank, color: 'text-primary-600', bg: 'from-primary-100 to-primary-200' },
    { label: 'Wanachama wanaodaiwa', value: String(owed + none), icon: AlertCircle, color: 'text-amber-600', bg: 'from-amber-100 to-amber-200' },
  ]

  return (
    <div>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Dashibodi ya Fedha</h2>
          <p className="text-xs text-gray-500">Muhtasari wa fedha za bodi ya SmartSoko</p>
        </div>
        <div className="flex gap-2 no-print">
          <Link to="/reports" className="btn-secondary text-sm flex items-center gap-1">Ripoti <ArrowUpRight size={15} /></Link>
          {canEdit && <Link to="/payments" className="btn-primary text-sm">+ Rekodi Malipo</Link>}
        </div>
      </div>

      {pending.length > 0 && (
        <Link to="/expenses" className="block mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 hover:bg-amber-100 transition">
          <Clock size={20} className="text-amber-600 shrink-0" />
          <div className="text-sm">
            <strong className="text-amber-800">Matumizi {pending.length} yanasubiri idhini</strong>
            <span className="text-amber-700"> — jumla {money(pending.reduce((x, e) => x + Number(e.amount || 0), 0))}. Bofya kuangalia.</span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 stagger">
        {cards.map(c => (
          <div key={c.label} className="card relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-primary-100/50" />
            <div className="flex items-center justify-between mb-2 relative">
              <span className="text-sm text-gray-500 font-medium">{c.label}</span>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center`}>
                <c.icon className={c.color} size={20} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${c.color} relative tabular`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Collection progress */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold flex items-center gap-2"><Target size={18} className="text-primary-600" /> Maendeleo ya Ukusanyaji</h3>
          <span className="text-sm font-bold text-primary-700">{rate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-gradient-to-r from-primary-500 to-primary-700 h-2.5 rounded-full transition-all duration-700" style={{ width: `${rate}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1.5">
          <span>{money(collected)} imekusanywa</span>
          <span>Lengo: {money(expected)}</span>
        </div>
      </div>

      {/* Monthly chart */}
      {(() => {
        const months = {}
        s.payments.forEach(p => { const m = (p.date || '').slice(0, 7); if (!m) return; months[m] = months[m] || { inc: 0, exp: 0 }; months[m].inc += Number(p.amount) })
        s.expenses.filter(e => (e.status || 'approved') === 'approved').forEach(e => { const m = (e.date || '').slice(0, 7); if (!m) return; months[m] = months[m] || { inc: 0, exp: 0 }; months[m].exp += Number(e.amount) })
        const keys = Object.keys(months).sort().slice(-6)
        const max = Math.max(1, ...keys.map(k => Math.max(months[k].inc, months[k].exp)))
        if (keys.length === 0) return null
        return (
          <div className="card mb-4">
            <h3 className="font-semibold mb-3">Mapato vs Matumizi (Kwa Miezi)</h3>
            <div className="flex items-end gap-3 h-40">
              {keys.map(k => (
                <div key={k} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex gap-1 items-end h-32 w-full justify-center">
                    <div className="w-4 bg-green-500 rounded-t transition-all" style={{ height: `${months[k].inc / max * 100}%` }} title={`Mapato ${money(months[k].inc)}`} />
                    <div className="w-4 bg-red-500 rounded-t transition-all" style={{ height: `${months[k].exp / max * 100}%` }} title={`Matumizi ${money(months[k].exp)}`} />
                  </div>
                  <div className="text-xs text-gray-500">{k.slice(5)}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-2 text-xs"><span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Mapato</span><span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> Matumizi</span></div>
          </div>
        )
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Users size={18} className="text-primary-600" /> Hali ya Wanabodi</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-green-600 font-medium">Waliokamilisha</span><span className="font-bold">{complete}</span></div>
            <div className="flex justify-between"><span className="text-amber-600 font-medium">Wanaodaiwa</span><span className="font-bold">{owed}</span></div>
            <div className="flex justify-between"><span className="text-red-600 font-medium">Hawajachangia</span><span className="font-bold">{none}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2"><span className="font-medium">Jumla</span><span className="font-bold">{s.members.length}</span></div>
          </div>
          <Link to="/notifications" className="text-xs text-primary-600 underline mt-3 inline-block">Tuma vikumbusho vya madeni →</Link>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Wachangiaji Bora (Top Contributors)</h3>
          {[...s.members].map(m => ({ m, paid: memberPaid(m.id, s.payments) })).sort((a, b) => b.paid - a.paid).slice(0, 5).map(({ m, paid }, i) => (
            <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">{i + 1}</span><span className="text-sm">{m.fullName}</span></div>
              <span className="text-sm font-semibold text-green-600 tabular">{money(paid)}</span>
            </div>
          ))}
          {s.members.length === 0 && <p className="text-sm text-gray-500">Hakuna data.</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Michango ya Maalum (Campaigns)</h3>
          {s.campaigns.length === 0 && <p className="text-sm text-gray-500">Hakuna michango maalum.</p>}
          {s.campaigns.map(c => {
            const paid = s.payments.filter(p => p.campaignId === c.id).reduce((x, p) => x + Number(p.amount), 0)
            const pct = c.targetAmount ? Math.min(100, Math.round(paid / c.targetAmount * 100)) : 0
            return (
              <div key={c.id} className="mb-3">
                <div className="flex justify-between text-sm"><span className="font-medium">{c.name}</span><span>{pct}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-primary-600 h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{money(paid)} / {money(c.targetAmount)}</div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Malipo ya Karibuni</h3>
          {recent.length === 0 && <p className="text-sm text-gray-500">Hakuna malipo bado.</p>}
          {recent.map(p => {
            const m = s.members.find(x => x.id === p.memberId)
            return (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm truncate">{m?.fullName || 'Mwanachama'}</div>
                  <div className="text-[11px] text-gray-500">{p.date}</div>
                </div>
                <span className="text-sm font-semibold text-green-600 tabular">{money(p.amount)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
