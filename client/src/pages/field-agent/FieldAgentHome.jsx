import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import TrendChart from '../../components/ui/TrendChart'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { getHouseholdsByAgent } from '../../api/households'
import { timeAgo } from '../../utils/timeAgo'

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function buildTrend(surveys, days = 14) {
  const buckets = []
  const today = startOfDay(new Date())
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    buckets.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      value: 0
    })
  }
  const byKey = Object.fromEntries(buckets.map(b => [b.key, b]))
  for (const s of surveys) {
    if (!s.createdAt) continue
    const key = startOfDay(s.createdAt).toISOString().slice(0, 10)
    if (byKey[key]) byKey[key].value += 1
  }
  return buckets
}

function computeStreak(surveys) {
  const daysWithSurveys = new Set(surveys.filter(s => s.createdAt).map(s => startOfDay(s.createdAt).toISOString().slice(0, 10)))
  let streak = 0
  const cursor = startOfDay(new Date())
  if (!daysWithSurveys.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (daysWithSurveys.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function FieldAgentHome() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHouseholdsByAgent(user.id)
      .then(res => setSurveys((res.data || res || []).map(h => ({ ...h, houseId: h.houseCode, status: (h.status || '').toLowerCase() }))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user.id])

  const today = useMemo(() => surveys.filter(h => h.createdAt && startOfDay(h.createdAt).getTime() === startOfDay(new Date()).getTime()), [surveys])
  const flagged = useMemo(() => surveys.filter(h => h.status === 'flagged'), [surveys])
  const verifiedCount = surveys.length - flagged.length
  const trend = useMemo(() => buildTrend(surveys, 14), [surveys])
  const streak = useMemo(() => computeStreak(surveys), [surveys])
  const recent = useMemo(
    () => [...surveys].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [surveys]
  )

  if (loading) {
    return (
      <>
        <TopBar title={`${t('fieldHome.welcome')}, ${user.name.split(' ')[0]}`} subtitle={t('common.loading')} />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">{t('common.loading')}</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title={`${t('fieldHome.welcome')}, ${user.name.split(' ')[0]}`} subtitle={user.region} />
      <main className="flex-1 space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={t('fieldHome.totalSurveyed')} value={surveys.length} accent to="/field/my-surveys" icon="ti-home" />
          <StatCard label={t('fieldHome.surveyedToday')} value={today.length} icon="ti-calendar-event" />
          <StatCard
            label={`${streak || 0} ${t('fieldHome.streak')}`}
            value={streak > 0 ? '🔥' : '—'}
            sublabel={t('fieldHome.streakDesc')}
            icon="ti-flame"
          />
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-semibold text-ink-900">{t('fieldHome.activity14d')}</h2>
            <div className="flex shrink-0 items-center gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />{t('fieldHome.verified')} {verifiedCount}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />{t('fieldHome.flagged')} {flagged.length}</span>
            </div>
          </div>
          <TrendChart data={trend} accent />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link to="/field/new-survey" className="card group flex items-center gap-4 p-6 transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-500">
              <i className="ti ti-clipboard-plus text-2xl" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">{t('fieldHome.startNew')}</p>
              <p className="text-sm text-ink-500">{t('fieldHome.startNewDesc')}</p>
            </div>
          </Link>

          <Link to="/field/my-surveys" className="card group flex items-center gap-4 p-6 transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
              <i className="ti ti-list-details text-2xl" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">{t('nav.mySurveys')}</p>
              <p className="text-sm text-ink-500">{t('fieldHome.mySurveysDesc')}</p>
            </div>
          </Link>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="font-semibold text-ink-900">{t('fieldHome.recentSurveys')}</h2>
          </div>
          <div className="divide-y divide-ink-100">
            {recent.map(h => (
              <Link
                key={h.houseId}
                to={`/field/edit/${h.houseId}`}
                className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-ink-50/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{h.headName}</p>
                  <p className="truncate text-xs text-ink-400">#{h.houseId} · {h.district}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge status={h.status} />
                  <span className="w-14 text-right text-xs text-ink-400">{timeAgo(h.createdAt)}</span>
                </div>
              </Link>
            ))}
            {recent.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-ink-400">{t('fieldHome.noRecentSurveys')}</p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
