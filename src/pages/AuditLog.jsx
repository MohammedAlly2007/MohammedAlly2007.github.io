import { useState } from 'react'
import { useStore, roleLabel } from '../store'
import { History, Search, Download } from 'lucide-react'

export default function AuditLog() {
  const s = useStore()
  const [q, setQ] = useState('')

  const rows = (s.audit || []).filter(a => !q || `${a.action} ${a.detail} ${a.user}`.toLowerCase().includes(q.toLowerCase()))

  const exportCSV = () => {
    const data = [['Tarehe/Saa', 'Mtumiaji', 'Nafasi', 'Hatua', 'Maelezo']]
    rows.forEach(a => data.push([new Date(a.at).toLocaleString('sw-TZ'), a.user, roleLabel(a.role), a.action, a.detail]))
    const csv = data.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'audit-log-smartsoko.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 flex items-center gap-2"><History size={22} /> Kumbukumbu za Mabadiliko</h2>
          <p className="text-xs text-gray-500">Nani alifanya nini na lini — rekodi {rows.length}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 w-56" placeholder="Tafuta..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-1.5 text-sm"><Download size={15} /> CSV</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500 border-b border-gray-200"><th className="py-2">Tarehe/Saa</th><th className="py-2">Mtumiaji</th><th className="py-2 hidden sm:table-cell">Nafasi</th><th className="py-2">Hatua</th><th className="py-2 hidden md:table-cell">Maelezo</th></tr></thead>
          <tbody>
            {rows.map(a => (
              <tr key={a.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 text-xs whitespace-nowrap">{new Date(a.at).toLocaleString('sw-TZ')}</td>
                <td className="py-2 font-medium">{a.user}</td>
                <td className="py-2 text-xs hidden sm:table-cell">{roleLabel(a.role)}</td>
                <td className="py-2">{a.action}</td>
                <td className="py-2 text-gray-600 hidden md:table-cell">{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">Hakuna rekodi {q ? 'zinazolingana na utafutaji' : 'bado'}.</p>}
      </div>
    </div>
  )
}
