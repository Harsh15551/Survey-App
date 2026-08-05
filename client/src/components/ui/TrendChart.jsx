// Small dependency-free bar chart for daily activity trends. Each bar is
// hoverable (tooltip with exact value) and optionally clickable so dashboards
// can drill into a specific day.
export default function TrendChart({ data, height = 120, accent = false, onBarClick, emptyLabel = 'No activity in this period yet.' }) {
  const total = (data || []).reduce((sum, d) => sum + (d.value || 0), 0)
  const max = Math.max(...(data || []).map(d => d.value || 0), 1)

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-ink-400" style={{ height }}>
        {emptyLabel}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100
          const isEmpty = !d.value
          return (
            <button
              key={`${d.label}-${i}`}
              type="button"
              disabled={!onBarClick}
              onClick={() => onBarClick?.(d, i)}
              title={`${d.fullLabel || d.label}: ${d.value} survey${d.value === 1 ? '' : 's'}`}
              className={`group relative flex-1 min-w-[4px] rounded-t transition-all ${
                isEmpty ? 'bg-ink-100' : accent ? 'bg-clay-400 hover:bg-clay-500' : 'bg-ink-700 hover:bg-ink-800'
              } ${onBarClick ? 'cursor-pointer' : 'cursor-default'}`}
              style={{ height: `${Math.max(pct, isEmpty ? 3 : 6)}%` }}
            >
              <span className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {d.value} · {d.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wide text-ink-400">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}
