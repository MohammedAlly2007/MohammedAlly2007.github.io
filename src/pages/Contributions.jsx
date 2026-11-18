import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, setState, genId, money, auditLog } from '../store'
import { Plus, X, Trash2, Edit2, Target, CalendarDays } from 'lucide-react'
import { showToast } from '../components/Toast'
import { confirmAction } from '../components/ConfirmModal'

const EMPTY = { name: '', purpose: '', targetAmount: 0, perMemberAmount: 0, startDate: '', dueDate: '' }

export default function Contributions({ canEdit }) {
  const s = useStore()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const openNew = () => { setEditing(null); setForm(EMPTY); setShow(true) }
  const openEdit = (c) => { setEditing(c.id); setForm({ name: c.name, purpose: c.purpose || '', targetAmount: c.targetAmount, perMemberAmount: c.perMemberAmount, startDate: c.startDate || '', dueDate: c.dueDate || '' }); setShow(true) }

  const save = () => {
    if (!form.name.trim()) return showToast('Jina linahitajika', 'error')
    const target = Number(form.targetAmount) || 0
    const per = Number(form.perMemberAmount) || 0
    if (target <= 0 && per <= 0) return showToast('Weka lengo au kiasi kwa mwanachama', 'error')
    setState(prev => ({
      ...prev,
      campaigns: editing
        ? prev.campaigns.map(c => c.id === editing ? { ...c, ...form, name: form.name.trim(), targetAmount: target, perMemberAmount: per } : c)
        : [...prev.campaigns, { id: genId('c'), ...form, name: form.name.trim(), targetAmount: target, perMemberAmount: per, status: 'active', createdAt: new Date().toISOString() }]
    }))
    auditLog(editing ? 'Hariri mchango' : 'Mchango mpya', form.name)
    setShow(false); setForm(EMPTY); setEditing(null)
    showToast('Mchango umehifadhiwa', 'success')
  }

  const remove = async (c) => {
    const count = s.payments.filter(p => p.campaignId === c.id).length
    if (!(await confirmAction(count ? `Futa mchango "${c.name}"? Malipo ${count} yatabaki kama mchango wa mfuko mkuu.` : `Futa mchango "${c.name}"?`))) return
    setState(prev => ({ ...prev, campaigns: prev.campaigns.filter(x => x.id !== c.id) }))
    auditLog('Futa mchango', c.name)
    showToast('Mchango umefutwa', 'success')
  }

  const totalTarget = s.campaigns.reduce((x, c) => x + Number(c.targetAmount || 0), 0)
  const totalPaid = s.payments.filter(p => p.campaignId).reduce((x, p) => x + Number(p.amount || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Michango ya Maalum</h2>
          <p className="text-xs text-gray-500">{s.campaigns.length} kampeni · {money(totalPaid)} imekusanywa kati ya {money(totalTarget)}</p>
        </div>
        {canEdit && <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Mchango Mpya</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {s.campaigns.map(c => {
          const paid = s.payments.filter(p => p.campaignId === c.id).reduce((x, p) => x + Number(p.amount), 0)
          const pct = c.targetAmount ? Math.min(100, Math.round(paid / c.targetAmount * 100)) : 0
          const contributors = new Set(s.payments.filter(p => p.campaignId === c.id).map(p => p.memberId)).size
          return (
            <div key={c.id} className="card">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold flex items-center gap-1.5"><Target size={16} className="text-primary-600 shrink-0" /> {c.name}</h3>
                  <p className="text-sm text-gray-500">{c.purpose || '—'}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(c)} className="text-gray-500 hover:text-gray-800" aria-label="Hariri"><Edit2 size={15} /></button>
                    <button onClick={() => remove(c)} className="text-red-600 hover:text-red-800" aria-label="Futa"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
              <div className="mt-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Lengo</span><span className="font-semibold tabular">{money(c.targetAmount)}</span></div>
                <div className="flex justify-between"><span>Kwa kila mwanachama</span><span className="font-semibold tabular">{money(c.perMemberAmount)}</span></div>
                <div className="flex justify-between"><span>Imekusanywa</span><span className="font-semibold text-green-600 tabular">{money(paid)}</span></div>
                <div className="flex justify-between"><span>Wachangiaji</span><span className="font-semibold">{contributors}</span></div>
                <div className="flex justify-between"><span className="flex items-center gap-1"><CalendarDays size={13} /> Mwisho</span><span>{c.dueDate || '-'}</span></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-primary-600 h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between items-center mt-1">
                <Link to="/payments" className="text-[11px] text-primary-600 underline">Angalia malipo</Link>
                <span className="text-xs text-gray-500">{pct}%</span>
              </div>
            </div>
          )
        })}
        {s.campaigns.length === 0 && <p className="text-gray-500">Hakuna michango maalum bado.</p>}
      </div>

      {show && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40 p-4" onMouseDown={() => setShow(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto animate-scaleIn" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editing ? 'Hariri Mchango' : 'Mchango Mpya'}</h3>
              <button onClick={() => setShow(false)} aria-label="Funga"><X /></button>
            </div>
            <div className="space-y-3">
              <input className="input" placeholder="Jina la mchango *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input" placeholder="Kusudi" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
              <input className="input" type="number" min="0" placeholder="Lengo (TZS)" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} />
              <input className="input" type="number" min="0" placeholder="Kwa kila mwanachama (TZS)" value={form.perMemberAmount} onChange={e => setForm({ ...form, perMemberAmount: e.target.value })} />
              <div>
                <label className="text-xs text-gray-500">Tarehe ya kuanza</label>
                <input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Mwisho</label>
                <input className="input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save} className="btn-primary flex-1">Hifadhi</button>
              <button onClick={() => setShow(false)} className="btn-secondary flex-1">Ghairi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
