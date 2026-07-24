import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function CitizenLogin() {
  const { houseIdParam } = useParams() // present when arriving via QR: /h/:houseIdParam
  const { citizenLogin, role } = useAuth()
  const navigate = useNavigate()

  const [houseId, setHouseId] = useState(houseIdParam || '')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (role === 'citizen') return <Navigate to="/citizen" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await citizenLogin(houseId.trim(), phone.trim())
    setLoading(false)
    if (!result.ok) return setError(result.error)
    navigate('/citizen')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-clay-500 text-base font-bold text-white">VT</div>
          <p className="text-xs font-semibold tracking-wide text-ink-400">VEERBHADRESHWAR TRUST</p>
          <h1 className="mt-1 text-xl font-semibold text-white">View your household details</h1>
          <p className="mt-1 text-sm text-ink-400">Scanned from the QR plate on your door</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="field-label" htmlFor="houseId">Unique house ID</label>
            <input
              id="houseId"
              inputMode="numeric"
              maxLength={6}
              className="field-input tracking-widest"
              placeholder="6-digit ID"
              value={houseId}
              onChange={e => setHouseId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="phone">Registered phone number</label>
            <input
              id="phone"
              type="tel"
              className="field-input"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'View household details'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          Staff or field agent?{' '}
          <Link to="/login" className="font-medium text-clay-400 hover:text-clay-300">
            Go to staff login
          </Link>
        </p>
      </div>
    </div>
  )
}
