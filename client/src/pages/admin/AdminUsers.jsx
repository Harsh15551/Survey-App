import { useEffect, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { getUsers, createUser, updateUser } from '../../api/users'

const EMPTY_FORM = { name: '', phone: '', role: 'field_agent', region: '', supervisorId: '' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await getUsers()
      const list = (res.data || res || []).map(u => ({ ...u, role: u.role.toLowerCase(), status: u.status.toLowerCase() }))
      setUsers(list)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const supervisors = users.filter(u => u.role === 'supervisor')

  async function toggleStatus(id) {
    const user = users.find(u => u.id === id)
    if (!user) return
    const newStatus = user.status === 'active' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateUser(id, { status: newStatus })
      await loadUsers()
    } catch (err) {
      alert('Failed to update: ' + err.message)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await createUser({
        name: form.name,
        phone: form.phone,
        role: form.role.toUpperCase(),
        region: form.region,
        supervisorId: form.role === 'field_agent' ? form.supervisorId || null : null
      })
      setForm(EMPTY_FORM)
      setShowCreate(false)
      await loadUsers()
    } catch (err) {
      alert('Failed to create: ' + err.message)
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Team & access" subtitle="Loading…" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">Loading users…</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title="Team & access" subtitle="Create and control Supervisor Admins and Field Agents" />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex justify-end">
          <button className="btn-accent" onClick={() => setShowCreate(true)}>
            <i className="ti ti-user-plus text-base" aria-hidden="true" /> Add user
          </button>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Reports to</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {users.filter(u => u.role !== 'admin').map(u => (
                <tr key={u.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                  <td className="px-4 py-3 capitalize text-ink-600">{u.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-ink-600">{u.phone}</td>
                  <td className="px-4 py-3 text-ink-600">{u.region}</td>
                  <td className="px-4 py-3 text-ink-600">{supervisors.find(s => s.id === u.supervisorId)?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge status={u.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm font-medium text-ink-700 hover:text-clay-500" onClick={() => toggleStatus(u.id)}>
                      {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add a new user">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="field-label">Full name</label>
            <input required className="field-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Phone number</label>
            <input required className="field-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Role</label>
            <select className="field-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="field_agent">Field agent</option>
              <option value="supervisor">Supervisor admin</option>
            </select>
          </div>
          <div>
            <label className="field-label">Assigned region</label>
            <input className="field-input" placeholder="e.g. Chittapur" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} />
          </div>
          {form.role === 'field_agent' && (
            <div>
              <label className="field-label">Reports to (supervisor)</label>
              <select className="field-input" value={form.supervisorId} onChange={e => setForm({ ...form, supervisorId: e.target.value })}>
                <option value="">Unassigned</option>
                {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create user</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
