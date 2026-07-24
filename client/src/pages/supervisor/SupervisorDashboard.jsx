import { useEffect, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import StatCard from '../../components/ui/StatCard'
import { useAuth } from '../../context/AuthContext'
import { getTeamStats } from '../../api/dashboard'

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTeamStats()
      .then(res => setStats(res))
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

  const agents = stats?.agents || []
  const totalHouseholds = agents.reduce((sum, a) => sum + (a.householdCount || 0), 0)
  const todayCount = stats?.todayCount || 0

  return (
    <>
      <TopBar title="Dashboard" subtitle={`Team overview · ${user.region}`} />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Field agents supervised" value={agents.length} accent />
          <StatCard label="Households surveyed by team" value={totalHouseholds} />
          <StatCard label="Surveyed today" value={todayCount} />
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">Field agent</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Households surveyed</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {agents.map(a => (
                <tr key={a.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-900">{a.name}</td>
                  <td className="px-4 py-3 text-ink-600">{a.region}</td>
                  <td className="px-4 py-3 text-ink-600">{a.householdCount || 0}</td>
                  <td className="px-4 py-3 capitalize text-ink-600">{(a.status || '').toLowerCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
