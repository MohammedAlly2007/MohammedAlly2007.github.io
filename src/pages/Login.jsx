import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../store'
import {
  Eye, EyeOff, ShieldCheck, Wallet, BarChart3, Users, Lock, ArrowRight,
  Sparkles, TrendingUp, MessageSquare, CheckCircle2,
} from 'lucide-react'

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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#131a3a] to-[#07202b]" />
        <div className="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-indigo-600/40 blur-[110px] animate-floatSlow" />
        <div className="absolute top-1/4 -right-24 w-[22rem] h-[22rem] rounded-full bg-cyan-500/30 blur-[110px] animate-floatSlow" style={{ animationDelay: '2.5s' }} />
        <div className="absolute -bottom-32 left-1/3 w-[24rem] h-[24rem] rounded-full bg-fuchsia-600/25 blur-[120px] animate-floatSlow" style={{ animationDelay: '5s' }} />
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '46px 46px' }} />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_1fr] rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10 animate-scaleIn backdrop-blur-xl bg-white/5">
        {/* ---------- brand panel ---------- */}
        <div className="relative hidden lg:flex flex-col justify-between p-9 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/70 via-blue-700/55 to-cyan-500/40" />
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl animate-floatSlow" />
          <div className="absolute -left-12 bottom-8 w-44 h-44 rounded-full bg-cyan-300/20 blur-2xl animate-float" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 via-blue-400 to-cyan-300 flex items-center justify-center font-black text-xl shadow-xl shadow-indigo-950/40 animate-pulseRing">S</div>
              <div>
                <h1 className="font-extrabold text-xl leading-tight tracking-tight">SmartSoko</h1>
                <p className="text-[11px] text-indigo-100/80 flex items-center gap-1"><Sparkles size={10} /> Fedha za Bodi</p>
              </div>
            </div>

            <h2 className="mt-10 text-[1.7rem] font-extrabold leading-snug tracking-tight">
              Usimamizi wa kisasa<br />wa fedha za bodi.
            </h2>
            <p className="text-sm text-indigo-100/80 mt-2 max-w-xs">
              Michango, malipo, matumizi, bajeti, ripoti na mawasiliano — vyote mahali pamoja.
            </p>

            <div className="mt-7 space-y-2.5">
              {[
                { icon: Wallet, t: 'Fuatilia michango na madeni kwa urahisi' },
                { icon: TrendingUp, t: 'Ripoti na uchambuzi wa fedha papo kwa papo' },
                { icon: Users, t: 'Nafasi za CFO, Mhasibu, CEO na Mwanachama' },
                { icon: MessageSquare, t: 'Live Chat kwa mawasiliano ya bodi' },
              ].map(({ icon: Icon, t }, i) => (
                <div key={t} className="flex items-center gap-3 text-sm text-indigo-50/90 animate-slideUp" style={{ animationDelay: `${i * 0.1 + 0.15}s` }}>
                  <span className="w-8 h-8 rounded-xl bg-white/12 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur">
                    <Icon size={15} className="text-cyan-200" />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8">
            <div className="flex items-center gap-2 text-[11px] text-indigo-100/70 bg-white/8 border border-white/15 rounded-xl px-3 py-2 backdrop-blur w-fit">
              <ShieldCheck size={13} className="text-emerald-300" /> Data inalindwa na kuhifadhiwa kwa usalama
            </div>
            <p className="text-[10px] text-indigo-100/50 mt-3">© {new Date().getFullYear()} SmartSoko. Haki zote zimehifadhiwa.</p>
          </div>
        </div>

        {/* ---------- form panel ---------- */}
        <div className="relative bg-white/95 backdrop-blur-2xl p-7 sm:p-9">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white flex items-center justify-center font-black shadow-lg">S</div>
            <span className="font-extrabold text-lg tracking-tight">SmartSoko</span>
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1">
              <Lock size={10} /> Karibu tena
            </span>
            <h2 className="text-2xl font-extrabold text-navy-900 mt-3 tracking-tight">Ingia kwenye akaunti yako</h2>
            <p className="text-sm text-gray-500 mt-1">Weka barua pepe na nenosiri lako ili kuendelea.</p>
          </div>

          {err && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm animate-slideUp flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" /> {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Barua pepe</label>
              <input type="email" required autoComplete="username" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input !py-3" placeholder="barua@email.com" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nenosiri</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required autoComplete="current-password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input !py-3 pr-11" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition p-1 rounded-lg hover:bg-indigo-50"
                  aria-label={showPw ? 'Ficha nenosiri' : 'Onyesha nenosiri'}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy}
              className="btn-primary w-full !py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-60">
              {busy ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Inaingia...</>
              ) : (
                <>Ingia <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-2">
            <div className="divider flex-1" />
            <span className="text-[10px] text-gray-400">AU</span>
            <div className="divider flex-1" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: CheckCircle2, t: 'Salama' },
              { icon: ShieldCheck, t: 'Binafsi' },
              { icon: Users, t: 'Pamoja' },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="flex flex-col items-center gap-1 rounded-xl border border-gray-100 bg-gray-50/70 py-2.5 text-[10px] text-gray-500">
                <Icon size={14} className="text-indigo-500" /> {t}
              </div>
            ))}
          </div>

          <div className="mt-5 text-[11px] text-gray-400 text-center flex items-center justify-center gap-1.5">
            <Lock size={11} /> Akaunti zinatolewa na msimamizi (CFO).
          </div>
        </div>
      </div>
    </div>
  )
}
