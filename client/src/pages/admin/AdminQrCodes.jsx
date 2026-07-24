import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import TopBar from '../../components/layout/TopBar'
import { getHouseholds } from '../../api/households'

// Base URL a citizen lands on when they scan the plate.
const CITIZEN_BASE_URL = 'https://app.veerbhadreshwartrust.in/h'

export default function AdminQrCodes() {
  const [households, setHouseholds] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    getHouseholds({ search: query, limit: 500 })
      .then(res => {
        const list = (res.data || res || []).map(h => ({ ...h, houseId: h.houseCode }))
        setHouseholds(list)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [query])

  function toggle(houseId) {
    setSelected(prev => prev.includes(houseId) ? prev.filter(id => id !== houseId) : [...prev, houseId])
  }

  function selectAll() {
    setSelected(households.map(h => h.houseId))
  }

  function handlePrint() {
    window.print()
  }

  return (
    <>
      <TopBar title="QR codes" subtitle="Generate plates for field agents to paste at each household" />
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <input
            className="field-input max-w-xs"
            placeholder="Search by house ID or name"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="btn-secondary" onClick={selectAll}>Select all shown</button>
          <button className="btn-secondary" onClick={() => setSelected([])}>Clear selection</button>
          <button className="btn-accent ml-auto" disabled={selected.length === 0} onClick={handlePrint}>
            <i className="ti ti-printer text-base" aria-hidden="true" /> Print {selected.length || ''} plate{selected.length === 1 ? '' : 's'}
          </button>
        </div>

        {loading ? (
          <div className="card p-10 text-center text-ink-400">Loading households…</div>
        ) : (
          <div className="card divide-y divide-ink-100 print:hidden">
            {households.map(h => (
              <label key={h.houseId} className="flex items-center gap-3 p-3 hover:bg-ink-50/60">
                <input
                  type="checkbox"
                  checked={selected.includes(h.houseId)}
                  onChange={() => toggle(h.houseId)}
                  className="h-4 w-4 rounded border-ink-300 text-clay-500 focus-ring"
                />
                <span className="font-mono text-sm text-ink-400">#{h.houseId}</span>
                <span className="font-medium text-ink-900">{h.headName}</span>
                <span className="ml-auto text-sm text-ink-500">{h.taluk}, {h.district}</span>
              </label>
            ))}
          </div>
        )}

        {/* Printable plate sheet */}
        <div className="hidden grid-cols-2 gap-4 print:grid">
          {selected.map(id => {
            const h = households.find(x => x.houseId === id)
            return (
              <div key={id} className="flex flex-col items-center gap-2 rounded-xl border border-ink-200 p-4 text-center">
                <QRCodeSVG value={`${CITIZEN_BASE_URL}/${id}`} size={140} />
                <p className="font-mono text-lg font-semibold text-ink-900">{id}</p>
                <p className="text-xs text-ink-500">Scan to view household details & report grievances</p>
                <p className="text-xs text-ink-400">VEERBHADRESHWAR TRUST · {h?.district}</p>
              </div>
            )
          })}
        </div>

        {/* On-screen preview of a single plate for reference */}
        {selected.length > 0 && (
          <div className="card p-6 print:hidden">
            <p className="mb-3 text-sm font-medium text-ink-700">Preview — plate #{selected[0]}</p>
            <div className="flex w-fit flex-col items-center gap-2 rounded-xl border border-ink-200 p-4 text-center">
              <QRCodeSVG value={`${CITIZEN_BASE_URL}/${selected[0]}`} size={140} />
              <p className="font-mono text-lg font-semibold text-ink-900">{selected[0]}</p>
              <p className="text-xs text-ink-500">Scan to view household details & report grievances</p>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
