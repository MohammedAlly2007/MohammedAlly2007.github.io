export default function PageHeader({ icon: Icon, title, subtitle, actions, gradient = 'from-indigo-500 to-blue-600', badge }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap mb-5 no-print">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pop`}>
            <Icon size={22} />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-navy-900 truncate">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
