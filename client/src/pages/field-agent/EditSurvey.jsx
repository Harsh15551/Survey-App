import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import MultiSelect from '../../components/ui/MultiSelect'
import { useLanguage } from '../../context/LanguageContext'
import { getHousehold, updateHousehold, uploadPhoto } from '../../api/households'
import { getOptions, getLocations } from '../../api/reference'

const SECTION_IDS = ['identity', 'household', 'location', 'photo', 'issues', 'schemes']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EditSurvey() {
  const navigate = useNavigate()
  const { houseCode } = useParams()
  const { t } = useLanguage()
  const fileInputRef = useRef(null)

  const ICON_MAP = {
    identity: 'ti ti-id-badge',
    household: 'ti ti-home',
    location: 'ti ti-map-pin',
    photo: 'ti ti-camera',
    issues: 'ti ti-alert-triangle',
    schemes: 'ti ti-government'
  }

  const SECTIONS = SECTION_IDS.map(id => ({ id, title: t(`survey.section.${id}`), icon: ICON_MAP[id] }))

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [saved, setSaved] = useState(false)
  const [touched, setTouched] = useState({})

  const [districts, setDistricts] = useState([])
  const [talukMap, setTalukMap] = useState({})
  const [occupations, setOccupations] = useState([])
  const [problemOptions, setProblemOptions] = useState([])
  const [propertyTypes, setPropertyTypes] = useState([])
  const [familySizeBands, setFamilySizeBands] = useState([])
  const [facilityOptions, setFacilityOptions] = useState([])
  const [govtSchemeOptions, setGovtSchemeOptions] = useState([])
  const [states, setStates] = useState([])
  const [incomeBrackets, setIncomeBrackets] = useState([])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function getFieldError(field) {
    if (!form || !touched[field]) return ''
    switch (field) {
      case 'phone': return !/^\d{10}$/.test(form.phone.trim()) ? t('survey.errInvalidPhone') : ''
      case 'email': return (form.email.trim() !== '' && !EMAIL_RE.test(form.email.trim())) ? t('survey.errInvalidEmail') : ''
      case 'headName': return !form.headName.trim() ? t('survey.errRequired') : ''
      case 'alternatePhone': return (form.alternatePhone.trim() !== '' && !/^\d{10}$/.test(form.alternatePhone.trim())) ? t('survey.errInvalidPhone') : ''
      case 'villageName': return !form.villageName.trim() ? t('survey.errRequired') : ''
      case 'wardPanchayat': return !form.wardPanchayat.trim() ? t('survey.errRequired') : ''
      case 'houseNumber': return !form.houseNumber.trim() ? t('survey.errRequired') : ''
      case 'familySizeBand': return !form.familySizeBand ? t('survey.errRequired') : ''
      case 'incomeBracket': return !form.incomeBracket ? t('survey.errRequired') : ''
      case 'facilities': return form.facilities.length === 0 ? t('survey.errRequired') : ''
      case 'occupation': return !form.occupation ? t('survey.errRequired') : ''
      case 'headAge': {
        const age = parseInt(form.headAge, 10)
        if (!form.headAge.trim()) return t('survey.errRequired')
        if (isNaN(age) || age < 18 || age > 120) return t('survey.errInvalidAge')
        return ''
      }
      default: return ''
    }
  }

  // Load reference data and existing household data
  useEffect(() => {
    Promise.all([getOptions(), getLocations(), getHousehold(houseCode)])
      .then(([opts, locs, household]) => {
        setProblemOptions(opts.problems || [])
        setOccupations(opts.occupations || [])
        setPropertyTypes(opts.propertyTypes || [])
        setFamilySizeBands(opts.familySizeBands || [])
        setFacilityOptions(opts.facilities || [])
        setGovtSchemeOptions(opts.govtSchemes || [])
        setStates(opts.states || [])
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
          email: household.email || '',
          state: household.state || '',
          propertyType: household.propertyType || '',
          district: districtDisplay,
          taluk: household.taluk || '',
          villageName: household.villageName || '',
          wardPanchayat: household.wardPanchayat || '',
          houseNumber: household.houseNumber || '',
          alternatePhone: household.alternatePhone || '',
          familySizeBand: household.familySizeBand || '',
          headAge: household.headAge ? String(household.headAge) : '',
          incomeBracket: household.incomeBracket || '',
          facilities: Array.isArray(household.facilities) ? household.facilities : [],
          occupation: household.occupation || '',
          latitude: household.latitude ? String(household.latitude) : '',
          longitude: household.longitude ? String(household.longitude) : '',
          photoDataUrl: household.photoUrl || null,
          problems: Array.isArray(household.problems) ? household.problems : [],
          grievanceDescription: household.grievanceDescription || '',
          govtSchemesAvailed: Array.isArray(household.govtSchemesAvailed) ? household.govtSchemesAvailed : []
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
    switch (SECTION_IDS[step]) {
      case 'identity':
        return (
          form.houseCode.trim() &&
          form.headName.trim() &&
          /^\d{10}$/.test(form.phone.trim()) &&
          (form.email.trim() === '' || EMAIL_RE.test(form.email.trim())) &&
          form.state &&
          form.propertyType
        )
      case 'household':
        return (
          form.district &&
          form.taluk &&
          form.villageName.trim() &&
          form.wardPanchayat.trim() &&
          form.houseNumber.trim() &&
          (form.alternatePhone.trim() === '' || /^\d{10}$/.test(form.alternatePhone.trim())) &&
          form.familySizeBand &&
          form.incomeBracket &&
          form.facilities.length > 0 &&
          form.occupation &&
          form.headAge.trim() &&
          parseInt(form.headAge, 10) >= 18 &&
          parseInt(form.headAge, 10) <= 120
        )
      default:
        return true
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      let photoUrl = form.photoDataUrl
      if (form.photoDataUrl && form.photoDataUrl.startsWith('data:')) {
        photoUrl = await uploadPhoto(form.photoDataUrl)
      }

      const payload = {
        headName: form.headName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        state: form.state,
        propertyType: form.propertyType,
        district: form.district.toUpperCase(),
        taluk: form.taluk,
        villageName: form.villageName.trim(),
        wardPanchayat: form.wardPanchayat.trim(),
        houseNumber: form.houseNumber.trim(),
        alternatePhone: form.alternatePhone.trim() || null,
        familySizeBand: form.familySizeBand,
        headAge: form.headAge.trim() ? parseInt(form.headAge, 10) : null,
        incomeBracket: form.incomeBracket,
        facilities: form.facilities,
        occupation: form.occupation,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        photoUrl: photoUrl || null,
        problems: form.problems,
        grievanceDescription: form.grievanceDescription || null,
        govtSchemesAvailed: form.govtSchemesAvailed
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
        <TopBar title={t('survey.section.identity')} subtitle={t('common.loading')} />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-ink-400">{t('common.loading')}</p>
        </main>
      </>
    )
  }

  if (saved) {
    return (
      <>
        <TopBar title={t('survey.updated')} subtitle={t('survey.updatedHint')} />
        <main className="flex flex-1 items-center justify-center p-4 md:p-8">
          <div className="card w-full max-w-md p-6 text-center sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <i className="ti ti-check text-3xl" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-ink-900">{t('survey.updated')}</h2>
            <p className="mt-1 text-sm text-ink-500">{t('survey.updatedHint')}</p>
            <p className="mt-4 rounded-lg bg-ink-50 py-3 font-mono text-2xl tracking-widest text-ink-800">{houseCode}</p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button className="btn-secondary flex-1" onClick={() => navigate('/field/my-surveys')}>
                {t('survey.backToMySurveys')}
              </button>
              <button className="btn-primary flex-1" onClick={() => navigate('/field/my-surveys')}>
                {t('survey.viewSurvey')}
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
      <TopBar title={t('nav.mySurveys')} subtitle={`${step + 1} / ${SECTIONS.length} · ${section.title}`} />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-2xl lg:max-w-3xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => i <= step && setStep(i)}
                  disabled={i > step}
                  className={`flex flex-col items-center gap-1.5 group ${
                    i <= step ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                      i < step
                        ? 'bg-clay-500 text-white'
                        : i === step
                        ? 'ring-2 ring-clay-500 bg-clay-500 text-white'
                        : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {i < step ? (
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`hidden text-[10px] leading-tight text-center max-w-[70px] sm:block ${
                      i <= step ? 'text-clay-700 font-medium' : 'text-ink-400'
                    }`}
                  >
                    {t(`survey.section.${s.id}`).length > 20
                      ? t(`survey.section.${s.id}`).substring(0, 18) + '…'
                      : t(`survey.section.${s.id}`)}
                  </span>
                </button>
              ))}
            </div>
            {/* Connecting line behind circles */}
            <div className="relative -mt-6 mx-auto w-[90%]">
              <div className="h-0.5 bg-ink-100 rounded-full">
                <div
                  className="h-0.5 bg-clay-500 rounded-full transition-all duration-300"
                  style={{ width: `${(step / (SECTIONS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-6 lg:p-8">
            {section.id === 'identity' && form && (
              <div className="space-y-6">
                {/* QR ID */}
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600">
                    <i className="ti ti-qrcode text-base" aria-hidden="true" />
                    <span>{t('survey.qrId')}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">
                    <i className="ti ti-hash text-ink-400 shrink-0" aria-hidden="true" />
                    <span className="font-mono tracking-widest">{form.houseCode}</span>
                  </div>
                </div>

                {/* Personal Details */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-ink-100 pb-2 text-sm font-semibold text-ink-600">
                    <i className="ti ti-user text-base" aria-hidden="true" />
                    <span>{t('survey.name')} &amp; {t('survey.mobile')}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label">{t('survey.name')} <span className="text-red-500">*</span></label>
                      <input
                        className={`field-input ${getFieldError('headName') ? 'field-input-error' : ''}`}
                        value={form.headName}
                        onChange={e => update('headName', e.target.value)}
                      />
                      {getFieldError('headName') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('headName')}</p>}
                    </div>
                    <div>
                      <label className="field-label">{t('survey.mobile')} <span className="text-red-500">*</span></label>
                      <input
                        className={`field-input ${getFieldError('phone') ? 'field-input-error' : ''}`}
                        inputMode="numeric" maxLength={10}
                        value={form.phone}
                        onChange={e => update('phone', e.target.value.replace(/\D/g, ''))}
                      />
                      {getFieldError('phone') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('phone')}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label">{t('survey.email')} <span className="text-ink-300 text-xs">({t('common.optional')})</span></label>
                      <input
                        className={`field-input ${getFieldError('email') ? 'field-input-error' : ''}`}
                        type="email" value={form.email}
                        onChange={e => update('email', e.target.value)}
                      />
                      {getFieldError('email') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('email')}</p>}
                    </div>
                  </div>
                </div>

                {/* Address & Property */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-ink-100 pb-2 text-sm font-semibold text-ink-600">
                    <i className="ti ti-map text-base" aria-hidden="true" />
                    <span>{t('survey.state')} &amp; {t('survey.propertyType')}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label">{t('survey.state')} <span className="text-red-500">*</span></label>
                      <select className="field-input" value={form.state} onChange={e => update('state', e.target.value)}>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">{t('survey.propertyType')} <span className="text-red-500">*</span></label>
                      <select className="field-input" value={form.propertyType} onChange={e => update('propertyType', e.target.value)}>
                        <option value="">{t('common.select')}</option>
                        {propertyTypes.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section.id === 'household' && form && (
              <div className="space-y-6">
                {/* Location Details */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-ink-100 pb-2 text-sm font-semibold text-ink-600">
                    <i className="ti ti-map-pins text-base" aria-hidden="true" />
                    <span>{t('survey.district')} &amp; {t('survey.taluka')}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label">{t('survey.district')} <span className="text-red-500">*</span></label>
                      <select className="field-input" value={form.district} onChange={e => update('district', e.target.value)}>
                        {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">{t('survey.taluka')} <span className="text-red-500">*</span></label>
                      <select className="field-input" value={form.taluk} onChange={e => update('taluk', e.target.value)}>
                        {(talukMap[form.district] || []).map(t2 => <option key={t2} value={t2}>{t2}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Details */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-ink-100 pb-2 text-sm font-semibold text-ink-600">
                    <i className="ti ti-home text-base" aria-hidden="true" />
                    <span>Village, Ward &amp; House</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="field-label">{t('survey.village')} <span className="text-red-500">*</span></label>
                      <input className={`field-input ${getFieldError('villageName') ? 'field-input-error' : ''}`} value={form.villageName} onChange={e => update('villageName', e.target.value)} />
                      {getFieldError('villageName') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('villageName')}</p>}
                    </div>
                    <div>
                      <label className="field-label">{t('survey.wardPanchayat')} <span className="text-red-500">*</span></label>
                      <input className={`field-input ${getFieldError('wardPanchayat') ? 'field-input-error' : ''}`} value={form.wardPanchayat} onChange={e => update('wardPanchayat', e.target.value)} />
                      {getFieldError('wardPanchayat') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('wardPanchayat')}</p>}
                    </div>
                    <div>
                      <label className="field-label">{t('survey.houseNumber')} <span className="text-red-500">*</span></label>
                      <input className={`field-input ${getFieldError('houseNumber') ? 'field-input-error' : ''}`} value={form.houseNumber} onChange={e => update('houseNumber', e.target.value)} />
                      {getFieldError('houseNumber') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('houseNumber')}</p>}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-ink-100 pb-2 text-sm font-semibold text-ink-600">
                    <i className="ti ti-phone text-base" aria-hidden="true" />
                    <span>Contact Information</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label">{t('survey.headName')}</label>
                      <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">
                        <i className="ti ti-user text-ink-400 shrink-0" aria-hidden="true" />
                        <span className="truncate">{form.headName || '—'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="field-label">{t('survey.headMobile')}</label>
                      <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">
                        <i className="ti ti-device-mobile text-ink-400 shrink-0" aria-hidden="true" />
                        <span className="font-mono">{form.phone || '—'}</span>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label">{t('survey.alternateMobile')} <span className="text-ink-300 text-xs">({t('common.optional')})</span></label>
                      <input className={`field-input ${getFieldError('alternatePhone') ? 'field-input-error' : ''}`} inputMode="numeric" maxLength={10} value={form.alternatePhone} onChange={e => update('alternatePhone', e.target.value.replace(/\D/g, ''))} />
                      {getFieldError('alternatePhone') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('alternatePhone')}</p>}
                    </div>
                    <div>
                      <label className="field-label">{t('survey.headAge')} <span className="text-red-500">*</span></label>
                      <input className={`field-input ${getFieldError('headAge') ? 'field-input-error' : ''}`} inputMode="numeric" maxLength={3} value={form.headAge} onChange={e => update('headAge', e.target.value.replace(/\D/g, ''))} placeholder={t('survey.agePlaceholder')} />
                      {getFieldError('headAge') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('headAge')}</p>}
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div>
                  <div className="mb-3 flex items-center gap-2 border-b border-ink-100 pb-2 text-sm font-semibold text-ink-600">
                    <i className="ti ti-users text-base" aria-hidden="true" />
                    <span>Demographics</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="field-label">{t('survey.familyMembers')} <span className="text-red-500">*</span></label>
                      <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${getFieldError('familySizeBand') ? 'ring-2 ring-red-300 rounded-lg p-1' : ''}`}>
                        {familySizeBands.map(b => (
                          <button type="button" key={b.id} onClick={() => update('familySizeBand', b.id)} className={`chip ${form.familySizeBand === b.id ? 'chip-selected' : ''} focus-ring justify-center`}>{b.label}</button>
                        ))}
                      </div>
                      {getFieldError('familySizeBand') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('familySizeBand')}</p>}
                    </div>
                    <div>
                      <label className="field-label">{t('survey.monthlyIncome')} <span className="text-red-500">*</span></label>
                      <select className={`field-input ${getFieldError('incomeBracket') ? 'field-input-error' : ''}`} value={form.incomeBracket} onChange={e => update('incomeBracket', e.target.value)}>
                        <option value="">{t('common.select')}</option>
                        {incomeBrackets.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                      </select>
                      {getFieldError('incomeBracket') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('incomeBracket')}</p>}
                    </div>
                    <div>
                      <label className="field-label">{t('survey.occupation')} <span className="text-red-500">*</span></label>
                      <select className={`field-input ${getFieldError('occupation') ? 'field-input-error' : ''}`} value={form.occupation} onChange={e => update('occupation', e.target.value)}>
                        <option value="">{t('common.select')}</option>
                        {occupations.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                      {getFieldError('occupation') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('occupation')}</p>}
                    </div>
                    <div>
                      <label className="field-label">{t('survey.facilities')} <span className="text-red-500">*</span></label>
                      <MultiSelect options={facilityOptions} selected={form.facilities} onChange={v => update('facilities', v)} />
                      {getFieldError('facilities') && <p className="field-error-text"><i className="ti ti-alert-circle" aria-hidden="true" />{getFieldError('facilities')}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section.id === 'location' && form && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl bg-clay-50 p-4">
                  <i className="ti ti-info-circle text-clay-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-clay-700">{t('survey.locationHint')}</p>
                </div>

                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <button type="button" onClick={handleGetLiveGps} className="btn-primary w-full sm:w-auto" disabled={gpsStatus === 'locating'}>
                    <i className={`ti ti-map-pin text-base ${gpsStatus === 'locating' ? 'animate-bounce' : ''}`} aria-hidden="true" />
                    {gpsStatus === 'locating' ? t('survey.gettingLocation') : t('survey.getLocation')}
                  </button>
                  {gpsStatus === 'done' && (
                    <span className="flex items-center gap-1 text-sm text-emerald-600">
                      <i className="ti ti-circle-check" aria-hidden="true" />
                      Location captured
                    </span>
                  )}
                </div>

                {gpsStatus === 'locating' && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <i className="ti ti-loader animate-spin text-base" aria-hidden="true" />
                    <span>{t('survey.gettingLocation')}</span>
                  </div>
                )}
                {gpsStatus === 'error' && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    <i className="ti ti-alert-circle text-base" aria-hidden="true" />
                    <span>{t('survey.locationError')}</span>
                  </div>
                )}

                {(form.latitude || gpsStatus === 'done' || gpsStatus === 'error') && (
                  <div className="rounded-xl border border-ink-200 bg-ink-50 p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">GPS Coordinates</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 border border-ink-100">
                        <i className="ti ti-arrow-up-right text-ink-400 shrink-0 text-lg" aria-hidden="true" />
                        <div>
                          <p className="text-xs text-ink-400">{t('survey.latitude')}</p>
                          <p className="font-mono text-lg font-semibold text-ink-800">{form.latitude || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 border border-ink-100">
                        <i className="ti ti-arrow-right text-ink-400 shrink-0 text-lg" aria-hidden="true" />
                        <div>
                          <p className="text-xs text-ink-400">{t('survey.longitude')}</p>
                          <p className="font-mono text-lg font-semibold text-ink-800">{form.longitude || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!form.latitude && gpsStatus !== 'locating' && (
                  <div className="rounded-xl border border-dashed border-ink-200 p-4 text-center">
                    <p className="text-xs text-ink-400">No GPS coordinates captured yet. Click "Get Location" above or fill manually below.</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="field-label text-xs">{t('survey.latitude')}</label>
                        <input className="field-input font-mono text-sm" value={form.latitude} onChange={e => update('latitude', e.target.value.replace(/[^0-9.\-]/g, ''))} placeholder="e.g. 17.329931" />
                      </div>
                      <div>
                        <label className="field-label text-xs">{t('survey.longitude')}</label>
                        <input className="field-input font-mono text-sm" value={form.longitude} onChange={e => update('longitude', e.target.value.replace(/[^0-9.\-]/g, ''))} placeholder="e.g. 76.834259" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {section.id === 'photo' && form && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-clay-50 p-4">
                  <i className="ti ti-info-circle text-clay-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-clay-700">{t('survey.photoHint')}</p>
                </div>

                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 p-8 text-center transition-colors hover:border-clay-300 hover:bg-clay-50/30"
                >
                  {form.photoDataUrl ? (
                    <div className="relative w-full max-w-sm">
                      <img src={form.photoDataUrl} alt="Household" className="h-44 w-full rounded-lg object-cover shadow-sm sm:h-56" />
                      <button
                        type="button"
                        onClick={() => update('photoDataUrl', null)}
                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
                        aria-label={t('survey.removePhoto')}
                      >
                        <i className="ti ti-x text-sm" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100">
                        <i className="ti ti-camera text-2xl text-ink-400" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-600">{t('survey.dragPhoto')}</p>
                        <p className="mt-1 text-xs text-ink-400">or use the buttons below</p>
                      </div>
                    </>
                  )}
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                      <i className="ti ti-camera text-base" aria-hidden="true" />
                      {form.photoDataUrl ? 'Change photo' : t('survey.capturePhoto')}
                    </button>
                    {form.photoDataUrl && (
                      <button type="button" className="btn-secondary" onClick={() => update('photoDataUrl', null)}>
                        <i className="ti ti-trash text-base" aria-hidden="true" />
                        {t('survey.removePhoto')}
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhotoFile(e.target.files?.[0])} />
                </div>
              </div>
            )}

            {section.id === 'issues' && form && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                  <i className="ti ti-alert-triangle text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-amber-700">Select any major issues the household is facing, and provide a detailed description if needed.</p>
                </div>
                <div>
                  <label className="field-label">{t('survey.majorIssues')}</label>
                  <MultiSelect options={problemOptions} selected={form.problems} onChange={v => update('problems', v)} />
                </div>
                <div>
                  <label className="field-label">{t('survey.grievanceDetail')}</label>
                  <textarea className="field-input min-h-[120px] resize-y" value={form.grievanceDescription} onChange={e => update('grievanceDescription', e.target.value)} />
                </div>
              </div>
            )}

            {section.id === 'schemes' && form && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                  <i className="ti ti-government text-emerald-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-emerald-700">Select any government schemes or facilities that this household has availed.</p>
                </div>
                <div>
                  <label className="field-label">{t('survey.govtSchemes')}</label>
                  <MultiSelect options={govtSchemeOptions} selected={form.govtSchemesAvailed} onChange={v => update('govtSchemesAvailed', v)} />
                  {form.govtSchemesAvailed.length === 0 && (
                    <p className="mt-2 text-xs text-ink-400 flex items-center gap-1">
                      <i className="ti ti-info-circle" aria-hidden="true" />
                      If none, you can leave this empty and continue.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {submitError && (
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <i className="ti ti-alert-circle mt-0.5 shrink-0 text-base" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {step > 0 && (
              <button className="btn-secondary flex-1 sm:flex-none sm:px-10" onClick={() => setStep(s => s - 1)}>
                <i className="ti ti-arrow-left text-base sm:hidden" aria-hidden="true" />
                <span>{t('common.back')}</span>
              </button>
            )}
            <div className="flex flex-1 gap-3">
              {step < SECTIONS.length - 1 ? (
                <button className="btn-primary flex-1" disabled={!canProceed()} onClick={() => setStep(s => s + 1)}>
                  <span>{t('common.continue')}</span>
                  <i className="ti ti-arrow-right text-base" aria-hidden="true" />
                </button>
              ) : (
                <button className="btn-accent flex-1" disabled={submitting || !canProceed()} onClick={handleSubmit}>
                  {submitting ? (
                    <><i className="ti ti-loader animate-spin text-base" aria-hidden="true" /> {t('survey.saving')}</>
                  ) : (
                    <><i className="ti ti-check text-base" aria-hidden="true" /> {t('survey.saveChanges')}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
