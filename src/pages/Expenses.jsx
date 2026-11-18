import { useState, useRef } from 'react'
import { useStore, setState, genId, money, auditLog, isApproved } from '../store'
import { Plus, X, Trash2, Upload, Check, Ban, Clock, Search } from 'lucide-react'
import { showToast } from '../components/Toast'
import { confirmAction } from '../components/ConfirmModal'

const CATS = [
  { value: 'operations', label: 'Ununuzi wa huduma/vifaa (uendeshaji)' },
  { value: 'investment', label: 'Uwekezaji / kukuza biashara' },
]

const EMPTY = { title: '', category: 'operations', amount: 0, date: new Date().toISOString().slice(0, 10), approvedBy: '', note: '' }

export default function Expenses({ canEdit }) {
  const s = useStore()
  const [show, setShow] = useState(false)
  const [receipt, setReceipt] = useState('')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const fileRef = useRef()
  const [form, setForm] = useState(EMPTY)

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
    if (!form.title.trim() || !amount || amount <= 0) return showToast('Kichwa na kiasi sahihi vinahitajika', 'error')
    setState(prev => ({
      ...prev,
      expenses: [...prev.expenses, {
        id: genId('e'), title: form.title.trim(), category: form.category, amount,
        date: form.date, approvedBy: '', note: form.note,
        receiptUrl: receipt, recordedBy: prev.session?.name || 'Mfumo', status: 'pending',
        createdAt: new Date().toISOString()
      }]
    }))
    setShow(false); setReceipt('')
    setForm(EMPTY)
    auditLog('Weka matumizi mapya', `${form.title} — ${amount} TZS`)
    showToast('Matumizi yamewasilishwa — yanasubiri idhini', 'success')
  }

  const approve = (e) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(x => x.id === e.id ? { ...x, status: 'approved', approvedBy: prev.session?.name || 'Mfumo', approvedAt: new Date().toISOString() } : x)
    }))
    auditLog('Idhinisha matumizi', `${e.title} — ${e.amount} TZS`)
    showToast('Matumizi yameidhinishwa', 'success')
  }

  const reject = (e) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(x => x.id === e.id ? { ...x, status: 'rejected', approvedBy: prev.session?.name || 'Mfumo', approvedAt: new Date().toISOString() } : x)
    }))
    auditLog('Kataa matumizi', `${e.title} — ${e.amount} TZS`)
    showToast('Matumizi yamekataliwa', 'warn')
  }

  const remove = async (id) => {
    if (!(await confirmAction('Futa matumizi haya?'))) return
    setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }))
    auditLog('Futa matumizi', id)
    showToast('Matumizi yamefutwa', 'success')
  }

  const catLabel = (v) => CATS.find(c => c.value === v)?.label || v
  const approvedTotal = s.expenses.filter(isApproved).reduce((x, e) => x + Number(e.amount || 0), 0)
  const pending = s.expenses.filter(e => e.status === 'pending')

  const rows = s.expenses
    .filter(e => status === 'all' ? true : (e.status || 'approved') === status)
    .filter(e => !q || (e.title || '').toLowerCase().includes(q.toLowerCase()) || (e.note || '').toLowerCase().includes(q.toLowerCase()))
    .slice().reverse()

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Matumizi (Pesa Zinazotoka)</h2>
          <p className="text-xs text-gray-500">Matumizi yanahesabika tu baada ya kuidhinishwa</p>
        </div>
        {canEdit && <button onClick={() => setShow(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Rekodi Matumizi</button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><Trash2 size={18} className="text-red-600" /></div>
          <div><div className="text-xs text-gray-500">Yaliyoidhinishwa</div><div className="font-bold text-red-600 tabular">{money(approvedTotal)}</div></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Clock size={18} className="text-amber-600" /></div>
          <div><div className="text-xs text-gray-500">Yanasubiri idhini</div><div className="font-bold text-amber-600 tabular">{pending.length} — {money(pending.reduce((x, e) => x + Number(e.amount || 0), 0))}</div></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center"><Ban size={18} className="text-primary-700" /></div>
          <div><div className="text-xs text-gray-500">Jumla ya rekodi</div><div className="font-bold tabular">{s.expenses.length}</div></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Tafuta matumizi..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">Hali zote</option>
          <option value="pending">Inasubiri</option>
          <option value="approved">Imeidhinishwa</option>
          <option value="rejected">Imekataliwa</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2">Tarehe</th>
              <th className="py-2">Kichwa</th>
              <th className="py-2 hidden md:table-cell">Aina</th>
              <th className="py-2 text-right">Kiasi</th>
              <th className="py-2 hidden sm:table-cell">Aliyeidhinisha</th>
              <th className="py-2">Hali</th>
              <th className="py-2 hidden sm:table-cell">Risiti</th>
              {canEdit && <th className="py-2">Vitendo</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(e => {
              const st = e.status || 'approved'
              return (
                <tr key={e.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                  <td className="py-2.5">{e.date}</td>
                  <td className="py-2.5 font-medium">{e.title}{e.note && <div className="text-[11px] text-gray-500 font-normal">{e.note}</div>}</td>
                  <td className="py-2.5 text-xs hidden md:table-cell">{catLabel(e.category)}</td>
                  <td className="py-2.5 text-right text-red-600 font-semibold tabular">{money(e.amount)}</td>
                  <td className="py-2.5 hidden sm:table-cell">{e.approvedBy || '-'}</td>
                  <td className="py-2.5"><span className={`badge ${st === 'approved' ? 'bg-green-100 text-green-700' : st === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{st === 'approved' ? 'Imeidhinishwa' : st === 'rejected' ? 'Imekataliwa' : 'Inasubiri'}</span></td>
                  <td className="py-2.5 hidden sm:table-cell">{e.receiptUrl ? <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="text-primary-600 underline text-xs">Fungua</a> : '-'}</td>
                  {canEdit && <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      {st !== 'approved' && <button onClick={() => approve(e)} className="text-green-600 hover:text-green-800" title="Idhinisha" aria-label="Idhinisha"><Check size={16} /></button>}
                      {st !== 'rejected' && <button onClick={() => reject(e)} className="text-amber-600 hover:text-amber-800" title="Kataa" aria-label="Kataa"><Ban size={16} /></button>}
                      <button onClick={() => remove(e.id)} className="text-red-600 hover:text-red-800" title="Futa" aria-label="Futa"><Trash2 size={16} /></button>
                    </div>
                  </td>}
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">{s.expenses.length ? 'Hakuna matumizi yanayolingana na kichujio.' : 'Hakuna matumizi bado.'}</p>}
      </div>

      {show && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40 p-4" onMouseDown={() => setShow(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto animate-scaleIn" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Rekodi Matumizi</h3>
              <button onClick={() => setShow(false)} aria-label="Funga"><X /></button>
            </div>
            <div className="space-y-3">
              <input className="input" placeholder="Kichwa cha matumizi *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
            <p className="text-[11px] text-gray-500 mt-3">Matumizi mapya yanaingia kwenye hali “Inasubiri” hadi yaidhinishwe.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={save} className="btn-primary flex-1">Wasilisha</button>
              <button onClick={() => { setShow(false); setReceipt('') }} className="btn-secondary flex-1">Ghairi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
