import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getOptions } from '../../api/reference'

export default function CitizenHousehold() {
  const { session, logout } = useAuth()
  const [options, setOptions] = useState({ problems: [], schemes: [] })
  const h = session?.household

  useEffect(() => {
    getOptions().then(setOptions).catch(console.error)
  }, [])

  function optionLabels(ids, opts) {
    return (ids || []).map(id => opts.find(o => o.id === id)?.label || id)
  }

  if (!h) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <p className="text-ink-500">Household record not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="flex items-center justify-between bg-ink-900 px-4 py-4 text-white sm:px-8">
        <div>
          <p className="text-sm font-semibold tracking-wide">VEERBHADRESHWAR TRUST</p>
          <p className="text-xs text-ink-400">Your household record</p>
        </div>
        <button onClick={logout} className="text-sm text-ink-300 hover:text-white">Log out</button>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4 sm:p-8">
        <div className="card p-5">
          <p className="font-mono text-xs text-ink-400">House ID #{h.houseCode || session?.houseId}</p>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">{h.headName}</h1>
          <p className="text-sm text-ink-500">{h.taluk}, {h.district}</p>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Household details</h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-ink-400">Age of head</dt><dd className="text-ink-800">{h.age}</dd>
            <dt className="text-ink-400">Gender</dt><dd className="text-ink-800">{h.gender ? h.gender.charAt(0) + h.gender.slice(1).toLowerCase() : '—'}</dd>
            <dt className="text-ink-400">Family size</dt><dd className="text-ink-800">{h.familySize}</dd>
            <dt className="text-ink-400">Occupation</dt><dd className="text-ink-800">{h.occupation}</dd>
            <dt className="text-ink-400">Income bracket</dt><dd className="text-ink-800">{h.incomeBracket}</dd>
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="mb-2 text-sm font-semibold text-ink-900">Problems reported</h2>
          <div className="flex flex-wrap gap-2">
            {optionLabels(h.problems, options.problems).map(p => (
              <span key={p} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700">{p}</span>
            ))}
          </div>
          {h.grievanceDescription && <p className="mt-3 text-sm text-ink-600">{h.grievanceDescription}</p>}
        </div>

        <div className="card p-5">
          <h2 className="mb-2 text-sm font-semibold text-ink-900">Active welfare schemes</h2>
          <div className="flex flex-wrap gap-2">
            {optionLabels(h.schemes, options.schemes).map(s => (
              <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">{s}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/citizen/emergency" className="card flex flex-col items-center gap-2 p-5 text-center hover:shadow-md">
            <i className="ti ti-phone-call text-2xl text-ink-700" aria-hidden="true" />
            <span className="text-sm font-medium text-ink-900">Emergency numbers</span>
          </Link>
          <Link to="/citizen/grievance" className="card flex flex-col items-center gap-2 p-5 text-center hover:shadow-md">
            <i className="ti ti-message-report text-2xl text-clay-500" aria-hidden="true" />
            <span className="text-sm font-medium text-ink-900">Raise a grievance</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
