import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore, setState, genId, money, memberStatus, memberPaid, memberExpected, auditLog, cloudDelete, initials } from '../store'
import PageHeader from '../components/PageHeader'
import { Plus, Edit2, Trash2, X, Eye, Upload, Download, Printer, Users as UsersIcon } from 'lucide-react'
import { showToast } from '../components/Toast'
import { confirmAction } from '../components/ConfirmModal'

const EMPTY = { fullName: '', phone: '', email: '', position: 'Mwanachama', requiredAmount: 500000, notes: '' }

// Minimal CSV parser: handles quoted fields, escaped quotes and CRLF.
function parseCSV(text) {
  const rows = []
  let row = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++ } else quoted = false
      } else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cur); cur = '' }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
    else if (ch !== '\r') cur += ch
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row) }
  return rows.filter(r => r.some(c => String(c).trim() !== ''))
}

export default function Members({ canEdit }) {
  const s = useStore()
  const location = useLocation()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState(null)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [q, setQ] = useState('')
  const fileRef = useRef(null)
  const handledFocus = useRef(null)

  // Global search can deep-link straight into a member's financial profile.
  useEffect(() => {
    const id = location.state?.focusMember
    if (id && handledFocus.current !== id && s.members.some(m => m.id === id)) {
      handledFocus.current = id
      setProfile(id)
    }
  }, [location.state, s.members])

  const importCSV = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      try {
        const rows = parseCSV(String(r.result || ''))
        if (!rows.length) return showToast('Faili haina data', 'error')
        const start = /jina|name/i.test(rows[0]?.[0] || '') ? 1 : 0
        let count = 0
        setState(prev => {
          const members = [...prev.members]
          for (let i = start; i < rows.length; i++) {
            const [fullName, phone, email, position, requiredAmount, notes] = rows[i]
            if (!fullName || !String(fullName).trim()) continue
            members.push({
              id: genId('m'), fullName: String(fullName).trim(), phone: (phone || '').trim(), email: (email || '').trim(),
              position: (position || 'Mwanachama').trim(), requiredAmount: Number(requiredAmount) || 0,
              notes: (notes || '').trim(), createdAt: new Date().toISOString()
            })
            count++
          }
          return { ...prev, members }
        })
        auditLog('Import CSV', `Wanachama ${count}`)
        showToast(count ? `Imeleta wanachama ${count}` : 'Hakuna mwanachama mpya', count ? 'success' : 'warn')
      } catch (err) { showToast('CSV si sahihi', 'error') }
    }
    r.readAsText(f)
    e.target.value = ''
  }

  const exportCSV = () => {
    const rows = [['Jina', 'Simu', 'Barua pepe', 'Nafasi', 'Anachopaswa', 'Amelipa', 'Deni', 'Hali']]
    s.members.forEach(m => {
      const exp = memberExpected(m, s.campaigns)
      const paid = memberPaid(m.id, s.payments)
      rows.push([m.fullName, m.phone, m.email, m.position, exp, paid, Math.max(0, exp - paid), memberStatus(m, s.campaigns, s.payments)])
    })
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'wanabodi-smartsoko.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const openNew = () => { setEditing(null); setForm(EMPTY); setShow(true) }
  const openEdit = (m) => { setEditing(m.id); setForm({ ...m, requiredAmount: m.requiredAmount }); setShow(true) }

  const save = () => {
    if (!form.fullName.trim()) return showToast('Jina linahitajika', 'error')
    setState(prev => {
      const members = editing
        ? prev.members.map(m => m.id === editing ? { ...m, ...form, fullName: form.fullName.trim(), requiredAmount: Number(form.requiredAmount) } : m)
        : [...prev.members, { id: genId('m'), ...form, fullName: form.fullName.trim(), requiredAmount: Number(form.requiredAmount), createdAt: new Date().toISOString() }]
      return { ...prev, members }
    })
    auditLog(editing ? 'Hariri mwanachama' : 'Ongeza mwanachama', form.fullName)
    setShow(false)
    showToast(editing ? 'Taarifa zimehaririwa' : 'Mwanachama ameongezwa', 'success')
  }

  const remove = async (id) => {
    const member = s.members.find(m => m.id === id)
    const count = s.payments.filter(p => p.memberId === id).length
    const msg = count
      ? `Futa ${member?.fullName}? Malipo ${count} yake yatafutwa pia.`
      : `Futa ${member?.fullName}?`
    if (!(await confirmAction(msg))) return
    setState(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id),
      payments: prev.payments.filter(p => p.memberId !== id)
    }))
    cloudDelete('board_members', id)
    cloudDelete('board_payments', s.payments.filter(p => p.memberId === id).map(p => p.id))
    auditLog('Futa mwanachama', member?.fullName || id)
    showToast('Mwanachama amefutwa', 'success')
  }

  const statusBadge = (st) => {
    if (st === 'complete') return <span className="badge bg-green-100 text-green-700">Amekamilisha</span>
    if (st === 'owes') return <span className="badge bg-amber-100 text-amber-700">Anadaiwa</span>
    return <span className="badge bg-red-100 text-red-700">Hajachangia</span>
  }

  const filteredMembers = s.members.filter(m =>
    !q || (m.fullName || '').toLowerCase().includes(q.toLowerCase()) ||
    (m.phone || '').includes(q) ||
    (m.email || '').toLowerCase().includes(q.toLowerCase()) ||
    (m.position || '').toLowerCase().includes(q.toLowerCase())
  )

  const profileMember = profile ? s.members.find(m => m.id === profile) : null
  const profilePayments = profileMember ? s.payments.filter(p => p.memberId === profileMember.id).slice().reverse() : []

  return (
    <div>
      <PageHeader
        icon={UsersIcon}
        gradient="from-indigo-500 to-violet-600"
        title="Wanabodi / Wanachama"
        subtitle={`${s.members.length} wanachama wameandikishwa`}
        badge={<span className="badge-soft bg-indigo-50 text-indigo-700 border-indigo-100">{s.members.length} jumla</span>}
        actions={<div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2"><Download size={16} /> CSV</button>
          {canEdit && <>
            <button onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center gap-2"><Upload size={16} /> Import CSV</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importCSV} />
            <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Ongeza</button>
          </>}
        </div>}
      />

      <div className="mb-3">
        <input className="input" placeholder="Tafuta kwa jina, simu, barua pepe au nafasi..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2">Jina</th>
              <th className="py-2 hidden sm:table-cell">Simu</th>
              <th className="py-2 hidden md:table-cell">Nafasi</th>
              <th className="py-2 text-right">Anachopaswa</th>
              <th className="py-2 text-right">Amelipa</th>
              <th className="py-2 text-right">Deni</th>
              <th className="py-2">Hali</th>
              <th className="py-2">Vitendo</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map(m => {
              const st = memberStatus(m, s.campaigns, s.payments)
              const paid = memberPaid(m.id, s.payments)
              const exp = memberExpected(m, s.campaigns)
              return (
                <tr key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                  <td className="py-2.5 font-medium">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-white/60">
                        {initials(m.fullName)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate">{m.fullName}</div>
                        <div className="text-[10px] text-gray-400 sm:hidden">{m.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 hidden sm:table-cell">{m.phone || '-'}</td>
                  <td className="py-2.5 hidden md:table-cell">{m.position}</td>
                  <td className="py-2.5 text-right tabular">{money(exp)}</td>
                  <td className="py-2.5 text-right text-green-600 tabular">{money(paid)}</td>
                  <td className="py-2.5 text-right text-red-600 tabular">{money(Math.max(0, exp - paid))}</td>
                  <td className="py-2.5">{statusBadge(st)}</td>
                  <td className="py-2.5">
                    <div className="flex gap-2">
                      <button onClick={() => setProfile(m.id)} className="text-primary-600 hover:text-primary-800" title="Wasifu wa kifedha" aria-label="Wasifu"><Eye size={16} /></button>
                      {canEdit && <>
                        <button onClick={() => openEdit(m)} className="text-gray-600 hover:text-gray-900" title="Hariri" aria-label="Hariri"><Edit2 size={16} /></button>
                        <button onClick={() => remove(m.id)} className="text-red-600 hover:text-red-800" title="Futa" aria-label="Futa"><Trash2 size={16} /></button>
                      </>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredMembers.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">{s.members.length ? 'Hakuna mwanachama anayelingana na utafutaji.' : 'Hakuna wanachama bado. Ongeza mwanachama au import CSV.'}</p>}
      </div>

      {profileMember && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40 p-4" onMouseDown={() => setProfile(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-auto animate-scaleIn" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Wasifu wa Kifedha — {profileMember.fullName}</h3>
              <button onClick={() => setProfile(null)} aria-label="Funga"><X /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-xs text-gray-500">Anachopaswa</div><div className="font-bold tabular">{money(memberExpected(profileMember, s.campaigns))}</div></div>
              <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-xs text-gray-500">Amelipa</div><div className="font-bold text-green-600 tabular">{money(memberPaid(profileMember.id, s.payments))}</div></div>
              <div className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-xs text-gray-500">Deni</div><div className="font-bold text-red-600 tabular">{money(Math.max(0, memberExpected(profileMember, s.campaigns) - memberPaid(profileMember.id, s.payments)))}</div></div>
            </div>
            <h4 className="font-semibold mb-2">Historia ya Malipo</h4>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b border-gray-200"><th className="py-2">Tarehe</th><th className="py-2">Mchango</th><th className="py-2 text-right">Kiasi</th><th className="py-2">Risiti</th></tr></thead>
              <tbody>
                {profilePayments.map(p => {
                  const c = s.campaigns.find(x => x.id === p.campaignId)
                  return <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2">{p.date}</td>
                    <td className="py-2">{c ? c.name : 'Mfuko Mkuu'}</td>
                    <td className="py-2 text-right text-green-600 tabular">{money(p.amount)}</td>
                    <td className="py-2">{p.receiptUrl ? <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-primary-600 underline text-xs">Fungua</a> : '-'}</td>
                  </tr>
                })}
              </tbody>
            </table>
            {profilePayments.length === 0 && <p className="text-sm text-gray-500 py-3">Hakuna malipo bado.</p>}
            <div className="mt-4 flex gap-2 flex-wrap no-print">
              <button onClick={() => window.open(`/statement/${profileMember.id}`, '_blank')} className="btn-primary flex items-center gap-2 text-xs"><Printer size={14} /> Taarifa Kamili / PDF</button>
              <button onClick={() => setProfile(null)} className="btn-secondary text-xs">Funga</button>
            </div>
            <div className="mt-4 text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-1">
              <p><strong>Simu:</strong> {profileMember.phone || '-'}</p>
              <p><strong>Barua pepe:</strong> {profileMember.email || '-'}</p>
              <p><strong>Nafasi:</strong> {profileMember.position || '-'}</p>
              <p><strong>Alijiunga:</strong> {profileMember.createdAt ? new Date(profileMember.createdAt).toLocaleDateString('sw-TZ') : '-'}</p>
              {profileMember.notes && <p className="sm:col-span-2"><strong>Maelezo:</strong> {profileMember.notes}</p>}
            </div>
          </div>
        </div>
      )}

      {show && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40 p-4" onMouseDown={() => setShow(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scaleIn" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editing ? 'Hariri Mwanachama' : 'Mwanachama Mpya'}</h3>
              <button onClick={() => setShow(false)} aria-label="Funga"><X /></button>
            </div>
            <div className="space-y-3">
              <input className="input" placeholder="Jina kamili *" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <input className="input" placeholder="Simu" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="input" type="email" placeholder="Barua pepe" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="input" placeholder="Nafasi" value={form.position || ''} onChange={e => setForm({ ...form, position: e.target.value })} />
              <input className="input" type="number" min="0" placeholder="Kiasi anachopaswa kuchangia" value={form.requiredAmount} onChange={e => setForm({ ...form, requiredAmount: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Maelezo" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
