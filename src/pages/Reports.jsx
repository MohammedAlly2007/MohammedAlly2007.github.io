import { useStore, totalCollected, totalExpenses, balance, memberStatus, memberPaid, memberExpected, money, pendingExpenses, isApproved } from '../store'
import { Download, Printer, AlertCircle, FileBarChart } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const STATUS_SW = { complete: 'Amekamilisha', owes: 'Anadaiwa', none: 'Hajachangia' }

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const s = useStore()
  const collected = totalCollected(s.payments)
  const approved = s.expenses.filter(isApproved)
  const spent = totalExpenses(s.expenses)
  const bal = balance(s.payments, s.expenses)
  const pending = pendingExpenses(s.expenses)
  const ops = approved.filter(e => e.category === 'operations').reduce((x, e) => x + Number(e.amount || 0), 0)
  const inv = approved.filter(e => e.category === 'investment').reduce((x, e) => x + Number(e.amount || 0), 0)

  const exportMembers = () => {
    const rows = [['Jina', 'Simu', 'Barua pepe', 'Nafasi', 'Anachopaswa', 'Amelipa', 'Deni', 'Hali']]
    s.members.forEach(m => {
      const exp = memberExpected(m, s.campaigns)
      const paid = memberPaid(m.id, s.payments)
      rows.push([m.fullName, m.phone, m.email, m.position, exp, paid, Math.max(0, exp - paid), STATUS_SW[memberStatus(m, s.campaigns, s.payments)]])
    })
    downloadCSV('wanachama-michango-smartsoko.csv', rows)
  }

  const exportIncomeExpense = () => {
    const rows = [['Aina', 'Tarehe', 'Maelezo', 'Kiasi (TZS)']]
    s.payments.forEach(p => {
      const m = s.members.find(x => x.id === p.memberId)
      rows.push(['Mapato', p.date, `Malipo - ${m?.fullName || ''} ${p.note || ''}`.trim(), p.amount])
    })
    approved.forEach(e => {
      rows.push(['Matumizi', e.date, `${e.title} (${e.category}) ${e.note || ''}`.trim(), -e.amount])
    })
    rows.push(['', '', 'JUMLA MAPATO', collected])
    rows.push(['', '', 'JUMLA MATUMIZI', spent])
    rows.push(['', '', 'SALIO', bal])
    downloadCSV('mapato-matumizi-smartsoko.csv', rows)
  }

  return (
    <div>
      <PageHeader
        icon={FileBarChart}
        gradient="from-sky-500 to-cyan-600"
        title="Ripoti za Kifedha"
        subtitle={`Imezalishwa ${new Date().toLocaleString('sw-TZ')}`}
        actions={<div className="flex gap-2 flex-wrap">
          <button onClick={exportMembers} className="btn-secondary flex items-center gap-1.5 text-sm"><Download size={15} /> Wanachama (CSV)</button>
          <button onClick={exportIncomeExpense} className="btn-secondary flex items-center gap-1.5 text-sm"><Download size={15} /> Mapato/Matumizi (CSV)</button>
          <button onClick={() => window.print()} className="btn-primary flex items-center gap-1.5 text-sm"><Printer size={15} /> Chapisha / PDF</button>
        </div>}
      />

      <div className="card mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold">Muhtasari</h3>
          <p className="text-xs text-gray-500">SmartSoko — Fedha za Bodi</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center mt-3">
          <div><div className="text-sm text-gray-500">Imekusanywa</div><div className="text-xl font-bold text-green-600 tabular">{money(collected)}</div></div>
          <div><div className="text-sm text-gray-500">Imetumika</div><div className="text-xl font-bold text-red-600 tabular">{money(spent)}</div></div>
          <div><div className="text-sm text-gray-500">Salio</div><div className={`text-xl font-bold tabular ${bal >= 0 ? 'text-primary-600' : 'text-red-600'}`}>{money(bal)}</div></div>
        </div>
        {pending.length > 0 && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle size={14} /> Matumizi {pending.length} ({money(pending.reduce((x, e) => x + Number(e.amount || 0), 0))}) bado yanasubiri idhini — hayajahesabiwa hapa.
          </p>
        )}
      </div>

      <div className="card mb-4">
        <h3 className="font-semibold mb-3">Faida na Hasara (Profit & Loss)</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span>Jumla ya Mapato</span><span className="font-semibold text-green-600 tabular">{money(collected)}</span></div>
          <div className="flex justify-between"><span>Matumizi ya Uendeshaji</span><span className="font-semibold text-red-600 tabular">-{money(ops)}</span></div>
          <div className="flex justify-between"><span>Matumizi ya Uwekezaji</span><span className="font-semibold text-red-600 tabular">-{money(inv)}</span></div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-bold"><span>Salio (Net)</span><span className={`tabular ${bal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{money(bal)}</span></div>
        </div>
      </div>

      <div className="card mb-4 overflow-x-auto">
        <h3 className="font-semibold mb-3">Orodha ya Wanachama na Hali</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b border-gray-200"><th className="py-2">Jina</th><th className="py-2 text-right">Anachopaswa</th><th className="py-2 text-right">Amelipa</th><th className="py-2 text-right">Deni</th><th className="py-2">Hali</th></tr></thead>
          <tbody>
            {s.members.map(m => {
              const exp = memberExpected(m, s.campaigns); const paid = memberPaid(m.id, s.payments)
              const st = memberStatus(m, s.campaigns, s.payments)
              return <tr key={m.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 font-medium">{m.fullName}</td>
                <td className="py-2 text-right tabular">{money(exp)}</td>
                <td className="py-2 text-right text-green-600 tabular">{money(paid)}</td>
                <td className="py-2 text-right text-red-600 tabular">{money(Math.max(0, exp - paid))}</td>
                <td className="py-2"><span className={`badge ${st === 'complete' ? 'bg-green-100 text-green-700' : st === 'owes' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{STATUS_SW[st]}</span></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-3">Mapato vs Matumizi</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b border-gray-200"><th className="py-2">Tarehe</th><th className="py-2">Maelezo</th><th className="py-2 text-right">Kiasi</th></tr></thead>
          <tbody>
            {s.payments.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(p => {
              const m = s.members.find(x => x.id === p.memberId)
              return <tr key={p.id} className="border-b border-gray-100 last:border-0"><td className="py-2">{p.date}</td><td className="py-2">Mapato — {m?.fullName || 'Mwanachama'}</td><td className="py-2 text-right text-green-600 tabular">+{money(p.amount)}</td></tr>
            })}
            {approved.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(e => (
              <tr key={e.id} className="border-b border-gray-100 last:border-0"><td className="py-2">{e.date}</td><td className="py-2">Matumizi — {e.title}</td><td className="py-2 text-right text-red-600 tabular">-{money(e.amount)}</td></tr>
            ))}
          </tbody>
        </table>
        {s.payments.length + approved.length === 0 && <p className="text-sm text-gray-500 py-4 text-center">Hakuna miamala bado.</p>}
      </div>

      <p className="text-xs text-gray-400 mt-4 no-print">Kidokezo: Tumia “Chapisha / PDF” kisha chagua “Save as PDF”. Faili za CSV zinafunguka kwenye Excel.</p>
    </div>
  )
}
