import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * A polished KPI tile with a gradient icon, optional trend and mini bars.
 * bars: number[] (0..1) rendered as a tiny sparkline.
 */
export default function StatCard({ label, value, hint, icon: Icon, gradient = 'from-indigo-500 to-blue-600', trend, bars, accent = 'text-indigo-600' }) {
  return (
    <div className="stat-card group">
      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] group-hover:opacity-[0.14] transition-opacity duration-300`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 truncate">{label}</p>
          <p className={`mt-1.5 text-xl sm:text-2xl font-extrabold tabular ${accent}`}>{value}</p>
          {hint && <p className="text-[11px] text-gray-400 mt-1 truncate">{hint}</p>}
        </div>
        <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
          {Icon ? <Icon size={20} /> : null}
        </div>
      </div>
      {(trend != null || (bars && bars.length > 2)) && (
        <div className="relative mt-3 flex items-end justify-between gap-2">
          {trend != null && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
          {bars && bars.length > 2 && (
            <div className="flex items-end gap-[3px] h-7 ml-auto">
              {bars.map((b, i) => (
                <span key={i}
                  className={`w-[5px] rounded-full bg-gradient-to-t ${gradient} opacity-70`}
                  style={{ height: `${Math.max(10, Math.round(b * 100))}%`, animation: `drawBar .7s ease ${i * 0.05}s both`, transformOrigin: 'bottom' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
