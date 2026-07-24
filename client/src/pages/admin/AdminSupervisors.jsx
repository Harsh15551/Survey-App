import { useEffect, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import { getSupervisorHierarchy } from '../../api/dashboard'

function SupervisorCard({ supervisor }) {
  const [expanded, setExpanded] = useState(false)
  const agents = supervisor.agents || []
  const totalHouseholds = agents.reduce((sum, a) => sum + (a.householdCount || 0), 0)
  const activeAgents = agents.filter(a => a.status?.toLowerCase() === 'active').length

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-ink-50/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-sm font-semibold text-ink-700">
            {supervisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink-900">{supervisor.name}</p>
              <Badge status={supervisor.status?.toLowerCase()} />
            </div>
            <p className="text-sm text-ink-500">{supervisor.region}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-semibold text-ink-900">{agents.length}</p>
              <p className="text-xs text-ink-400">Agents</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-ink-900">{activeAgents}</p>
              <p className="text-xs text-ink-400">Active</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-ink-900">{totalHouseholds}</p>
              <p className="text-xs text-ink-400">Households</p>
            </div>
          </div>
          <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'} text-lg text-ink-400`} aria-hidden="true" />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-ink-100">
          <div className="px-5 py-3 bg-ink-50/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Field agents under this supervisor</p>
          </div>

          {agents.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <i className="ti ti-users text-3xl text-ink-200" aria-hidden="true" />
              <p className="mt-2 text-sm text-ink-400">No field agents assigned yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between px-5 py-3 hover:bg-ink-50/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${agent.status?.toLowerCase() === 'active' ? 'bg-green-400' : 'bg-ink-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-ink-800">{agent.name}</p>
                      <p className="text-xs text-ink-400">{agent.region} · {agent.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-ink-600">
                      <span className="font-semibold text-ink-800">{agent.householdCount || 0}</span> households
                    </span>
                    <Badge status={agent.status?.toLowerCase()} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-ink-100 px-5 py-3 bg-ink-50/30 flex items-center gap-4 text-xs text-ink-400">
            <span><i className="ti ti-phone mr-1" aria-hidden="true" />{supervisor.phone}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminSupervisors() {
  const [supervisors, setSupervisors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSupervisorHierarchy()
      .then(res => setSupervisors(res.data || res || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalAgents = supervisors.reduce((sum, s) => sum + (s.agents?.length || 0), 0)

  if (loading) {
    return (
      <>
        <TopBar title="Supervisors" subtitle="Loading…" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">Loading supervisor hierarchy…</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title="Supervisors" subtitle={`${supervisors.length} supervisor${supervisors.length === 1 ? '' : 's'} · ${totalAgents} agent${totalAgents === 1 ? '' : 's'}`} />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        {supervisors.length === 0 ? (
          <div className="card p-12 text-center">
            <i className="ti ti-user-shield text-4xl text-ink-200" aria-hidden="true" />
            <p className="mt-3 text-ink-400">No supervisors found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {supervisors.map(s => (
              <SupervisorCard key={s.id} supervisor={s} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
