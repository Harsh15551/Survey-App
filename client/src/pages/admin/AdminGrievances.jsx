import { useEffect, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { getGrievances, updateGrievance } from '../../api/grievances'
import { exportGrievancesToCsv, exportGrievancesToPdf } from '../../utils/exportData'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminGrievances() {
  const { t } = useLanguage()
  const [grievances, setGrievances] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Tabs & Filters
  const [tab, setTab] = useState('OPEN') // OPEN, RESOLVED, ALL
  const [query, setQuery] = useState('')

  // Pagination states
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 10

  // Quick count states
  const [counts, setCounts] = useState({ OPEN: 0, RESOLVED: 0, ALL: 0 })

  const [selected, setSelected] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  // Load paginated data & stats from server when page/filters change
  useEffect(() => {
    setLoading(true)
    const params = {
      page,
      limit,
      status: tab === 'ALL' ? 'all' : tab,
      search: query
    }

    Promise.all([
      getGrievances(params),
      // Fetch totals separately by ignoring status tab
      getGrievances({ ...params, limit: 1, status: 'OPEN' }),
      getGrievances({ ...params, limit: 1, status: 'RESOLVED' }),
      getGrievances({ ...params, limit: 1, status: 'all' })
    ])
      .then(([res, openRes, resRes, allRes]) => {
        const dataList = res.data || res.grievances || []
        setGrievances(dataList.map(g => {
          const hh = g.household || {}
          return {
            ...g,
            headName: hh.headName || '—',
            district: hh.district || '',
            taluk: hh.taluk || '',
            wardPanchayat: hh.wardPanchayat || '',
            fieldAgentName: hh.fieldAgent?.name || '—',
            phone: hh.phone || '—'
          }
        }))
        setTotalItems(res.pagination?.total ?? dataList.length)
        setTotalPages(res.pagination?.totalPages ?? Math.ceil((res.pagination?.total || dataList.length) / limit))

        setCounts({
          OPEN: openRes.pagination?.total || 0,
          RESOLVED: resRes.pagination?.total || 0,
          ALL: allRes.pagination?.total || 0
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tab, query, page])

  const TABS = [
    { key: 'OPEN', label: t('survey.notResolved'), countKey: 'OPEN' },
    { key: 'RESOLVED', label: t('survey.resolved'), countKey: 'RESOLVED' },
    { key: 'ALL', label: t('survey.total'), countKey: 'ALL' }
  ]

  function handleSearchChange(val) {
    setQuery(val)
    setPage(1)
  }

  async function toggleStatus(g) {
    setUpdatingId(g.id)
    try {
      const nextStatus = g.status === 'OPEN' ? 'RESOLVED' : 'OPEN'
      await updateGrievance(g.id, { status: nextStatus })
      
      // Reload current page slice
      const res = await getGrievances({
        page,
        limit,
        status: tab === 'ALL' ? 'all' : tab,
        search: query
      })
      const dataList = res.data || res.grievances || []
      setGrievances(dataList.map(item => {
        const hh = item.household || {}
        return {
          ...item,
          headName: hh.headName || '—',
          district: hh.district || '',
          taluk: hh.taluk || '',
          wardPanchayat: hh.wardPanchayat || '',
          fieldAgentName: hh.fieldAgent?.name || '—',
          phone: hh.phone || '—'
        }
      }))
      setTotalItems(res.pagination?.total ?? dataList.length)
      setTotalPages(res.pagination?.totalPages ?? Math.ceil((res.pagination?.total || dataList.length) / limit))

      setSelected(sel => (sel && sel.id === g.id ? { ...sel, status: nextStatus } : sel))
    } catch (err) {
      alert('Failed to update grievance: ' + err.message)
    }
    setUpdatingId(null)
  }

  // Fetch full matching records for export
  async function triggerExport(type) {
    try {
      const res = await getGrievances({
        limit: 1000,
        status: tab === 'ALL' ? 'all' : tab,
        search: query
      })
      const dataList = res.data || res.grievances || []
      const list = dataList.map(g => {
        const hh = g.household || {}
        return {
          ...g,
          headName: hh.headName || '—',
          district: hh.district || '',
          taluk: hh.taluk || '',
          wardPanchayat: hh.wardPanchayat || '',
          fieldAgentName: hh.fieldAgent?.name || '—'
        }
      })
      if (type === 'csv') exportGrievancesToCsv(list, 'admin-grievances-export.csv')
      else exportGrievancesToPdf(list)
    } catch (err) {
      alert('Export failed: ' + err.message)
    }
  }

  return (
    <>
      <TopBar title={t('nav.grievances')} subtitle={`${counts.OPEN} ${t('survey.notResolved')} · ${counts.RESOLVED} ${t('survey.resolved')}`} />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map(t2 => (
              <button
                key={t2.key}
                onClick={() => { setTab(t2.key); setPage(1); }}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-ring ${
                  tab === t2.key
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                {t2.label} <span className="ml-1 opacity-70">({counts[t2.countKey]})</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <input
                className="field-input max-w-xs"
                placeholder={t('mySurveys.search')}
                value={query}
                onChange={e => handleSearchChange(e.target.value)}
              />
              {loading && <i className="ti ti-loader animate-spin text-ink-400 text-lg" aria-hidden="true" />}
            </div>
            <div className="ml-auto flex gap-2">
              <button className="btn-secondary" onClick={() => triggerExport('csv')}>
                <i className="ti ti-file-spreadsheet text-base" aria-hidden="true" /> Export Excel
              </button>
              <button className="btn-secondary" onClick={() => triggerExport('pdf')}>
                <i className="ti ti-file-type-pdf text-base" aria-hidden="true" /> Export PDF
              </button>
            </div>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">House ID</th>
                <th className="px-4 py-3">Head name</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Grievance</th>
                <th className="px-4 py-3">Field agent</th>
                <th className="px-4 py-3">Raised on</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {grievances.map(g => (
                <tr key={g.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-mono text-ink-500">#{g.houseCode}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{g.headName}</td>
                  <td className="px-4 py-3 text-ink-600">{g.taluk ? `${g.taluk}, ${g.district}` : '—'}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-ink-600" title={g.message}>{g.message}</td>
                  <td className="px-4 py-3 text-ink-600">{g.fieldAgentName}</td>
                  <td className="px-4 py-3 text-ink-500">{new Date(g.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge status={g.status === 'OPEN' ? 'open' : 'resolved'}>
                      {g.status === 'OPEN' ? t('survey.notResolved') : t('survey.resolved')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button className="text-sm font-medium text-ink-700 hover:text-clay-500" onClick={() => setSelected(g)}>
                        View
                      </button>
                      <button
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                        disabled={updatingId === g.id}
                        onClick={() => toggleStatus(g)}
                      >
                        {g.status === 'OPEN' ? 'Mark resolved' : 'Reopen'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {grievances.length === 0 && !loading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-400">No grievances match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={setPage}
        />
      </main>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Grievance · House #${selected?.houseCode}`}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge status={selected.status === 'OPEN' ? 'open' : 'resolved'}>
                {selected.status === 'OPEN' ? t('survey.notResolved') : t('survey.resolved')}
              </Badge>
              <span className="text-xs text-ink-400">Raised {new Date(selected.createdAt).toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="field-label">Head of household</p>
                <p className="text-ink-800">{selected.headName}</p>
              </div>
              <div>
                <p className="field-label">Phone</p>
                <p className="text-ink-800">{selected.phone}</p>
              </div>
              <div>
                <p className="field-label">Location</p>
                <p className="text-ink-800">{selected.wardPanchayat ? `${selected.wardPanchayat}, ` : ''}{selected.taluk}, {selected.district}</p>
              </div>
              <div>
                <p className="field-label">Field agent</p>
                <p className="text-ink-800">{selected.fieldAgentName}</p>
              </div>
            </div>
            <div>
              <p className="field-label">Grievance message</p>
              <p className="rounded-lg bg-ink-50 p-3 text-sm text-ink-700">{selected.message}</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
              <button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>
              <button
                className="btn-primary"
                disabled={updatingId === selected.id}
                onClick={() => toggleStatus(selected)}
              >
                {selected.status === 'OPEN' ? 'Mark as resolved' : 'Reopen grievance'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
