import { useState } from 'react'
import { useStore, memberStatus, memberPaid, memberExpected, money } from '../store'
import { AlertCircle, Bell, MessageCircle, Copy, FileText, CheckCircle2 } from 'lucide-react'
import { showToast } from '../components/Toast'

function waNumber(phone = '') {
  const d = String(phone).replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('255')) return d
  if (d.startsWith('0')) return '255' + d.slice(1)
  if (d.length === 9) return '255' + d
  return d
}

export default function Notifications() {
  const s = useStore()
  const [copied, setCopied] = useState('')
  const arrears = s.members
    .filter(m => memberStatus(m, s.campaigns, s.payments) !== 'complete')
    .map(m => {
      const exp = memberExpected(m, s.campaigns)
      const paid = memberPaid(m.id, s.payments)
      return { m, exp, paid, debt: Math.max(0, exp - paid), st: memberStatus(m, s.campaigns, s.payments) }
    })
    .sort((a, b) => b.debt - a.debt)

  const totalDebt = arrears.reduce((x, a) => x + a.debt, 0)

  const messageFor = ({ m, exp, paid, debt }) =>
    `Habari ${m.fullName}, tunakukumbusha mchango wako wa SmartSoko. Umelipa ${money(paid)} kati ya ${money(exp)}. Deni lililobaki ni ${money(debt)}. Tafadhali kamilisha mchango wako. Asante — SmartSoko.`

  const copy = async (row) => {
    try {
      await navigator.clipboard.writeText(messageFor(row))
      setCopied(row.m.id)
      showToast('Ujumbe umenakiliwa — unaweza kupaste WhatsApp/SMS', 'success')
      setTimeout(() => setCopied(''), 2500)
    } catch {
      showToast('Imeshindikana kunakili', 'error')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-navy-900">Arifa & Vikumbusho vya Madeni</h2>
        <p className="text-xs text-gray-500">Tuma vikumbusho kwa wanachama wanaodaiwa</p>
      </div>

      {arrears.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="card"><div className="text-xs text-gray-500">Wanaodaiwa</div><div className="text-xl font-bold text-amber-600">{arrears.length}</div></div>
          <div className="card"><div className="text-xs text-gray-500">Jumla ya madeni</div><div className="text-xl font-bold text-red-600 tabular">{money(totalDebt)}</div></div>
          <div className="card"><div className="text-xs text-gray-500">Waliokamilisha</div><div className="text-xl font-bold text-green-600">{s.members.length - arrears.length}</div></div>
        </div>
      )}

      {arrears.length === 0 && (
        <div className="card text-center text-green-600 font-semibold flex items-center justify-center gap-2"><CheckCircle2 size={20} /> Hakuna madeni. Wanachama wote wamekamilisha! 🎉</div>
      )}

      <div className="space-y-3">
        {arrears.map(({ m, exp, paid, debt, st }) => (
          <div key={m.id} className="card flex items-start gap-3">
            <AlertCircle className={st === 'none' ? 'text-red-600' : 'text-amber-600'} size={22} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{m.fullName}</div>
              <div className="text-sm text-gray-600">
                {st === 'none' ? 'Hajachangia kabisa.' : `Amelipa ${money(paid)} kati ya ${money(exp)}.`}
              </div>
              <div className="text-sm font-bold text-red-600 mt-1 tabular">Deni: {money(debt)}</div>
              {m.phone && <div className="text-xs text-gray-500 mt-1">Simu: {m.phone}</div>}
              <div className="flex flex-wrap gap-2 mt-2 no-print">
                {waNumber(m.phone) && (
                  <a href={`https://wa.me/${waNumber(m.phone)}?text=${encodeURIComponent(messageFor({ m, exp, paid, debt }))}`} target="_blank" rel="noreferrer"
                    className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-2.5 py-1 flex items-center gap-1 hover:bg-green-100 transition">
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
                <button onClick={() => copy({ m, exp, paid, debt })} className="text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1 flex items-center gap-1 hover:bg-gray-100 transition">
                  <Copy size={13} /> {copied === m.id ? 'Imenakiliwa' : 'Nakili ujumbe'}
                </button>
                <a href={`/statement/${m.id}`} target="_blank" rel="noreferrer" className="text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-lg px-2.5 py-1 flex items-center gap-1 hover:bg-primary-100 transition">
                  <FileText size={13} /> Taarifa
                </a>
              </div>
            </div>
            <Bell className="text-gray-300" size={18} />
          </div>
        ))}
      </div>
    </div>
  )
}
