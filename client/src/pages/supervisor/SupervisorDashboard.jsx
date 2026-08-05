import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import TrendChart from '../../components/ui/TrendChart'
import { useAuth } from '../../context/AuthContext'
import { getTeamStats } from '../../api/dashboard'
import { timeAgo } from '../../utils/timeAgo'
import { useLanguage } from '../../context/LanguageContext'

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
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
        <TopBar title={t('nav.dashboard')} subtitle={t('common.loading')} />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">{t('common.loading')}</p>
        </main>
      </>
    )
  }

  const agents = stats?.agents || []
  const trend = stats?.trend || []
  const maxHouseholds = Math.max(...agents.map(a => a.householdCount || 0), 1)

  function viewAgentSurveys(agentId) {
    navigate(`/supervisor/surveys?fieldAgentId=${agentId}`)
  }

  return (
    <>
      <TopBar title={t('nav.dashboard')} subtitle={`${t('role.supervisor')} · ${user.region}`} />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t('nav.fieldAgents')} value={stats?.agentCount || 0} sublabel={`${stats?.activeAgentCount || 0} active`} accent to="/supervisor/team" icon="ti-users" />
          <StatCard label={t('fieldHome.totalSurveyed')} value={stats?.totalHouseholds || 0} to="/supervisor/surveys" icon="ti-home" />
          <StatCard label={t('survey.surveyedThisWeek')} value={stats?.last7Days || 0} sublabel={t('survey.vsPrev7Days')} delta={stats?.weekOverWeekPct} icon="ti-calendar-stats" />
          <StatCard label={t('fieldHome.surveyedToday')} value={stats?.todayCount || 0} sublabel={`${stats?.openGrievances || 0} ${t('survey.notResolved')}`} to="/supervisor/surveys" icon="ti-clipboard-check" />
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">{t('fieldHome.activity14d')}</h2>
            <span className="text-xs text-ink-400">{t('survey.hoverForCount')}</span>
          </div>
          <TrendChart data={trend} accent />
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="font-semibold text-ink-900">{t('survey.fieldAgentActivity')}</h2>
            <p className="text-sm text-ink-500">{t('survey.clickRowToView')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3">{t('role.field_agent')}</th>
                  <th className="px-4 py-3">{t('survey.state')}</th>
                  <th className="px-4 py-3">{t('survey.total')}</th>
                  <th className="px-4 py-3">{t('survey.thisWeek')}</th>
                  <th className="px-4 py-3">{t('survey.today')}</th>
                  <th className="px-4 py-3">{t('survey.lastSubmission')}</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {agents.map(a => (
                  <tr
                    key={a.id}
                    onClick={() => viewAgentSurveys(a.id)}
                    className="cursor-pointer hover:bg-ink-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-ink-900">
                      <div className="flex items-center gap-2">
                        {a.name}
                        {a.flaggedCount > 0 && (
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            {a.flaggedCount} {t('survey.flaggedCount')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{a.region}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-full bg-ink-700" style={{ width: `${(a.householdCount / maxHouseholds) * 100}%` }} />
                        </div>
                        <span className="text-ink-600">{a.householdCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{a.weekCount || 0}</td>
                    <td className="px-4 py-3 text-ink-600">{a.todayCount || 0}</td>
                    <td className="px-4 py-3 text-ink-400">{a.lastSurveyAt ? timeAgo(a.lastSurveyAt) : t('survey.noSubmissionsYet')}</td>
                    <td className="px-4 py-3"><Badge status={a.status} /></td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-400">{t('mySurveys.none')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}
