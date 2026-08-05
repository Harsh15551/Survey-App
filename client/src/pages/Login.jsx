import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'

const HOME_BY_ROLE = { admin: '/admin', supervisor: '/supervisor', field_agent: '/field' }

export default function Login() {
  const { staffLogin, role } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (role) return <Navigate to={HOME_BY_ROLE[role] || '/'} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = await staffLogin(phone.trim(), password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(HOME_BY_ROLE[result.user.role] || '/')
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-ink-900 px-4">
      {/* Absolute top-right language switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher dark />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-clay-500 text-base font-bold text-white">VT</div>
          <h1 className="text-xl font-semibold tracking-wide text-white">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-ink-400">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="field-label" htmlFor="phone">{t('login.phone')}</label>
            <input
              id="phone"
              type="tel"
              className="field-input"
              placeholder={t('login.phonePlaceholder')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">{t('login.password')}</label>
            <input
              id="password"
              type="password"
              className="field-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>
          )}

          <button type="submit" className="btn-accent w-full">{t('login.signIn')}</button>

          <p className="text-center text-xs text-ink-400">
            {t('login.demoAccounts')}
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          {t('login.citizenPrompt')}{' '}
          <Link to="/citizen/login" className="font-medium text-clay-400 hover:text-clay-300">
            {t('login.citizenLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
