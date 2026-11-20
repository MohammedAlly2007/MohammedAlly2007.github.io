import { Wallet } from 'lucide-react'

/** Full-screen branded splash shown while the shared database loads. */
export default function Splash() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0b1220] via-[#111a33] to-[#07202b]">
      <div className="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-indigo-600/35 blur-[110px] animate-floatSlow" />
      <div className="absolute -bottom-28 -right-24 w-[24rem] h-[24rem] rounded-full bg-cyan-500/25 blur-[110px] animate-floatSlow" style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />

      <div className="relative flex flex-col items-center text-white px-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <span className="absolute inset-0 rounded-3xl border border-white/15 animate-ping" style={{ animationDuration: '2.4s' }} />
          <span className="absolute -inset-3 rounded-[2rem] border border-white/10" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-400 via-blue-500 to-cyan-300 flex items-center justify-center font-black text-3xl shadow-2xl shadow-indigo-950/50 animate-pop">
            S
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">SmartSoko</h1>
        <p className="text-[11px] uppercase tracking-[0.3em] text-indigo-200/70 mt-1 flex items-center gap-1.5">
          <Wallet size={11} /> Fedha za Bodi
        </p>

        <div className="mt-7 w-52 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-400 animate-gradient"
            style={{ backgroundSize: '220% 100%', animation: 'gradientMove 1.6s linear infinite' }} />
        </div>
        <p className="mt-3 text-xs text-indigo-100/70 animate-pulse">Inapakia data yako...</p>
      </div>
    </div>
  )
}
