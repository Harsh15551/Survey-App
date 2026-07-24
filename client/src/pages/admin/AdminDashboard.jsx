import { useEffect, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import StatCard from '../../components/ui/StatCard'
import { getDashboardStats } from '../../api/dashboard'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Loading…" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">Loading dashboard…</p>
        </main>
      </>
    )
  }

  if (!stats) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Error" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-red-500">Failed to load dashboard data.</p>
        </main>
      </>
    )
  }

  const { totalHouseholds, flaggedHouseholds, activeAgents, openGrievances, byDistrict, byProblem } = stats
  const maxProblem = Math.max(...(byProblem || []).map(p => p.count), 1)

  return (
    <>
      <TopBar title="Dashboard" subtitle="All survey data across Gulbarga & Bidar" />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total households surveyed" value={totalHouseholds || 0} accent />
          <StatCard label="Flagged for review" value={flaggedHouseholds || 0} />
          <StatCard label="Active field agents" value={activeAgents || 0} />
          <StatCard label="Open citizen grievances" value={openGrievances || 0} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink-900">Coverage by district</h2>
            <div className="space-y-3">
              {(byDistrict || []).map(d => (
                <div key={d.district}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ink-600">{d.district}</span>
                    <span className="text-ink-400">{d.count} households</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-ink-800" style={{ width: `${totalHouseholds ? (d.count / totalHouseholds) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink-900">Most reported problems</h2>
            <div className="space-y-3">
              {(byProblem || []).slice(0, 6).map(p => (
                <div key={p.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ink-600">{p.label}</span>
                    <span className="text-ink-400">{p.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-clay-500" style={{ width: `${(p.count / maxProblem) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
