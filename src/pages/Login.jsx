import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../store'
import { Eye, EyeOff, ShieldCheck, Wallet, BarChart3, Users, Lock } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: localStorage.getItem('ssbf_last_email') || '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const r = await login(form.email, form.password)
    setBusy(false)
    if (r.ok) {
      localStorage.setItem('ssbf_last_email', form.email)
      navigate('/')
    } else setErr(r.error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-navy-900 via-primary-900 to-navy-800">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 animate-scaleIn">
        {/* Brand panel */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary-500/20" />
          <div className="absolute -left-10 bottom-10 w-32 h-32 rounded-full bg-primary-400/10" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center font-black text-xl shadow-lg">S</div>
              <div>
                <h1 className="font-bold text-xl leading-tight">SmartSoko</h1>
                <p className="text-xs text-gray-300">Fedha za Bodi</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold leading-snug mb-2">Usimamizi wa kisasa wa fedha za bodi.</h2>
            <p className="text-sm text-gray-300">Michango, malipo, matumizi, bajeti na ripoti — mahali pamoja.</p>
          </div>
          <div className="relative space-y-3 mt-8">
            <div className="flex items-center gap-2 text-sm text-gray-200"><Wallet size={16} className="text-primary-300" /> Kufuatilia michango na madeni</div>
            <div className="flex items-center gap-2 text-sm text-gray-200"><BarChart3 size={16} className="text-primary-300" /> Ripoti na uchambuzi wa fedha</div>
            <div className="flex items-center gap-2 text-sm text-gray-200"><Users size={16} className="text-primary-300" /> Nafasi za CFO, Mhasibu, CEO na Mwanachama</div>
            <div className="flex items-center gap-2 text-sm text-gray-200"><ShieldCheck size={16} className="text-primary-300" /> Usalama na kumbukumbu za mabadiliko</div>
          </div>
          <p className="relative text-[11px] text-gray-400 mt-8">© {new Date().getFullYear()} SmartSoko. Mfumo unamilikiwa na SmartSoko.</p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          <div className="text-center md:text-left mb-6">
            <div className="md:hidden flex items-center justify-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-black">S</div>
              <span className="font-bold text-lg">SmartSoko</span>
            </div>
            <h2 className="text-2xl font-bold text-navy-900">Karibu tena</h2>
            <p className="text-gray-500 text-sm mt-1">Ingia kwenye akaunti yako ya mfumo</p>
          </div>

          {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-slideUp">{err}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barua pepe</label>
              <input type="email" required autoComplete="username" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="barua@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nenosiri</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required autoComplete="current-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPw ? 'Ficha nenosiri' : 'Onyesha nenosiri'}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Inaingia...' : 'Ingia'}</button>
          </form>

          <div className="mt-6 text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
            <Lock size={12} /> Akaunti zinatolewa na msimamizi (CFO). Wasiliana na msimamizi kwa msaada.
          </div>
        </div>
      </div>
    </div>
  )
}
