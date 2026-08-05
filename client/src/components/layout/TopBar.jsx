import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'

export default function TopBar({ title, subtitle }) {
  const { logout, user } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-ink-100 bg-white px-4 py-4 md:px-8">
      <div>
        <h1 className="text-lg font-semibold text-ink-900 md:text-xl">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink-800">{user?.name}</p>
          <p className="text-xs text-ink-400">{user?.phone}</p>
        </div>
        <button onClick={logout} className="btn-secondary !px-3 !py-2" aria-label="Log out">
          <i className="ti ti-logout text-base" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
