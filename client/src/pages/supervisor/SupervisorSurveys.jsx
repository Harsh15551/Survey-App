import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'
import { getHouseholdsBySupervisor } from '../../api/households'

export default function SupervisorSurveys() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    getHouseholdsBySupervisor(user.id)
      .then(res => setSurveys((res.data || res || []).map(h => ({
        ...h,
        houseId: h.houseCode,
        status: (h.status || '').toLowerCase(),
        agentName: h.fieldAgent?.name || 'Unknown'
      }))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user.id])

  const filtered = surveys.filter(h =>
    (h.houseId || '').includes(query) ||
    (h.headName || '').toLowerCase().includes(query.toLowerCase()) ||
    (h.agentName || '').toLowerCase().includes(query.toLowerCase())
  )

  if (loading) {
    return (
      <>
        <TopBar title="Team surveys" subtitle="Loading…" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">Loading surveys…</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title="Team surveys" subtitle={`${filtered.length} household${filtered.length === 1 ? '' : 's'} surveyed by team`} />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <input
          className="field-input max-w-sm"
          placeholder="Search by house code, head name, or agent"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">House code</th>
                <th className="px-4 py-3">Head name</th>
                <th className="px-4 py-3">District / Taluk</th>
                <th className="px-4 py-3">Field agent</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map(h => (
                <tr key={h.houseCode} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">#{h.houseId}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{h.headName}</td>
                  <td className="px-4 py-3 text-ink-600">{h.taluk}, {h.district}</td>
                  <td className="px-4 py-3 text-ink-600">{h.agentName}</td>
                  <td className="px-4 py-3 text-ink-500">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3"><Badge status={h.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-400">No surveys found.</p>
          )}
        </div>
      </main>
    </>
  )
}
