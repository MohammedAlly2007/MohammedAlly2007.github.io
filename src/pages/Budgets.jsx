import { useState } from 'react'
import { useStore, setState, genId, money, auditLog, expensesInPeriod, cloudDelete, EXPENSE_CATEGORIES, categoryLabel } from '../store'
import { Plus, X, Trash2, Edit2, PieChart } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { showToast } from '../components/Toast'
import { confirmAction } from '../components/ConfirmModal'

const CATS = EXPENSE_CATEGORIES
const EMPTY = { category: 'operations', amount: 0, period: 'monthly', note: '' }

export default function Budgets({ canEdit }) {
  const s = useStore()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const openNew = () => { setEditing(null); setForm(EMPTY); setShow(true) }
  const openEdit = (b) => { setEditing(b.id); setForm({ category: b.category, amount: b.amount, period: b.period, note: b.note || '' }); setShow(true) }

  const save = () => {
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return showToast('Kiasi sahihi kinahitajika', 'error')
    setState(prev => {
      const budgets = editing
        ? (prev.budgets || []).map(b => b.id === editing ? { ...b, ...form, amount } : b)
        : [...(prev.budgets || []), { id: genId('b'), ...form, amount, createdAt: new Date().toISOString() }]
      return { ...prev, budgets }
    })
    auditLog(editing ? 'Hariri bajeti' : 'Ongeza bajeti', `${form.category} ${amount}`)
    setShow(false); setForm(EMPTY); setEditing(null)
    showToast('Bajeti imehifadhiwa', 'success')
  }

  const remove = async (id) => {
    if (!(await confirmAction('Futa bajeti hii?'))) return
    setState(prev => ({ ...prev, budgets: (prev.budgets || []).filter(b => b.id !== id) }))
    cloudDelete('board_budgets', id)
    auditLog('Futa bajeti', id)
    showToast('Bajeti imefutwa', 'success')
  }

  const budgets = s.budgets || []
  const totalBudget = budgets.reduce((x, b) => x + Number(b.amount || 0), 0)

  return (
    <div>
      <PageHeader
        icon={PieChart}
        gradient="from-amber-500 to-orange-600"
        title="Bajeti (Budgets)"
        subtitle="Fuatilia matumizi dhidi ya bajeti iliyopangwa"
        actions={canEdit ? <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Bajeti Mpya</button> : null}
      />

      {budgets.length > 0 && (
        <div className="card mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center"><PieChart size={18} className="text-primary-700" /></div>
          <div>
            <div className="text-xs text-gray-500">Jumla ya bajeti zilizopangwa</div>
            <div className="font-bold text-primary-700 tabular">{money(totalBudget)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map(b => {
          const spent = expensesInPeriod(s.expenses, b.period)
            .filter(e => e.category === b.category)
            .reduce((x, e) => x + Number(e.amount), 0)
          const pct = b.amount ? Math.min(100, Math.round(spent / Number(b.amount) * 100)) : 0
          const over = spent > Number(b.amount)
          return (
            <div key={b.id} className={`card ${over ? 'border-red-300' : ''}`}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold">{categoryLabel(b.category)}</h3>
                  <p className="text-xs text-gray-500">{b.period === 'monthly' ? 'Kwa mwezi huu' : 'Kwa mwaka huu'} {b.note && `— ${b.note}`}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(b)} className="text-gray-500 hover:text-gray-800" aria-label="Hariri bajeti"><Edit2 size={15} /></button>
                    <button onClick={() => remove(b.id)} className="text-red-600 hover:text-red-800" aria-label="Futa bajeti"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
              <div className="mt-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Bajeti</span><span className="font-semibold tabular">{money(b.amount)}</span></div>
                <div className="flex justify-between"><span>Imetumika</span><span className={`font-semibold tabular ${over ? 'text-red-600' : 'text-green-600'}`}>{money(spent)}</span></div>
                <div className="flex justify-between"><span>Iliyobaki</span><span className={`font-semibold tabular ${over ? 'text-red-600' : ''}`}>{money(Math.max(0, Number(b.amount) - spent))}</span></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className={`${over ? 'bg-red-600' : 'bg-primary-600'} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
              <div className={`text-xs mt-1 text-right ${over ? 'text-red-600 font-bold' : 'text-gray-500'}`}>{pct}% {over && '— IMEZIDI!'}</div>
            </div>
          )
        })}
        {budgets.length === 0 && <p className="text-gray-500">Hakuna bajeti. Ongeza bajeti kudhibiti matumizi.</p>}
      </div>

      {show && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40 p-4" onMouseDown={() => setShow(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scaleIn" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">{editing ? 'Hariri Bajeti' : 'Bajeti Mpya'}</h3><button onClick={() => setShow(false)} aria-label="Funga"><X /></button></div>
            <div className="space-y-3">
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
              <select className="input" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}>
                <option value="monthly">Kwa mwezi</option><option value="yearly">Kwa mwaka</option>
              </select>
              <input className="input" type="number" min="0" placeholder="Kiasi (TZS)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              <input className="input" placeholder="Maelezo (hiari)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4"><button onClick={save} className="btn-primary flex-1">Hifadhi</button><button onClick={() => setShow(false)} className="btn-secondary flex-1">Ghairi</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
