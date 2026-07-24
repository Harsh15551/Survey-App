import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import StatCard from '../../components/ui/StatCard'
import { useAuth } from '../../context/AuthContext'
import { getHouseholdsByAgent } from '../../api/households'

export default function FieldAgentHome() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHouseholdsByAgent(user.id)
      .then(res => setSurveys((res.data || res || []).map(h => ({ ...h, houseId: h.houseCode, status: (h.status || '').toLowerCase() }))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user.id])

  const today = surveys.filter(h => h.createdAt && new Date(h.createdAt).toDateString() === new Date().toDateString())

  if (loading) {
    return (
      <>
        <TopBar title={`Welcome, ${user.name.split(' ')[0]}`} subtitle="Loading…" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">Loading surveys…</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title={`Welcome, ${user.name.split(' ')[0]}`} subtitle={user.region} />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total households surveyed" value={surveys.length} accent />
          <StatCard label="Surveyed today" value={today.length} />
          <StatCard label="Flagged for correction" value={surveys.filter(h => h.status === 'flagged').length} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link to="/field/new-survey" className="card group flex items-center gap-4 p-6 transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-500">
              <i className="ti ti-clipboard-plus text-2xl" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">Start a new survey</p>
              <p className="text-sm text-ink-500">Fill in a new household's details</p>
            </div>
          </Link>

          <Link to="/field/my-surveys" className="card group flex items-center gap-4 p-6 transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
              <i className="ti ti-list-details text-2xl" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">My surveys</p>
              <p className="text-sm text-ink-500">Review households you've already surveyed</p>
            </div>
          </Link>
        </div>
      </main>
    </>
  )
}
