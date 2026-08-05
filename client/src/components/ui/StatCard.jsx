import { Link } from 'react-router-dom'

// label/value/sublabel/accent keep their original meaning. New, optional:
// `to` wraps the card in a router Link, `onClick` makes it a button, `delta`
// shows a small up/down indicator (e.g. vs. yesterday), `icon` is a tabler
// icon class shown top-right.
export default function StatCard({ label, value, sublabel, accent = false, to, onClick, delta, icon }) {
  const interactive = Boolean(to || onClick)

  const content = (
    <div className={`card h-full p-5 ${interactive ? 'transition-shadow hover:shadow-md' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-ink-500">{label}</p>
        {icon && <i className={`ti ${icon} text-lg text-ink-300`} aria-hidden="true" />}
      </div>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${accent ? 'text-clay-500' : 'text-ink-900'}`}>
        {value}
      </p>
      {(sublabel || delta !== undefined) && (
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
          {delta !== undefined && delta !== 0 && (
            <span className={`inline-flex items-center gap-0.5 font-medium ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <i className={`ti ${delta > 0 ? 'ti-trending-up' : 'ti-trending-down'} text-xs`} aria-hidden="true" />
              {Math.abs(delta)}%
            </span>
          )}
          {sublabel}
        </p>
      )}
    </div>
  )

  if (to) return <Link to={to} className="focus-ring block h-full rounded-2xl">{content}</Link>
  if (onClick) return <button type="button" onClick={onClick} className="focus-ring block h-full w-full rounded-2xl text-left">{content}</button>
  return content
}
