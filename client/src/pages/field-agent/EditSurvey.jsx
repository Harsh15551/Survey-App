import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import MultiSelect from '../../components/ui/MultiSelect'
import { useAuth } from '../../context/AuthContext'
import { getHousehold, updateHousehold } from '../../api/households'
import { getOptions, getLocations } from '../../api/reference'

const SECTIONS = [
  { id: 'identity', title: 'Primary identity & phone' },
  { id: 'demographics', title: 'Demographic profiling' },
  { id: 'location', title: 'Geographic GPS location' },
  { id: 'photo', title: 'Household photograph' },
  { id: 'problems', title: 'Public problems & grievances' },
  { id: 'schemes', title: 'Government welfare schemes' }
]

export default function EditSurvey() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { houseCode } = useParams()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [saved, setSaved] = useState(false)

  const [districts, setDistricts] = useState([])
  const [talukMap, setTalukMap] = useState({})
  const [occupations, setOccupations] = useState([])
  const [incomeBrackets, setIncomeBrackets] = useState([])
  const [problemOptions, setProblemOptions] = useState([])
  const [schemeOptions, setSchemeOptions] = useState([])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Load reference data and existing household data
  useEffect(() => {
    Promise.all([getOptions(), getLocations(), getHousehold(houseCode)])
      .then(([opts, locs, household]) => {
        setProblemOptions(opts.problems || [])
        setSchemeOptions(opts.schemes || [])
        setOccupations(opts.occupations || [])
        setIncomeBrackets(opts.incomeBrackets || [])
        const dList = (locs.districts || [])
        setDistricts(dList)
        const tMap = {}
        for (const d of (locs.districts || [])) {
          tMap[d.name] = (d.taluks || [])
        }
        setTalukMap(tMap)

        // Map district enum to display name
        const districtDisplay = household.district ? household.district.charAt(0) + household.district.slice(1).toLowerCase() : ''
        // Map household data to form
        setForm({
          houseCode: household.houseCode || '',
          headName: household.headName || '',
          phone: household.phone || '',
          district: districtDisplay,
          taluk: household.taluk || '',
          age: String(household.age || ''),
          gender: household.gender || '',
          familySize: String(household.familySize || ''),
          occupation: household.occupation || '',
          incomeBracket: household.incomeBracket || '',
          latitude: household.latitude ? String(household.latitude) : '',
          longitude: household.longitude ? String(household.longitude) : '',
          photoDataUrl: household.photoUrl || null,
          problems: Array.isArray(household.problems) ? household.problems : [],
          grievanceDescription: household.grievanceDescription || '',
          schemes: Array.isArray(household.schemes) ? household.schemes : [],
          schemeFeedback: household.schemeFeedback || ''
        })
      })
      .catch(err => {
        console.error(err)
        setSubmitError('Failed to load survey data.')
      })
      .finally(() => setLoading(false))
  }, [houseCode])

  function handleGetLiveGps() {
    if (!navigator.geolocation) { setGpsStatus('error'); return }
    setGpsStatus('locating')
    navigator.geolocation.getCurrentPosition(
      pos => {
        update('latitude', pos.coords.latitude.toFixed(7))
        update('longitude', pos.coords.longitude.toFixed(7))
        setGpsStatus('done')
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function handlePhotoFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('photoDataUrl', reader.result)
    reader.readAsDataURL(file)
  }

  function handleDrop(e) { e.preventDefault(); handlePhotoFile(e.dataTransfer.files?.[0]) }

  function canProceed() {
    if (!form) return false
    switch (SECTIONS[step].id) {
      case 'identity':
        return form.houseCode.trim() && form.headName.trim() && /^\d{10}$/.test(form.phone.trim())
      case 'demographics':
        return form.age && form.gender && form.familySize && form.occupation && form.incomeBracket
      default:
        return true
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = {
        headName: form.headName.trim(),
        phone: form.phone.trim(),
        age: parseInt(form.age),
        gender: form.gender.toUpperCase(),
        familySize: parseInt(form.familySize),
        occupation: form.occupation,
        incomeBracket: form.incomeBracket,
        district: form.district.toUpperCase(),
        taluk: form.taluk,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        problems: form.problems,
        grievanceDescription: form.grievanceDescription || null,
        schemes: form.schemes,
        schemeFeedback: form.schemeFeedback || null
      }
      await updateHousehold(houseCode, payload)
      setSaved(true)
    } catch (err) {
      setSubmitError(err.message)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <>
        <TopBar title="Edit survey" subtitle="Loading…" />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">Loading survey data…</p>
        </main>
      </>
    )
  }

  if (saved) {
    return (
      <>
        <TopBar title="Survey updated" subtitle="Changes saved successfully" />
        <main className="flex flex-1 items-center justify-center p-4 md:p-8">
          <div className="card max-w-md p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <i className="ti ti-check text-3xl" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-ink-900">Survey updated</h2>
            <p className="mt-1 text-sm text-ink-500">Changes to household record have been saved.</p>
            <p className="mt-4 rounded-lg bg-ink-50 py-3 font-mono text-2xl tracking-widest text-ink-800">{houseCode}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button className="btn-secondary flex-1" onClick={() => navigate('/field/my-surveys')}>
                Back to my surveys
              </button>
              <button className="btn-primary flex-1" onClick={() => navigate('/field')}>
                Go home
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  const section = SECTIONS[step]

  return (
    <>
      <TopBar title="Edit survey" subtitle={`Household #${houseCode} · Section ${step + 1} of ${SECTIONS.length}`} />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex gap-1.5">
            {SECTIONS.map((s, i) => (
              <div key={s.id} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-clay-500' : 'bg-ink-100'}`} />
            ))}
          </div>

          <div className="card p-6">
            {section.id === 'identity' && form && (
              <div className="space-y-4">
                <div>
                  <label className="field-label">House code</label>
                  <input className="field-input font-mono tracking-widest bg-ink-50" value={form.houseCode} readOnly />
                </div>
                <div>
                  <label className="field-label">Household head name</label>
                  <input className="field-input" value={form.headName} onChange={e => update('headName', e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Contact phone number</label>
                  <input className="field-input" inputMode="numeric" maxLength={10} value={form.phone} onChange={e => update('phone', e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">District</label>
                    <select className="field-input" value={form.district} onChange={e => update('district', e.target.value)}>
                      {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Taluk</label>
                    <select className="field-input" value={form.taluk} onChange={e => update('taluk', e.target.value)}>
                      {(talukMap[form.district] || []).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {section.id === 'demographics' && form && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Age of head person</label>
                    <input className="field-input" type="number" min="18" max="110" value={form.age} onChange={e => update('age', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Gender</label>
                    <select className="field-input" value={form.gender} onChange={e => update('gender', e.target.value)}>
                      <option value="">Select</option>
                      <option>MALE</option>
                      <option>FEMALE</option>
                      <option>OTHER</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="field-label">Family size</label>
                  <input className="field-input" type="number" min="1" value={form.familySize} onChange={e => update('familySize', e.target.value)} />
                </div>
                <div>
                  <label className="field-label">Household occupation</label>
                  <select className="field-input" value={form.occupation} onChange={e => update('occupation', e.target.value)}>
                    <option value="">Select</option>
                    {occupations.map(o => {
                      return <option key={o.id} value={o.id}>{o.label}</option>
                    })}
                  </select>
                </div>
                <div>
                  <label className="field-label">Annual income bracket</label>
                  <select className="field-input" value={form.incomeBracket} onChange={e => update('incomeBracket', e.target.value)}>
                    <option value="">Select</option>
                    {incomeBrackets.map(o => {
                      return <option key={o.id} value={o.id}>{o.label}</option>
                    })}
                  </select>
                </div>
              </div>
            )}

            {section.id === 'location' && form && (
              <div className="space-y-4">
                <p className="text-sm text-ink-500">Update GPS coordinates if needed.</p>
                <button type="button" onClick={handleGetLiveGps} className="btn-primary w-full" disabled={gpsStatus === 'locating'}>
                  <i className="ti ti-map-pin text-base" aria-hidden="true" />
                  {gpsStatus === 'locating' ? 'Getting location…' : 'Get live GPS'}
                </button>
                {gpsStatus === 'error' && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Could not get location.</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Latitude</label>
                    <input className="field-input font-mono" value={form.latitude} readOnly placeholder="—" />
                  </div>
                  <div>
                    <label className="field-label">Longitude</label>
                    <input className="field-input font-mono" value={form.longitude} readOnly placeholder="—" />
                  </div>
                </div>
              </div>
            )}

            {section.id === 'photo' && form && (
              <div className="space-y-4">
                <p className="text-sm text-ink-500">Update the household photo if needed.</p>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 p-8 text-center"
                >
                  {form.photoDataUrl ? (
                    <img src={form.photoDataUrl} alt="Household" className="h-40 w-full rounded-lg object-cover" />
                  ) : (
                    <>
                      <i className="ti ti-camera text-3xl text-ink-400" aria-hidden="true" />
                      <p className="text-sm text-ink-500">No photo. Drag one here or use the button below.</p>
                    </>
                  )}
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                      <i className="ti ti-camera text-base" aria-hidden="true" /> Capture photo
                    </button>
                    {form.photoDataUrl && (
                      <button type="button" className="btn-secondary" onClick={() => update('photoDataUrl', null)}>Remove</button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhotoFile(e.target.files?.[0])} />
                </div>
              </div>
            )}

            {section.id === 'problems' && form && (
              <div className="space-y-4">
                <div>
                  <label className="field-label">Select problem(s) faced</label>
                  <MultiSelect options={problemOptions} selected={form.problems} onChange={v => update('problems', v)} />
                </div>
                <div>
                  <label className="field-label">Grievance description</label>
                  <textarea className="field-input min-h-[100px]" value={form.grievanceDescription} onChange={e => update('grievanceDescription', e.target.value)} />
                </div>
              </div>
            )}

            {section.id === 'schemes' && form && (
              <div className="space-y-4">
                <div>
                  <label className="field-label">Select active government welfare scheme(s)</label>
                  <MultiSelect options={schemeOptions} selected={form.schemes} onChange={v => update('schemes', v)} />
                </div>
                <div>
                  <label className="field-label">Scheme feedback & notes</label>
                  <textarea className="field-input min-h-[100px]" value={form.schemeFeedback} onChange={e => update('schemeFeedback', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {submitError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}

          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button className="btn-secondary flex-1" onClick={() => setStep(s => s - 1)}>Back</button>
            )}
            {step < SECTIONS.length - 1 ? (
              <button className="btn-primary flex-1" disabled={!canProceed()} onClick={() => setStep(s => s + 1)}>
                Continue
              </button>
            ) : (
              <button className="btn-accent flex-1" disabled={submitting || !canProceed()} onClick={handleSubmit}>
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
