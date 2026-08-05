import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getOptions } from '../../api/reference'

export default function CitizenHousehold() {
  const { session, logout } = useAuth()
  const [options, setOptions] = useState({
    problems: [], govtSchemes: [], facilities: [], occupations: [],
    propertyTypes: [], familySizeBands: [], incomeBrackets: []
  })
  const h = session?.household

  useEffect(() => {
    getOptions().then(setOptions).catch(console.error)
  }, [])

  function optionLabels(ids, opts) {
    return (ids || []).map(id => opts.find(o => o.id === id)?.label || id)
  }

  function optionLabel(id, opts) {
    return opts.find(o => o.id === id)?.label || id || '—'
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
      <header className="flex items-center justify-between gap-3 bg-ink-900 px-4 py-4 text-white sm:px-8">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-wide">VEERBHADRESHWAR TRUST</p>
          <p className="text-xs text-ink-400">Your household record</p>
        </div>
        <button onClick={logout} className="shrink-0 text-sm text-ink-300 hover:text-white">Log out</button>
      </header>

      <main className="mx-auto max-w-lg space-y-4 p-4 sm:p-8 lg:max-w-3xl">
        <div className="card p-5">
          <p className="font-mono text-xs text-ink-400">QR ID #{h.houseCode || session?.houseId}</p>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">{h.headName}</h1>
          <p className="text-sm text-ink-500">
            {h.villageName ? `${h.villageName}, ` : ''}{h.taluk}, {h.district}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Household details</h2>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-ink-400">House number</dt><dd className="text-ink-800">{h.houseNumber || '—'}</dd>
              <dt className="text-ink-400">Ward/Panchayat</dt><dd className="text-ink-800">{h.wardPanchayat || '—'}</dd>
              <dt className="text-ink-400">Property type</dt><dd className="text-ink-800">{optionLabel(h.propertyType, options.propertyTypes)}</dd>
              <dt className="text-ink-400">Family members</dt><dd className="text-ink-800">{optionLabel(h.familySizeBand, options.familySizeBands)}</dd>
              <dt className="text-ink-400">Monthly income</dt><dd className="text-ink-800">{optionLabel(h.incomeBracket, options.incomeBrackets)}</dd>
              <dt className="text-ink-400">Occupation</dt><dd className="text-ink-800">{optionLabel(h.occupation, options.occupations)}</dd>
              <dt className="text-ink-400">Age of head</dt><dd className="text-ink-800">{h.headAge ? `${h.headAge} yrs` : '—'}</dd>
              <dt className="text-ink-400">Mobile</dt><dd className="text-ink-800">{h.phone || '—'}</dd>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="mb-2 text-sm font-semibold text-ink-900">Available facilities</h2>
            <div className="flex flex-wrap gap-2">
              {optionLabels(h.facilities, options.facilities).map(f => (
                <span key={f} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-700">{f}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-2 text-sm font-semibold text-ink-900">Major issues</h2>
            <div className="flex flex-wrap gap-2">
              {optionLabels(h.problems, options.problems).map(p => (
                <span key={p} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700">{p}</span>
              ))}
            </div>
            {h.grievanceDescription && <p className="mt-3 text-sm text-ink-600">{h.grievanceDescription}</p>}
          </div>

          <div className="card p-5">
            <h2 className="mb-2 text-sm font-semibold text-ink-900">Government schemes availed</h2>
            <div className="flex flex-wrap gap-2">
              {optionLabels(h.govtSchemesAvailed, options.govtSchemes).map(s => (
                <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">{s}</span>
              ))}
            </div>
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
