import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { useAuth } from '../../context/AuthContext'
import { getHouseholdsBySupervisor, updateHousehold } from '../../api/households'
import { getOptions, getLocations } from '../../api/reference'
import { getTeamStats } from '../../api/dashboard'
import { exportHouseholdsToCsv, exportHouseholdsToPdf } from '../../utils/exportData'
import { useLanguage } from '../../context/LanguageContext'

const EMPTY_FILTERS = { query: '', district: 'all', taluka: 'all', fieldAgentId: 'all', status: 'all' }

export default function SupervisorSurveys() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [surveys, setSurveys] = useState([])
  const [fieldAgents, setFieldAgents] = useState([])
  const [districts, setDistricts] = useState([])
  const [options, setOptions] = useState({ problems: [], govtSchemes: [] })
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  
  // Pagination & Filters
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 10

  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    fieldAgentId: searchParams.get('fieldAgentId') || EMPTY_FILTERS.fieldAgentId,
    status: (searchParams.get('status') || EMPTY_FILTERS.status).toLowerCase()
  }))

  const [selected, setSelected] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  // Load team agents and static reference options once
  useEffect(() => {
    Promise.all([
      getTeamStats(),
      getOptions(),
      getLocations()
    ])
      .then(([statsRes, optRes, locRes]) => {
        setFieldAgents(statsRes?.agents || [])
        setOptions({
          problems: optRes.problems || [],
          govtSchemes: optRes.govtSchemes || []
        })
        setDistricts(locRes.districts || [])
      })
      .catch(console.error)
  }, [])

  // Load paginated data from server when page or filters change
  useEffect(() => {
    setLoading(true)
    getHouseholdsBySupervisor(user.id, {
      page,
      limit,
      search: filters.query,
      district: filters.district,
      taluk: filters.taluka,
      status: filters.status,
      fieldAgentId: filters.fieldAgentId
    })
      .then(res => {
        const dataList = res.data || res.households || []
        setSurveys(dataList.map(h => ({
          ...h,
          houseId: h.houseCode,
          status: (h.status || '').toLowerCase(),
          agentName: h.fieldAgent?.name || 'Unknown'
        })))
        setTotalItems(res.pagination?.total ?? dataList.length)
        setTotalPages(res.pagination?.totalPages ?? Math.ceil((res.pagination?.total || dataList.length) / limit))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user.id, page, filters])

  function setFilter(key, value) {
    setFilters(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'district') { next.taluka = 'all' }
      return next
    })
    setPage(1) // Reset page on filter change
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const talukaOptions = useMemo(() => {
    if (filters.district === 'all') {
      return [...new Set(districts.flatMap(d => d.taluks))].sort()
    }
    return districts.find(d => d.name === filters.district)?.taluks || []
  }, [districts, filters.district])

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== EMPTY_FILTERS[k]).length

  function optionLabels(ids, opts) {
    return (ids || []).map(id => opts.find(o => o.id === id)?.label || id)
  }

  function openView(h) {
    setSelected(h)
    setEditDraft({ ...h })
  }

  async function saveEdit() {
    setSaving(true)
    try {
      await updateHousehold(editDraft.houseCode || editDraft.houseId, {
        status: editDraft.status?.toUpperCase(),
        grievanceDescription: editDraft.grievanceDescription || null
      })
      // Reload current page
      const res = await getHouseholdsBySupervisor(user.id, {
        page,
        limit,
        search: filters.query,
        district: filters.district,
        taluk: filters.taluka,
        status: filters.status,
        fieldAgentId: filters.fieldAgentId
      })
      const dataList = res.data || res.households || []
      setSurveys(dataList.map(h => ({
        ...h,
        houseId: h.houseCode,
        status: (h.status || '').toLowerCase(),
        agentName: h.fieldAgent?.name || 'Unknown'
      })))
      setTotalItems(res.total || dataList.length)
      setTotalPages(res.totalPages || Math.ceil((res.total || dataList.length) / limit))
      setSelected(null)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    }
    setSaving(false)
  }

  // Exports fetch full matching records (or current page)
  async function triggerExport(type) {
    try {
      const res = await getHouseholdsBySupervisor(user.id, {
        limit: 1000,
        search: filters.query,
        district: filters.district,
        taluk: filters.taluka,
        status: filters.status,
        fieldAgentId: filters.fieldAgentId
      })
      const list = (res.data || res.households || []).map(h => ({
        ...h,
        houseId: h.houseCode,
        status: h.status?.toUpperCase()
      }))
      if (type === 'csv') exportHouseholdsToCsv(list, `supervisor-team-surveys-${user.region}.csv`)
      else exportHouseholdsToPdf(list)
    } catch (err) {
      alert('Export failed: ' + err.message)
    }
  }

  if (loading && surveys.length === 0) {
    return (
      <>
        <TopBar title={t('nav.surveys')} subtitle={t('common.loading')} />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">{t('common.loading')}</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title={t('nav.surveys')} subtitle={`${totalItems} ${t('survey.households')} ${t('survey.verified')}`} />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <input
                className="field-input max-w-sm"
                placeholder={t('mySurveys.search')}
                value={filters.query}
                onChange={e => setFilter('query', e.target.value)}
              />
              {loading && <i className="ti ti-loader animate-spin text-ink-400 text-lg" aria-hidden="true" />}
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => triggerExport('csv')}>
                <i className="ti ti-file-spreadsheet text-base" aria-hidden="true" /> Export Excel
              </button>
              <button className="btn-secondary" onClick={() => triggerExport('pdf')}>
                <i className="ti ti-file-type-pdf text-base" aria-hidden="true" /> Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="field-label">{t('survey.district')}</label>
              <select className="field-input" value={filters.district} onChange={e => setFilter('district', e.target.value)}>
                <option value="all">All districts</option>
                {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">{t('survey.taluka')}</label>
              <select className="field-input" value={filters.taluka} onChange={e => setFilter('taluka', e.target.value)}>
                <option value="all">All talukas</option>
                {talukaOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">{t('role.field_agent')}</label>
              <select className="field-input" value={filters.fieldAgentId} onChange={e => setFilter('fieldAgentId', e.target.value)}>
                <option value="all">All field agents</option>
                {fieldAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Status</label>
              <select className="field-input" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                <option value="all">All statuses</option>
                <option value="verified">Verified</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-ink-400">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied</span>
              <button className="text-xs font-medium text-clay-500 hover:underline" onClick={resetFilters}>Clear all</button>
            </div>
          )}
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">House code</th>
                <th className="px-4 py-3">Head name</th>
                <th className="px-4 py-3">District / Taluk</th>
                <th className="px-4 py-3">Ward / Panchayat</th>
                <th className="px-4 py-3">Field agent</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {surveys.map(h => (
                <tr key={h.houseCode} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">#{h.houseId}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{h.headName}</td>
                  <td className="px-4 py-3 text-ink-600">{h.taluk}, {h.district}</td>
                  <td className="px-4 py-3 text-ink-600">{h.wardPanchayat || '—'}</td>
                  <td className="px-4 py-3 text-ink-600">{h.agentName}</td>
                  <td className="px-4 py-3 text-ink-500">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3"><Badge status={h.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm font-medium text-ink-700 hover:text-clay-500" onClick={() => openView(h)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {surveys.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-400">No surveys match these filters.</p>
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Household #${editDraft?.houseId}`} wide>
        {editDraft && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="field-label">Head name</p>
                <p className="text-ink-800">{editDraft.headName}</p>
              </div>
              <div>
                <p className="field-label">Phone</p>
                <p className="text-ink-800">{editDraft.phone}</p>
              </div>
              <div>
                <label className="field-label">Status</label>
                <select className="field-input" value={editDraft.status} onChange={e => setEditDraft({ ...editDraft, status: e.target.value })}>
                  <option value="verified">Verified</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="field-label">District</p>
                <p className="text-ink-600">{editDraft.district}</p>
              </div>
              <div>
                <p className="field-label">Taluka</p>
                <p className="text-ink-600">{editDraft.taluk}</p>
              </div>
              <div>
                <p className="field-label">Ward / Panchayat</p>
                <p className="text-ink-600">{editDraft.wardPanchayat || '—'}</p>
              </div>
            </div>
            <div>
              <p className="field-label">Problems reported</p>
              <p className="text-sm text-ink-600">{optionLabels(editDraft.problems, options.problems).join(', ') || '—'}</p>
            </div>
            <div>
              <p className="field-label">Active schemes</p>
              <p className="text-sm text-ink-600">{optionLabels(editDraft.govtSchemesAvailed, options.govtSchemes).join(', ') || '—'}</p>
            </div>
            <div>
              <label className="field-label">Grievance description</label>
              <textarea className="field-input min-h-[80px]" value={editDraft.grievanceDescription || ''} onChange={e => setEditDraft({ ...editDraft, grievanceDescription: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
              <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving} onClick={saveEdit}>{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
