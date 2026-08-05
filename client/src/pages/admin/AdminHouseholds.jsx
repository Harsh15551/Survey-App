import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { getHouseholds, updateHousehold } from '../../api/households'
import { getUsers } from '../../api/users'
import { getOptions, getLocations } from '../../api/reference'
import { exportHouseholdsToCsv, exportHouseholdsToPdf } from '../../utils/exportData'

const EMPTY_FILTERS = {
  query: '',
  district: 'all',
  taluka: 'all',
  ward: 'all',
  supervisorId: 'all',
  fieldAgentId: 'all',
  status: 'all'
}

export default function AdminHouseholds() {
  const [households, setHouseholds] = useState([])
  const [users, setUsers] = useState([])
  const [districts, setDistricts] = useState([])
  const [options, setOptions] = useState({ problems: [], govtSchemes: [] })
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  // Pagination states
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 10

  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    query: searchParams.get('query') || EMPTY_FILTERS.query,
    district: searchParams.get('district') || EMPTY_FILTERS.district,
    status: (searchParams.get('status') || EMPTY_FILTERS.status).toLowerCase(),
    fieldAgentId: searchParams.get('fieldAgentId') || EMPTY_FILTERS.fieldAgentId
  }))
  const [selected, setSelected] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  // Load static reference options and users once
  useEffect(() => {
    Promise.all([
      getUsers(),
      getOptions(),
      getLocations()
    ])
      .then(([usersRes, optRes, locRes]) => {
        setUsers(usersRes.data || usersRes || [])
        setOptions({
          problems: optRes.problems || [],
          govtSchemes: optRes.govtSchemes || []
        })
        setDistricts(locRes.districts || [])
      })
      .catch(console.error)
  }, [])

  // Load households paginated from server on page/filter change
  useEffect(() => {
    setLoading(true)
    getHouseholds({
      page,
      limit,
      search: filters.query,
      district: filters.district,
      taluk: filters.taluka,
      wardPanchayat: filters.ward === 'all' ? '' : filters.ward,
      status: filters.status,
      fieldAgentId: filters.fieldAgentId,
      supervisorId: filters.supervisorId
    })
      .then(res => {
        const dataList = res.data || res.households || []
        setHouseholds(dataList.map(normalizeHousehold))
        setTotalItems(res.pagination?.total ?? dataList.length)
        setTotalPages(res.pagination?.totalPages ?? Math.ceil((res.pagination?.total || dataList.length) / limit))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, filters])

  function normalizeHousehold(h) {
    return {
      ...h,
      houseId: h.houseCode,
      status: (h.status || '').toLowerCase()
    }
  }

  function setFilter(key, value) {
    setFilters(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'district') { next.taluka = 'all'; next.ward = 'all' }
      if (key === 'taluka') { next.ward = 'all' }
      if (key === 'supervisorId') {
        const agent = users.find(u => u.id === prev.fieldAgentId)
        if (agent && agent.supervisorId !== value && value !== 'all') next.fieldAgentId = 'all'
      }
      return next
    })
    setPage(1) // Reset page on filter change
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const fieldAgents = useMemo(() => {
    let list = users.filter(u => u.role === 'FIELD_AGENT')
    if (filters.supervisorId !== 'all') list = list.filter(u => u.supervisorId === filters.supervisorId)
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [users, filters.supervisorId])

  const supervisors = useMemo(
    () => users.filter(u => u.role === 'SUPERVISOR').sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  )

  const talukaOptions = useMemo(() => {
    if (filters.district === 'all') {
      return [...new Set(districts.flatMap(d => d.taluks))].sort()
    }
    return districts.find(d => d.name === filters.district)?.taluks || []
  }, [districts, filters.district])

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== EMPTY_FILTERS[k]).length

  function agentName(id) {
    return users.find(u => u.id === id)?.name || '—'
  }

  function supervisorNameForAgent(id) {
    const agent = users.find(u => u.id === id)
    if (!agent?.supervisorId) return '—'
    return users.find(u => u.id === agent.supervisorId)?.name || '—'
  }

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
        headName: editDraft.headName,
        phone: editDraft.phone,
        headAge: editDraft.headAge ? parseInt(editDraft.headAge) : undefined,
        familySize: editDraft.familySize ? parseInt(editDraft.familySize) : undefined,
        status: editDraft.status?.toUpperCase(),
        grievanceDescription: editDraft.grievanceDescription || null
      })
      // Reload current page
      const res = await getHouseholds({
        page,
        limit,
        search: filters.query,
        district: filters.district,
        taluk: filters.taluka,
        wardPanchayat: filters.ward === 'all' ? '' : filters.ward,
        status: filters.status,
        fieldAgentId: filters.fieldAgentId,
        supervisorId: filters.supervisorId
      })
      const dataList = res.data || res.households || []
      setHouseholds(dataList.map(normalizeHousehold))
      setTotalItems(res.total || dataList.length)
      setTotalPages(res.totalPages || Math.ceil((res.total || dataList.length) / limit))
      setSelected(null)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    }
    setSaving(false)
  }

  // Exports fetch full matching records
  async function triggerExport(type) {
    try {
      const res = await getHouseholds({
        limit: 5000,
        search: filters.query,
        district: filters.district,
        taluk: filters.taluka,
        wardPanchayat: filters.ward === 'all' ? '' : filters.ward,
        status: filters.status,
        fieldAgentId: filters.fieldAgentId,
        supervisorId: filters.supervisorId
      })
      const list = (res.data || res.households || []).map(h => ({
        ...h,
        houseId: h.houseCode,
        status: h.status?.toUpperCase()
      }))
      if (type === 'csv') exportHouseholdsToCsv(list, 'admin-households-export.csv')
      else exportHouseholdsToPdf(list)
    } catch (err) {
      alert('Export failed: ' + err.message)
    }
  }

  return (
    <>
      <TopBar title="Survey data" subtitle={`${totalItems} total households`} />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2">
              <input
                className="field-input max-w-xs"
                placeholder="Search by house ID or name"
                value={filters.query}
                onChange={e => setFilter('query', e.target.value)}
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="field-label">District</label>
              <select className="field-input" value={filters.district} onChange={e => setFilter('district', e.target.value)}>
                <option value="all">All districts</option>
                {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Taluka</label>
              <select className="field-input" value={filters.taluka} onChange={e => setFilter('taluka', e.target.value)}>
                <option value="all">All talukas</option>
                {talukaOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Ward / Panchayat</label>
              <input
                className="field-input"
                placeholder="Search Ward/Panchayat"
                value={filters.ward === 'all' ? '' : filters.ward}
                onChange={e => setFilter('ward', e.target.value || 'all')}
              />
            </div>
            <div>
              <label className="field-label">Supervisor</label>
              <select className="field-input" value={filters.supervisorId} onChange={e => setFilter('supervisorId', e.target.value)}>
                <option value="all">All supervisors</option>
                {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Field agent</label>
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
                <th className="px-4 py-3">House ID</th>
                <th className="px-4 py-3">Head name</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Taluka</th>
                <th className="px-4 py-3">Ward / Panchayat</th>
                <th className="px-4 py-3">Family size</th>
                <th className="px-4 py-3">Field agent</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {households.map(h => (
                <tr key={h.houseId} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-mono text-ink-500">#{h.houseId}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{h.headName}</td>
                  <td className="px-4 py-3 text-ink-600">{h.district}</td>
                  <td className="px-4 py-3 text-ink-600">{h.taluk}</td>
                  <td className="px-4 py-3 text-ink-600">{h.wardPanchayat || '—'}</td>
                  <td className="px-4 py-3 text-ink-600">{h.familySize || '—'}</td>
                  <td className="px-4 py-3 text-ink-600">{agentName(h.fieldAgentId)}</td>
                  <td className="px-4 py-3 text-ink-600">{supervisorNameForAgent(h.fieldAgentId)}</td>
                  <td className="px-4 py-3"><Badge status={h.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm font-medium text-ink-700 hover:text-clay-500" onClick={() => openView(h)}>
                      View / edit
                    </button>
                  </td>
                </tr>
              ))}
              {households.length === 0 && !loading && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-ink-400">No households match these filters.</td></tr>
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Household #${editDraft?.houseId}`} wide>
        {editDraft && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Head name</label>
                <input className="field-input" value={editDraft.headName} onChange={e => setEditDraft({ ...editDraft, headName: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Phone</label>
                <input className="field-input" value={editDraft.phone} onChange={e => setEditDraft({ ...editDraft, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="field-label">Head's age</label>
                <input className="field-input" type="number" value={editDraft.headAge ?? ''} onChange={e => setEditDraft({ ...editDraft, headAge: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Family size</label>
                <input className="field-input" type="number" value={editDraft.familySize || ''} onChange={e => setEditDraft({ ...editDraft, familySize: e.target.value })} />
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
