import { useState } from 'react'
import { useStore, setState, genId, hashPassword, auditLog, roleLabel as roleName, cloudDelete } from '../store'
import { Plus, Trash2, X, Download, Upload, KeyRound, ShieldCheck, Database, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import InstallApp from '../components/InstallApp'
import { showToast } from '../components/Toast'
import { confirmAction } from '../components/ConfirmModal'

const EMPTY_USER = { name: '', email: '', password: '', role: 'accountant', memberId: '' }

export default function Settings() {
  const s = useStore()
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY_USER)
  const [pwUser, setPwUser] = useState(null)
  const [newPw, setNewPw] = useState('')

  const addUser = async () => {
    if (!form.name.trim() || !form.email.trim()) return showToast('Jina na barua pepe vinahitajika', 'error')
    if (form.password.length < 6) return showToast('Nenosiri liwe na herufi 6 au zaidi', 'error')
    const exists = s.users.some(u => String(u.email).toLowerCase() === form.email.trim().toLowerCase())
    if (exists) return showToast('Barua pepe hii imetumika tayari', 'error')
    const h = await hashPassword(form.password)
    setState(prev => ({
      ...prev,
      users: [...prev.users, { id: genId('u'), name: form.name.trim(), email: form.email.trim(), role: form.role, passwordHash: h, memberId: form.memberId || null }]
    }))
    auditLog('Ongeza mtumiaji', `${form.name} (${roleName(form.role)})`)
    setShow(false)
    setForm(EMPTY_USER)
    showToast('Mtumiaji ameongezwa', 'success')
  }

  const removeUser = async (id) => {
    if (id === s.session?.userId) return showToast('Huwezi kufuta akaunti yako mwenyewe', 'error')
    const u = s.users.find(x => x.id === id)
    if (!(await confirmAction(`Futa mtumiaji ${u?.name || ''}?`))) return
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }))
    cloudDelete('board_users', id)
    auditLog('Futa mtumiaji', u?.name || id)
    showToast('Mtumiaji amefutwa', 'success')
  }

  const savePassword = async () => {
    if (!pwUser) return
    if (newPw.length < 6) return showToast('Nenosiri liwe na herufi 6 au zaidi', 'error')
    const h = await hashPassword(newPw)
    setState(prev => ({ ...prev, users: prev.users.map(u => u.id === pwUser.id ? { ...u, passwordHash: h } : u) }))
    auditLog('Badilisha nenosiri', pwUser.name)
    setPwUser(null); setNewPw('')
    showToast('Nenosiri limebadilishwa', 'success')
  }

  const backup = () => {
    const data = JSON.stringify(s, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `smartsoko-fedha-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
    auditLog('Backup data', 'JSON')
    showToast('Backup imepakuliwa', 'success')
  }

  const restore = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = async () => {
      try {
        const data = JSON.parse(r.result)
        if (!Array.isArray(data.members) || !Array.isArray(data.payments)) throw new Error('Faili si sahihi')
        if (!(await confirmAction('Badilisha data yote ya kifedha na backup hii? Watumiaji watabaki kama walivyo.'))) return
        setState(prev => ({
          ...prev,
          members: data.members || [],
          campaigns: data.campaigns || [],
          payments: data.payments || [],
          expenses: data.expenses || [],
          budgets: data.budgets || [],
          audit: data.audit || prev.audit || []
        }))
        auditLog('Restore backup', f.name)
        showToast('Data imerejeshwa kikamilifu', 'success')
      } catch (err) { showToast('Imeshindikana: ' + err.message, 'error') }
    }
    r.readAsText(f)
    e.target.value = ''
  }

  const clearAudit = async () => {
    if (!(await confirmAction('Futa kumbukumbu zote za audit log?'))) return
    setState(prev => ({ ...prev, audit: [] }))
    showToast('Audit log imesafishwa', 'success')
  }

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        gradient="from-slate-700 to-indigo-800"
        title="Mipangilio & Watumiaji"
        subtitle="Usimamizi wa akaunti, usalama na hifadhi ya data"
      />

      <InstallApp variant="card" className="mb-4" />

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-semibold flex items-center gap-2"><Users size={18} /> Watumiaji (User Roles)</h3>
          <button onClick={() => setShow(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Ongeza Mtumiaji</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b border-gray-200"><th className="py-2">Jina</th><th className="py-2">Barua pepe</th><th className="py-2">Nafasi</th><th className="py-2">Vitendo</th></tr></thead>
            <tbody>
              {s.users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2.5 font-medium">{u.name}</td>
                  <td className="py-2.5">{u.email}</td>
                  <td className="py-2.5"><span className={`badge ${u.role === 'cfo' ? 'bg-primary-100 text-primary-700' : u.role === 'member' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>{roleName(u.role)}</span></td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setPwUser(u); setNewPw('') }} className="text-primary-600 text-xs underline flex items-center gap-1"><KeyRound size={13} /> Nenosiri</button>
                      <button onClick={() => removeUser(u.id)} className="text-red-600 hover:text-red-800" aria-label="Futa mtumiaji"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3 flex items-start gap-1"><ShieldCheck size={14} className="mt-0.5 shrink-0" /> CFO anaweza kusimamia watumiaji; Mhasibu na CEO wanaweza kuingiza data ya kifedha; Mwanachama anaona taarifa zake tu.</p>
      </div>

      <div className="card mb-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Database size={18} /> Uhifadhi wa Data (Cloud — Hiari)</h3>
        <p className="text-sm text-gray-600 mb-3">
          Kwa chaguo-msingi data inahifadhiwa kwenye kivinjari hiki (localStorage) — bure, inafanya kazi bila mtandao,
          na haitegemei akaunti yoyote. Data haisambazi kati ya vifaa.
        </p>
        <p className="text-sm text-gray-600 mb-3">
          Kwa hifadhi ya wingu ya bure (cross-device), tumia <strong>Supabase Free Tier</strong> (500MB DB, 50k watumiaji,
          bure kabisa): (1) tengeneza akaunti bure kwenye supabase.com, (2) tengeneza project, (3) SQL Editor → Run faili
          <code className="bg-gray-100 px-1 rounded text-xs">supabase/migrations/015_board_finance.sql</code>, (4) weka hapa chini:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="input" placeholder="Supabase URL (https://xxxx.supabase.co)" defaultValue={localStorage.getItem('sb_url') || 'https://tbtjukggjjqjgwrwkqrb.supabase.co'} onChange={e => localStorage.setItem('sb_url', e.target.value)} />
          <input className="input" placeholder="Supabase Anon Key" defaultValue={localStorage.getItem('sb_key') || 'sb_publishable_5iWpaaSkJIpczjZXCfJm9Q_DmE3_gPP'} onChange={e => localStorage.setItem('sb_key', e.target.value)} />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button onClick={async () => {
            const url = (localStorage.getItem('sb_url') || '').trim().replace(/\/$/, '')
            const key = (localStorage.getItem('sb_key') || '').trim()
            if (!url || !key) return showToast('Weka URL na Anon Key kwanza', 'error')
            try {
              const r = await fetch(url + '/rest/v1/', { headers: { apikey: key, Authorization: 'Bearer ' + key } })
              if (r.ok || r.status === 404) showToast('Uunganisho wa Supabase umefanikiwa ✓', 'success')
              else showToast('Imeshindikana: HTTP ' + r.status, 'error')
            } catch (e) { showToast('Hitilafu ya mtandao: ' + e.message, 'error') }
          }} className="btn-secondary text-sm flex items-center gap-1.5">Jaribu Uunganisho</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">* Muhimu: hakikisha unapakua backup mara kwa mara. LocalStorage haisambazi data kati ya vifaa.</p>
      </div>

      <div className="card mb-4">
        <h3 className="font-semibold mb-3">Backup & Restore</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={backup} className="btn-secondary flex items-center gap-2"><Download size={16} /> Pakua Backup (JSON)</button>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer"><Upload size={16} /> Restore Backup<input type="file" accept="application/json,.json" className="hidden" onChange={restore} /></label>
        </div>
        <p className="text-xs text-gray-500 mt-2">Backup inahifadhi wanachama, michango, malipo, matumizi, bajeti na audit log.</p>
      </div>

      <div className="card border-red-200">
        <h3 className="font-semibold mb-2 text-red-600">Eneo la Hatari</h3>
        <p className="text-xs text-gray-500 mb-3">Vitendo hivi haviwezi kutenduliwa.</p>
        <button onClick={clearAudit} className="btn-danger text-sm">Safisha Audit Log</button>
      </div>

      {show && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40 p-4" onMouseDown={() => setShow(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto animate-scaleIn" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Mtumiaji Mpya</h3>
              <button onClick={() => setShow(false)} aria-label="Funga"><X /></button>
            </div>
            <div className="space-y-3">
              <input className="input" placeholder="Jina kamili *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input" type="email" placeholder="Barua pepe *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="input" type="password" placeholder="Nenosiri (herufi 6+) *" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="cfo">CFO (Super Admin)</option>
                <option value="accountant">Mhasibu (Accountant)</option>
                <option value="ceo">CEO / Mkurugenzi (Fedha)</option>
                <option value="member">Mwanachama</option>
              </select>
              <select className="input" value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}>
                <option value="">— Hakuna mwanachama —</option>
                {s.members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={addUser} className="btn-primary flex-1">Hifadhi</button>
              <button onClick={() => setShow(false)} className="btn-secondary flex-1">Ghairi</button>
            </div>
          </div>
        </div>
      )}

      {pwUser && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-40 p-4" onMouseDown={() => setPwUser(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scaleIn" onMouseDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Badilisha Nenosiri</h3>
              <button onClick={() => setPwUser(null)} aria-label="Funga"><X /></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Mtumiaji: <strong>{pwUser.name}</strong></p>
            <input className="input" type="password" autoFocus placeholder="Nenosiri jipya (herufi 6+)" value={newPw} onChange={e => setNewPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && savePassword()} />
            <div className="flex gap-2 mt-4">
              <button onClick={savePassword} className="btn-primary flex-1">Hifadhi</button>
              <button onClick={() => setPwUser(null)} className="btn-secondary flex-1">Ghairi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}