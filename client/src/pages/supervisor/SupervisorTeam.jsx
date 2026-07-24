import { useEffect, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { getTeamStats } from '../../api/dashboard'
import { getHouseholdsByAgent } from '../../api/households'

export default function SupervisorTeam() {
  const { user } = useAuth()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const [viewingHouseholds, setViewingHouseholds] = useState([])

  useEffect(() => {
    getTeamStats()
      .then(res => setAgents(res?.agents || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleViewActivity(agent) {
    setViewing(agent)
    try {
      const res = await getHouseholdsByAgent(agent.id)
      setViewingHouseholds((res.data || res || []).map(h => ({ ...h, houseId: h.houseCode })))
    } catch {
      setViewingHouseholds([])
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Field agents" subtitle="Loading…" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">Loading agents…</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title="Field agents" subtitle="Supervise activity and access for your team" />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {agents.map(a => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink-900">{a.name}</p>
                  <p className="text-sm text-ink-500">{a.region}</p>
                </div>
                <Badge status={(a.status || '').toLowerCase()} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-ink-900">{a.householdCount || 0}</p>
                  <p className="text-xs text-ink-400">households surveyed</p>
                </div>
                <button className="btn-secondary" onClick={() => handleViewActivity(a)}>View activity</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name} wide>
        {viewing && (
          <div className="space-y-3">
            {viewingHouseholds.map(h => (
              <div key={h.houseId} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                <div>
                  <p className="font-mono text-xs text-ink-400">#{h.houseId}</p>
                  <p className="text-sm font-medium text-ink-900">{h.headName}</p>
                </div>
                <p className="text-xs text-ink-400">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}</p>
              </div>
            ))}
            {viewingHouseholds.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-400">No submissions yet.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
