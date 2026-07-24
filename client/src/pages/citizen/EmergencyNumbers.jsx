import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEmergencyNumbers } from '../../api/reference'

export default function EmergencyNumbers() {
  const [numbers, setNumbers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEmergencyNumbers()
      .then(res => setNumbers(res.data || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="flex items-center gap-3 bg-ink-900 px-4 py-4 text-white sm:px-8">
        <Link to="/citizen" className="text-ink-300 hover:text-white" aria-label="Back">
          <i className="ti ti-arrow-left text-xl" aria-hidden="true" />
        </Link>
        <p className="text-sm font-semibold">Emergency &amp; toll-free numbers</p>
      </header>

      <main className="mx-auto max-w-lg space-y-2 p-4 sm:p-8">
        {loading ? (
          <p className="py-8 text-center text-ink-400">Loading…</p>
        ) : (
          numbers.map(n => (
            <a
              key={n.label}
              href={`tel:${n.number.replace(/\D/g, '')}`}
              className="card flex items-center justify-between p-4 hover:shadow-md"
            >
              <div>
                <p className="font-medium text-ink-900">{n.label}</p>
                <p className="text-sm text-ink-500">{n.number}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <i className="ti ti-phone text-lg" aria-hidden="true" />
              </div>
            </a>
          ))
        )}
      </main>
    </div>
  )
}
