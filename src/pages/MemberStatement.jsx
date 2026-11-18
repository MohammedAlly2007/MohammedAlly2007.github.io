import { useParams, useNavigate } from 'react-router-dom'
import { useStore, memberExpected, memberPaid, money, formatDate } from '../store'
import { Printer, ArrowLeft } from 'lucide-react'

export default function MemberStatement() {
  const { id } = useParams()
  const navigate = useNavigate()
  const s = useStore()
  const m = s.members.find(x => x.id === id)

  if (!m) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-3">Mwanachama hajapatikana.</p>
        <button onClick={() => navigate('/members')} className="btn-primary">Rudi kwa Wanachama</button>
      </div>
    )
  }

  const exp = memberExpected(m, s.campaigns)
  const paid = memberPaid(m.id, s.payments)
  const debt = Math.max(0, exp - paid)
  const payments = s.payments.filter(p => p.memberId === m.id).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const campaigns = s.campaigns.map(c => {
    const cp = s.payments.filter(p => p.memberId === m.id && p.campaignId === c.id).reduce((x, p) => x + Number(p.amount || 0), 0)
    return { ...c, paid: cp }
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4 no-print">
        <button onClick={() => navigate('/members')} className="btn-secondary text-sm flex items-center gap-1.5"><ArrowLeft size={15} /> Rudi</button>
        <button onClick={() => window.print()} className="btn-primary text-sm flex items-center gap-1.5"><Printer size={15} /> Chapisha / Hifadhi PDF</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 print:border-0 print:rounded-none">
        <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-black">S</div>
              <div>
                <h1 className="text-xl font-bold text-navy-900 leading-tight">SmartSoko</h1>
                <p className="text-xs text-gray-500">Fedha za Bodi</p>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold text-gray-700">TAARIFA YA MWANACHAMA</p>
            <p>Statement of Account</p>
            <p>Imezalishwa: {formatDate(new Date())}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Mwanachama</p>
            <p className="font-bold text-lg">{m.fullName}</p>
            <p className="text-gray-600">{m.position || 'Mwanachama'}</p>
            <p className="text-gray-600">{m.phone || '-'}</p>
            <p className="text-gray-600">{m.email || '-'}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Muhtasari</p>
            <p>Anachopaswa: <strong className="tabular">{money(exp)}</strong></p>
            <p>Amelipa: <strong className="text-green-600 tabular">{money(paid)}</strong></p>
            <p className="mt-1 text-base">Deni: <strong className={debt > 0 ? 'text-red-600' : 'text-green-600'}>{money(debt)}</strong></p>
          </div>
        </div>

        <h2 className="font-semibold mb-2 text-sm">Michango kwa Kila Kampeni</h2>
        <table className="w-full text-sm border border-gray-200 mb-6">
          <thead><tr className="bg-gray-50 text-left"><th className="p-2 border-b border-gray-200">Mchango</th><th className="p-2 border-b border-gray-200 text-right">Anachopaswa</th><th className="p-2 border-b border-gray-200 text-right">Amelipa</th><th className="p-2 border-b border-gray-200 text-right">Salio</th></tr></thead>
          <tbody>
            <tr>
              <td className="p-2">Mchango wa Msingi</td>
              <td className="p-2 text-right tabular">{money(m.requiredAmount || 0)}</td>
              <td className="p-2 text-right text-green-600 tabular">{money(s.payments.filter(p => p.memberId === m.id && !p.campaignId).reduce((x, p) => x + Number(p.amount || 0), 0))}</td>
              <td className="p-2 text-right tabular">{money(Math.max(0, Number(m.requiredAmount || 0) - s.payments.filter(p => p.memberId === m.id && !p.campaignId).reduce((x, p) => x + Number(p.amount || 0), 0)))}</td>
            </tr>
            {campaigns.map(c => (
              <tr key={c.id}>
                <td className="p-2">{c.name}</td>
                <td className="p-2 text-right tabular">{money(c.perMemberAmount || 0)}</td>
                <td className="p-2 text-right text-green-600 tabular">{money(c.paid)}</td>
                <td className="p-2 text-right tabular">{money(Math.max(0, Number(c.perMemberAmount || 0) - c.paid))}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td className="p-2">JUMLA</td>
              <td className="p-2 text-right tabular">{money(exp)}</td>
              <td className="p-2 text-right text-green-600 tabular">{money(paid)}</td>
              <td className="p-2 text-right text-red-600 tabular">{money(debt)}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="font-semibold mb-2 text-sm">Historia ya Malipo</h2>
        <table className="w-full text-sm border border-gray-200">
          <thead><tr className="bg-gray-50 text-left"><th className="p-2 border-b border-gray-200">#</th><th className="p-2 border-b border-gray-200">Tarehe</th><th className="p-2 border-b border-gray-200">Maelezo</th><th className="p-2 border-b border-gray-200">Ilirekodiwa na</th><th className="p-2 border-b border-gray-200 text-right">Kiasi</th></tr></thead>
          <tbody>
            {payments.map((p, i) => {
              const c = s.campaigns.find(x => x.id === p.campaignId)
              return (
                <tr key={p.id}>
                  <td className="p-2 text-gray-400">{i + 1}</td>
                  <td className="p-2">{formatDate(p.date)}</td>
                  <td className="p-2">Malipo — {c ? c.name : 'Mfuko Mkuu'}{p.note ? ` (${p.note})` : ''}</td>
                  <td className="p-2 text-gray-500">{p.recordedBy || '-'}</td>
                  <td className="p-2 text-right text-green-600 tabular">{money(p.amount)}</td>
                </tr>
              )
            })}
            {payments.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">Hakuna malipo bado.</td></tr>}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8 mt-10 text-xs text-gray-500">
          <div>
            <div className="border-t border-gray-300 pt-1">Sahihi — Mhasibu</div>
          </div>
          <div>
            <div className="border-t border-gray-300 pt-1">Sahihi — Mwanachama</div>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mt-6 text-center">SmartSoko — Mfumo wa Fedha za Bodi · Taarifa hii imezalishwa kiotomatiki.</p>
      </div>
    </div>
  )
}
