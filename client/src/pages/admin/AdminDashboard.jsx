import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import ProgressRow from '../../components/ui/ProgressRow'
import TrendChart from '../../components/ui/TrendChart'
import { getDashboardStats } from '../../api/dashboard'
import { timeAgo } from '../../utils/timeAgo'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { t } = useLanguage()
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
        <TopBar title={t('nav.dashboard')} subtitle={t('common.loading')} />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">{t('common.loading')}</p>
        </main>
      </>
    )
  }

  if (!stats) {
    return (
      <>
        <TopBar title={t('nav.dashboard')} subtitle="Error" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-red-500">Failed to load dashboard data.</p>
        </main>
      </>
    )
  }

  const {
    totalHouseholds, flaggedHouseholds, activeAgents, totalAgents, openGrievances, resolvedGrievances,
    surveyedToday, last7Days, weekOverWeekPct, byDistrict, byProblem, trend, topAgents, recentActivity
  } = stats

  const maxDistrict = Math.max(...(byDistrict || []).map(d => d.count), 1)
  const maxProblem = Math.max(...(byProblem || []).map(p => p.count), 1)
  const maxAgentCount = Math.max(...(topAgents || []).map(a => a.householdCount), 1)
  const totalGrievances = openGrievances + resolvedGrievances

  function goToHouseholds(params) {
    const q = new URLSearchParams(params).toString()
    navigate(`/admin/households${q ? `?${q}` : ''}`)
  }

  return (
    <>
      <TopBar title={t('nav.dashboard')} subtitle={t('survey.dashboardSubtitle')} />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        {/* Headline numbers — each one links straight into the filtered data behind it */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('fieldHome.totalSurveyed')}
            value={totalHouseholds || 0}
            sublabel={`${surveyedToday} ${t('survey.today')}`}
            accent
            to="/admin/households"
            icon="ti-home"
          />
          <StatCard
            label={t('survey.surveyedThisWeek')}
            value={last7Days || 0}
            sublabel={t('survey.vsPrev7Days')}
            delta={weekOverWeekPct}
            icon="ti-calendar-stats"
          />
          <StatCard
            label={t('fieldHome.flagged')}
            value={flaggedHouseholds || 0}
            sublabel={t('survey.needsAttention')}
            to="/admin/households?status=FLAGGED"
            icon="ti-flag"
          />
          <StatCard
            label={t('survey.activeFieldAgents')}
            value={activeAgents || 0}
            sublabel={`${t('survey.of')} ${totalAgents} ${t('survey.total')}`}
            to="/admin/users"
            icon="ti-users"
          />
        </div>

        {/* Trend + grievances */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">{t('fieldHome.activity14d')}</h2>
              <span className="text-xs text-ink-400">{t('survey.hoverForCount')}</span>
            </div>
            <TrendChart data={trend} accent />
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink-900">{t('nav.grievances')}</h2>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-semibold tracking-tight text-clay-500">{openGrievances}</p>
              <p className="mb-1 text-sm text-ink-500">{t('survey.notResolved')}</p>
            </div>
            <div className="mt-4 space-y-3">
              <ProgressRow label={t('survey.notResolved')} count={openGrievances} max={totalGrievances || 1} colorClass="bg-amber-400" />
              <ProgressRow label={t('survey.resolved')} count={resolvedGrievances} max={totalGrievances || 1} colorClass="bg-emerald-500" />
            </div>
          </div>
        </div>

        {/* District & problem breakdowns — click through to filtered household lists */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink-900">{t('survey.coverageByDistrict')}</h2>
            <div className="space-y-4">
              {(byDistrict || []).map(d => (
                <ProgressRow
                  key={d.district}
                  label={d.district}
                  count={d.count}
                  max={maxDistrict}
                  sublabel={`${d.count} ${t('survey.households')}`}
                  colorClass="bg-ink-800"
                  onClick={() => goToHouseholds({ district: d.district })}
                />
              ))}
              {(!byDistrict || byDistrict.length === 0) && (
                <p className="py-4 text-center text-sm text-ink-400">{t('mySurveys.none')}</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink-900">{t('survey.mostReportedProblems')}</h2>
            <div className="space-y-4">
              {(byProblem || []).slice(0, 6).map(p => (
                <ProgressRow
                  key={p.id}
                  label={p.label}
                  count={p.count}
                  max={maxProblem}
                  colorClass="bg-clay-500"
                />
              ))}
              {(!byProblem || byProblem.length === 0) && (
                <p className="py-4 text-center text-sm text-ink-400">{t('survey.noIssues')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Field agent leaderboard + live activity feed */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">{t('survey.leaderboard')}</h2>
              <Link to="/admin/supervisors" className="text-xs font-medium text-clay-600 hover:underline">{t('survey.viewAll')}</Link>
            </div>
            <div className="space-y-1">
              {(topAgents || []).slice(0, 6).map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => goToHouseholds({ fieldAgentId: a.id })}
                  className="focus-ring group flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-ink-50"
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    i === 0 ? 'bg-clay-100 text-clay-700' : 'bg-ink-100 text-ink-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{a.name}</p>
                    <p className="truncate text-xs text-ink-400">{a.region} · {a.todayCount} {t('survey.today')}</p>
                  </div>
                  <div className="w-24 shrink-0">
                    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-ink-700 transition-all" style={{ width: `${(a.householdCount / maxAgentCount) * 100}%` }} />
                    </div>
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold text-ink-900">{a.householdCount}</span>
                </button>
              ))}
              {(!topAgents || topAgents.length === 0) && (
                <p className="py-4 text-center text-sm text-ink-400">{t('mySurveys.none')}</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink-900">{t('fieldHome.recentSurveys')}</h2>
            <div className="divide-y divide-ink-100">
              {(recentActivity || []).map(h => (
                <button
                  key={h.houseCode}
                  onClick={() => goToHouseholds({ search: h.houseCode })}
                  className="focus-ring group flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:bg-ink-50/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{h.headName}</p>
                    <p className="truncate text-xs text-ink-400">
                      #{h.houseCode} · {h.fieldAgentName} · {h.district}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge status={h.status?.toLowerCase()} />
                    <span className="w-14 text-right text-xs text-ink-400">{timeAgo(h.createdAt)}</span>
                  </div>
                </button>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <p className="py-4 text-center text-sm text-ink-400">{t('mySurveys.none')}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
