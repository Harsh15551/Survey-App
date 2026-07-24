import { useEffect, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { getHouseholds, updateHousehold } from '../../api/households'
import { getUsers } from '../../api/users'
import { getOptions } from '../../api/reference'
import { exportHouseholdsToCsv, exportHouseholdsToPdf } from '../../utils/exportData'

export default function AdminHouseholds() {
  const [households, setHouseholds] = useState([])
  const [users, setUsers] = useState([])
  const [options, setOptions] = useState({ problems: [], schemes: [] })
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [district, setDistrict] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [editDraft, setEditDraft] = useState(null)

  async function loadData() {
    setLoading(true)
    try {
      const [hhRes, usersRes, optRes] = await Promise.all([
        getHouseholds({ search: query, district, status }),
        getUsers(),
        getOptions()
      ])
      // Normalize data shapes
      setHouseholds((hhRes.data || hhRes || []).map(normalizeHousehold))
      setUsers(usersRes.data || usersRes || [])
      setOptions({
        problems: optRes.problems || [],
        schemes: optRes.schemes || []
      })
    } catch (err) {
      console.error('Failed to load households:', err)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [query, district, status])

  function normalizeHousehold(h) {
    return {
      ...h,
      houseId: h.houseCode,
      status: (h.status || '').toLowerCase(),
      gender: h.gender ? h.gender.charAt(0) + h.gender.slice(1).toLowerCase() : ''
    }
  }

  const filtered = households

  function agentName(id) {
    return users.find(u => u.id === id)?.name || '—'
  }

  function optionLabels(ids, opts) {
    return (ids || []).map(id => opts.find(o => o.id === id)?.label || id)
  }

  function openView(h) {
    setSelected(h)
    setEditDraft({ ...h })
  }

  async function saveEdit() {
    try {
      await updateHousehold(editDraft.houseCode || editDraft.houseId, {
        headName: editDraft.headName,
        phone: editDraft.phone,
        age: editDraft.age ? parseInt(editDraft.age) : undefined,
        familySize: editDraft.familySize ? parseInt(editDraft.familySize) : undefined,
        status: editDraft.status?.toUpperCase(),
        grievanceDescription: editDraft.grievanceDescription || null
      })
      await loadData()
      setSelected(null)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    }
  }

  const districts = ['Gulbarga', 'Bidar']

  return (
    <>
      <TopBar title="Survey data" subtitle={`${filtered.length} households`} />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="field-input max-w-xs"
            placeholder="Search by house ID or name"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select className="field-input w-auto" value={district} onChange={e => setDistrict(e.target.value)}>
            <option value="all">All districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="field-input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
          </select>

          <div className="ml-auto flex gap-2">
            <button className="btn-secondary" onClick={() => exportHouseholdsToCsv(filtered)}>
              <i className="ti ti-file-spreadsheet text-base" aria-hidden="true" /> Export Excel
            </button>
            <button className="btn-secondary" onClick={() => exportHouseholdsToPdf(filtered)}>
              <i className="ti ti-file-type-pdf text-base" aria-hidden="true" /> Export PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="card p-10 text-center text-ink-400">Loading households…</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3">House ID</th>
                  <th className="px-4 py-3">Head name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Family size</th>
                  <th className="px-4 py-3">Field agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map(h => (
                  <tr key={h.houseId} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3 font-mono text-ink-500">#{h.houseId}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{h.headName}</td>
                    <td className="px-4 py-3 text-ink-600">{h.taluk}, {h.district}</td>
                    <td className="px-4 py-3 text-ink-600">{h.familySize}</td>
                    <td className="px-4 py-3 text-ink-600">{agentName(h.fieldAgentId)}</td>
                    <td className="px-4 py-3"><Badge status={h.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-sm font-medium text-ink-700 hover:text-clay-500" onClick={() => openView(h)}>
                        View / edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-400">No households match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="field-label">Age</label>
                <input className="field-input" type="number" value={editDraft.age} onChange={e => setEditDraft({ ...editDraft, age: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Family size</label>
                <input className="field-input" type="number" value={editDraft.familySize} onChange={e => setEditDraft({ ...editDraft, familySize: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Status</label>
                <select className="field-input" value={editDraft.status} onChange={e => setEditDraft({ ...editDraft, status: e.target.value })}>
                  <option value="verified">Verified</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
            </div>
            <div>
              <p className="field-label">Problems reported</p>
              <p className="text-sm text-ink-600">{optionLabels(editDraft.problems, options.problems).join(', ') || '—'}</p>
            </div>
            <div>
              <p className="field-label">Active schemes</p>
              <p className="text-sm text-ink-600">{optionLabels(editDraft.schemes, options.schemes).join(', ') || '—'}</p>
            </div>
            <div>
              <label className="field-label">Grievance description</label>
              <textarea className="field-input min-h-[80px]" value={editDraft.grievanceDescription || ''} onChange={e => setEditDraft({ ...editDraft, grievanceDescription: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
              <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveEdit}>Save changes</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
