import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

export default function CitizenLogin() {
  const { houseIdParam } = useParams()
  const { citizenLogin, role } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [houseId, setHouseId] = useState(houseIdParam || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (role === 'citizen') return <Navigate to="/citizen" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await citizenLogin(houseId.trim(), password.trim())
    setLoading(false)
    if (!result.ok) return setError(result.error)
    navigate('/citizen')
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-ink-900 px-4 py-10">
      {/* Absolute top-right language switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher dark />
      </div>

      <div className="w-full max-w-sm sm:max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-clay-500 text-base font-bold text-white">VT</div>
          <p className="text-xs font-semibold tracking-wide text-ink-400">{t('login.title')}</p>
          <h1 className="mt-1 text-xl font-semibold text-white">{t('citizenLogin.title')}</h1>
          <p className="mt-1 text-sm text-ink-400">{t('citizenLogin.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="field-label" htmlFor="houseId">{t('citizenLogin.houseId')}</label>
            <input
              id="houseId"
              inputMode="numeric"
              maxLength={6}
              className="field-input tracking-widest"
              placeholder={t('citizenLogin.houseIdPlaceholder')}
              value={houseId}
              onChange={e => setHouseId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">{t('citizenLogin.password')}</label>
            <input
              id="password"
              inputMode="numeric"
              maxLength={8}
              className="field-input tracking-widest"
              placeholder={t('citizenLogin.passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value.replace(/\D/g, ''))}
              required
            />
            <p className="mt-1 text-xs text-ink-400">
              {t('citizenLogin.passwordHint')}
            </p>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t('citizenLogin.submitting') : t('citizenLogin.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          {t('citizenLogin.staffPrompt')}{' '}
          <Link to="/login" className="font-medium text-clay-400 hover:text-clay-300">
            {t('citizenLogin.staffLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
