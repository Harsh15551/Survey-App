import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { createGrievance } from '../../api/grievances'

export default function GrievanceForm() {
  const { session } = useAuth()
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createGrievance({
        houseCode: session?.houseId || session?.household?.houseCode,
        message
      })
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="flex items-center gap-3 bg-ink-900 px-4 py-4 text-white sm:px-8">
        <Link to="/citizen" className="text-ink-300 hover:text-white" aria-label="Back">
          <i className="ti ti-arrow-left text-xl" aria-hidden="true" />
        </Link>
        <p className="text-sm font-semibold">Raise a grievance</p>
      </header>

      <main className="mx-auto max-w-lg p-4 sm:p-8">
        {submitted ? (
          <div className="card p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <i className="ti ti-check text-2xl" aria-hidden="true" />
            </div>
            <h2 className="font-semibold text-ink-900">Grievance submitted</h2>
            <p className="mt-1 text-sm text-ink-500">Your local Supervisor Admin has been notified and will follow up.</p>
            <Link to="/citizen" className="btn-primary mt-4 inline-flex">Back to my household</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4 p-6">
            <p className="text-sm text-ink-500">
              Submitting for house ID <span className="font-mono text-ink-800">#{session?.houseId || session?.household?.houseCode}</span>
            </p>
            <div>
              <label className="field-label">Describe your query or grievance</label>
              <textarea
                required
                className="field-input min-h-[140px]"
                placeholder="Tell us what's happening — the more detail, the faster it can be resolved"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" className="btn-accent w-full" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit grievance'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
