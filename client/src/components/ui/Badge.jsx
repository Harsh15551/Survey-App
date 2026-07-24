const STYLES = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  flagged: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-ink-100 text-ink-500 border-ink-200',
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  default: 'bg-ink-100 text-ink-600 border-ink-200'
}

export default function Badge({ status, children }) {
  const cls = STYLES[status] || STYLES.default
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {children || status}
    </span>
  )
}
