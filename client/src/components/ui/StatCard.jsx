export default function StatCard({ label, value, sublabel, accent = false }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${accent ? 'text-clay-500' : 'text-ink-900'}`}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-ink-400">{sublabel}</p>}
    </div>
  )
}
