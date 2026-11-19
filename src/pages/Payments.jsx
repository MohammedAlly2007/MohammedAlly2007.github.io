import { useState, useRef } from 'react'
import { useStore, setState, genId, money, auditLog, totalCollected, memberExpected, cloudDelete } from '../store'
import { Plus, X, Trash2, Upload, Search, Wallet, CalendarDays } from 'lucide-react'
import { showToast } from '../components/Toast'
import { confirmAction } from '../components/ConfirmModal'

const emptyForm = () => ({ memberId: '', campaignId: '', amount: 0, date: new Date().toISOString().slice(0, 10), note: '' })

export default function Payments({ canEdit }) {
  const s = useStore()
  const [show, setShow] = useState(false)
  const [filterMember, setFilterMember] = useState('')
  const [filterCampaign, setFilterCampaign] = useState('')
  const [q, setQ] = useState('')
  const [receipt, setReceipt] = useState('')
  const fileRef = useRef()
  const [form, setForm] = useState(emptyForm())

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 1.5 * 1024 * 1024) { showToast('Picha iwe chini ya 1.5MB', 'error'); return }
    const r = new FileReader()
    r.onload = () => setReceipt(r.result)
    r.readAsDataURL(f)
  }

  const save = () => {
    const amount = Number(form.amount)
    if (!form.memberId) return showToast('Chagua mwanachama', 'error')
    if (!amount || amount <= 0) return showToast('Weka kiasi sahihi', 'error')
    const member = s.members.find(m => m.id === form.memberId)
    setState(prev => ({
      ...prev,
      payments: [...prev.payments, {
        id: genId('p'), memberId: form.memberId, campaignId: form.campaignId || null,
        amount, date: form.date, note: form.note, receiptUrl: receipt,
        recordedBy: prev.session?.name || 'Mfumo', createdAt: new Date().toISOString()
      }]
    }))
    setShow(false); setReceipt('')
    setForm(emptyForm())
    auditLog('Rekodi malipo', `${member?.fullName || ''} — ${amount} TZS`)
    showToast(`Malipo ya ${money(amount)} yamerekodiwa`, 'success')
  }

  const remove = async (id) => {
    if (!(await confirmAction('Futa malipo haya? Salio la mfuko litabadilika.'))) return
    setState(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== id) }))
    cloudDelete('board_payments', id)
    auditLog('Futa malipo', id)
    showToast('Malipo yamefutwa', 'success')
  }

  const filtered = s.payments
    .filter(p => !filterMember || p.memberId === filterMember)
    .filter(p => !filterCampaign || (filterCampaign === 'general' ? !p.campaignId : p.campaignId === filterCampaign))
    .filter(p => {
      if (!q) return true
      const m = s.members.find(x => x.id === p.memberId)
      return (m?.fullName || '').toLowerCase().includes(q.toLowerCase()) || (p.note || '').toLowerCase().includes(q.toLowerCase())
    })

  const total = totalCollected(s.payments)
  const month = new Date().toISOString().slice(0, 7)
  const thisMonth = totalCollected(s.payments.filter(p => String(p.date).slice(0, 7) === month))
  const selectedMember = form.memberId ? s.members.find(m => m.id === form.memberId) : null
  const expected = selectedMember ? memberExpected(selectedMember, s.campaigns) : 0
  const already = selectedMember ? s.payments.filter(p => p.memberId === selectedMember.id).reduce((x, p) => x + Number(p.amount || 0), 0) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Malipo / Michango Inayoingia</h2>
          <p className="text-xs text-gray-500">{s.payments.length} malipo yamerekodiwa</p>
        </div>
        {canEdit && <button onClick={() => setShow(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Rekodi Malipo</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><Wallet size={18} className="text-green-600" /></div>
          <div><div className="text-xs text-gray-500">Jumla iliyokusanywa</div><div className="font-bold text-green-600 tabular">{money(total)}</div></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center"><CalendarDays size={18} className="text-primary-700" /></div>
          <div><div className="text-xs text-gray-500">Mwezi huu</div><div className="font-bold text-primary-700 tabular">{money(thisMonth)}</div></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Tafuta mwanachama..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterMember} onChange={e => setFilterMember(e.target.value)}>
          <option value="">Wanachama wote</option>
          {s.members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
        </select>
        <select className="input w-auto" value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}>
          <option value="">Michango yote</option>
          <option value="general">Mfuko Mkuu</option>
          {s.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2">Tarehe</th>
              <th className="py-2">Mwanachama</th>
              <th className="py-2 hidden md:table-cell">Mchango</th>
              <th className="py-2 text-right">Kiasi</th>
              <th className="py-2 hidden sm:table-cell">Risiti</th>
              <th className="py-2 hidden lg:table-cell">Imerekodiwa na</th>
              {canEdit && <th className="py-2">Vitendo</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.slice().reverse().map(p => {
              const m = s.members.find(x => x.id === p.memberId)
              const c = s.campaigns.find(x => x.id === p.campaignId)
              return (
                <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                  <td className="py-2.5">{p.date}</td>
                  <td className="py-2.5 font-medium">{m?.fullName || '-'}</td>
                  <td className="py-2.5 hidden md:table-cell">{c ? c.name : 'Mfuko Mkuu'}</td>
                  <td className="py-2.5 text-right text-green-600 font-semibold tabular">{money(p.amount)}</td>
                  <td className="py-2.5 hidden sm:table-cell">{p.receiptUrl ? <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-primary-600 underline text-xs">Fungua</a> : '-'}</td>
                  <td className="py-2.5 hidden lg:table-cell text-xs text-gray-500">{p.recordedBy}</td>
                  {canEdit && <td className="py-2.5"><button onClick={() => remove(p.id)} className="text-red-600 hover:text-red-800" aria-label="Futa malipo"><Trash2 size={16} /></button></td>}
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">{s.payments.length ? 'Hakuna malipo yanayolingana na kichujio.' : 'Hakuna malipo bado.'}</p>}
      </div>

      {show && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40 p-4" onMouseDown={() => setShow(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto animate-scaleIn" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Rekodi Malipo</h3>
              <button onClick={() => setShow(false)} aria-label="Funga"><X /></button>
            </div>
            <div className="space-y-3">
              <select className="input" value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}>
                <option value="">Chagua mwanachama *</option>
                {s.members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
              {selectedMember && (
                <p className="text-[11px] text-gray-500">Anachopaswa: <strong>{money(expected)}</strong> · Amelipa: <strong>{money(already)}</strong> · Deni: <strong className="text-red-600">{money(Math.max(0, expected - already))}</strong></p>
              )}
              <select className="input" value={form.campaignId} onChange={e => setForm({ ...form, campaignId: e.target.value })}>
                <option value="">Mfuko Mkuu (general)</option>
                {s.campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="input" type="number" min="0" placeholder="Kiasi (TZS) *" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Maelezo" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              <div>
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center gap-2 w-full justify-center"><Upload size={16} /> {receipt ? 'Badilisha risiti' : 'Ambatanisha risiti (hiari)'}</button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                {receipt && <img src={receipt} alt="risiti" className="mt-2 h-20 rounded-lg object-cover" />}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save} className="btn-primary flex-1">Hifadhi</button>
              <button onClick={() => { setShow(false); setReceipt('') }} className="btn-secondary flex-1">Ghairi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
