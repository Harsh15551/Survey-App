import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'
import { getHouseholdsByAgent } from '../../api/households'

export default function MySurveys() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    getHouseholdsByAgent(user.id)
      .then(res => setSurveys((res.data || res || []).map(h => ({ ...h, houseId: h.houseCode, status: (h.status || '').toLowerCase() }))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user.id])

  const filtered = surveys.filter(h =>
    (h.houseId || '').includes(query) || (h.headName || '').toLowerCase().includes(query.toLowerCase())
  )

  if (loading) {
    return (
      <>
        <TopBar title="My surveys" subtitle="Loading…" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">Loading surveys…</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title="My surveys" subtitle={`${filtered.length} household${filtered.length === 1 ? '' : 's'} surveyed`} />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <input
          className="field-input max-w-sm"
          placeholder="Search by house ID or head name"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <div className="card divide-y divide-ink-100 overflow-hidden">
          {filtered.map(h => (
            <Link
              key={h.houseId}
              to={`/field/edit/${h.houseCode}`}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-ink-50/60"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm text-ink-400">#{h.houseId}</p>
                <p className="truncate font-medium text-ink-900">{h.headName}</p>
                <p className="text-sm text-ink-500">{h.taluk}, {h.district} · Family of {h.familySize}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={h.status} />
                <i className="ti ti-chevron-right text-ink-300" aria-hidden="true" />
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-400">No surveys found.</p>
          )}
        </div>
      </main>
    </>
  )
}

