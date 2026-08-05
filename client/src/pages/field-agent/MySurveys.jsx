import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { useAuth } from '../../context/AuthContext'
import { getHouseholdsByAgent } from '../../api/households'
import { getOptions } from '../../api/reference'
import { useLanguage } from '../../context/LanguageContext'

export default function MySurveys() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [surveys, setSurveys] = useState([])
  const [familySizeBands, setFamilySizeBands] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  
  // Pagination & Search States
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 10

  // Fetch data from server when page or search query changes
  useEffect(() => {
    setLoading(true)
    Promise.all([
      getHouseholdsByAgent(user.id, { page, limit, search: query }),
      getOptions()
    ])
      .then(([res, opts]) => {
        const dataList = res.data || res.households || []
        setSurveys(dataList.map(h => ({
          ...h,
          houseId: h.houseCode,
          status: (h.status || '').toLowerCase()
        })))
        setTotalItems(res.pagination?.total ?? dataList.length)
        setTotalPages(res.pagination?.totalPages ?? Math.ceil((res.pagination?.total || dataList.length) / limit))
        setFamilySizeBands(opts.familySizeBands || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user.id, page, query])

  function familyLabel(bandId) {
    return familySizeBands.find(b => b.id === bandId)?.label || bandId || '—'
  }

  function handleSearchChange(e) {
    setQuery(e.target.value)
    setPage(1) // Reset page to 1 when search filters change
  }

  if (loading && surveys.length === 0) {
    return (
      <>
        <TopBar title={t('nav.mySurveys')} subtitle={t('common.loading')} />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">{t('common.loading')}</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title={t('nav.mySurveys')} subtitle={`${totalItems} ${t('survey.households')} ${t('survey.today')}`} />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center gap-3">
          <input
            className="field-input max-w-sm"
            placeholder={t('mySurveys.search')}
            value={query}
            onChange={handleSearchChange}
          />
          {loading && <i className="ti ti-loader animate-spin text-ink-400 text-lg" aria-hidden="true" />}
        </div>

        <div className="card divide-y divide-ink-100 overflow-hidden">
          {surveys.map(h => (
            <Link
              key={h.houseId}
              to={`/field/edit/${h.houseCode}`}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-ink-50/60"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm text-ink-400">#{h.houseId}</p>
                <p className="truncate font-medium text-ink-900">{h.headName}</p>
                <p className="truncate text-sm text-ink-500">
                  {h.villageName ? `${h.villageName} · ` : ''}{h.taluk}, {h.district} · {t('mySurveys.familyOf')} {familyLabel(h.familySizeBand)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {h.createdAt && (
                  <span className="hidden text-xs text-ink-400 sm:block">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </span>
                )}
                <Badge status={h.status} />
                <i className="ti ti-chevron-right text-ink-300" aria-hidden="true" />
              </div>
            </Link>
          ))}
          {surveys.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-400">{t('mySurveys.none')}</p>
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={setPage}
        />
      </main>
    </>
  )
}
