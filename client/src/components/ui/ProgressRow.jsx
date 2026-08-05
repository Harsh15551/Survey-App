// A single "label ... value" row with a proportional bar underneath. Used for
// district/problem/status breakdowns across the admin & supervisor dashboards.
// Pass `onClick` to make the row interactive (e.g. drill into filtered data).
export default function ProgressRow({ label, count, max, colorClass = 'bg-ink-800', onClick, sublabel }) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-full text-left ${onClick ? 'group focus-ring cursor-pointer rounded-lg' : ''}`}
    >
      <div className="mb-1 flex justify-between text-sm">
        <span className={`text-ink-600 ${onClick ? 'group-hover:text-ink-900' : ''}`}>{label}</span>
        <span className={`text-ink-400 ${onClick ? 'group-hover:text-ink-600' : ''}`}>{sublabel ?? count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full rounded-full ${colorClass} transition-all group-hover:opacity-80`} style={{ width: `${pct}%` }} />
      </div>
    </Wrapper>
  )
}
