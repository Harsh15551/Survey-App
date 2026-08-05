import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

const NAV_BY_ROLE = {
  admin: [
    { to: '/admin', labelKey: 'nav.dashboard', icon: 'ti-layout-dashboard', end: true },
    { to: '/admin/supervisors', labelKey: 'nav.supervisors', icon: 'ti-user-check' },
    { to: '/admin/households', labelKey: 'nav.surveyData', icon: 'ti-table' },
    { to: '/admin/grievances', labelKey: 'nav.grievances', icon: 'ti-alert-circle' },
    { to: '/admin/users', labelKey: 'nav.teamAccess', icon: 'ti-users' },
    { to: '/admin/qr-codes', labelKey: 'nav.qrCodes', icon: 'ti-qrcode' }
  ],
  supervisor: [
    { to: '/supervisor', labelKey: 'nav.dashboard', icon: 'ti-layout-dashboard', end: true },
    { to: '/supervisor/team', labelKey: 'nav.fieldAgents', icon: 'ti-users' },
    { to: '/supervisor/surveys', labelKey: 'nav.surveys', icon: 'ti-clipboard-text' },
    { to: '/supervisor/grievances', labelKey: 'nav.grievances', icon: 'ti-alert-circle' }
  ],
  field_agent: [
    { to: '/field', labelKey: 'nav.home', icon: 'ti-home', end: true },
    { to: '/field/new-survey', labelKey: 'nav.newSurvey', icon: 'ti-clipboard-plus' },
    { to: '/field/my-surveys', labelKey: 'nav.mySurveys', icon: 'ti-list-details' }
  ]
}

const ROLE_LABEL_KEY = {
  admin: 'role.admin',
  supervisor: 'role.supervisor',
  field_agent: 'role.field_agent'
}

export default function Sidebar({ role, userName }) {
  const { t } = useLanguage()
  const items = NAV_BY_ROLE[role] || []

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink-900 text-ink-100 md:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay-500 text-sm font-bold text-white">VT</div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-white leading-tight">{t('app.name')}</p>
          <p className="text-xs text-ink-400">{t('app.tagline')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
                isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:bg-ink-800/60 hover:text-white'
              }`
            }
          >
            <i className={`ti ${item.icon} text-lg`} aria-hidden="true" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-800 px-6 py-4">
        <p className="text-xs uppercase tracking-wide text-ink-500">{t(ROLE_LABEL_KEY[role])}</p>
        <p className="truncate text-sm font-medium text-white">{userName}</p>
      </div>
    </aside>
  )
}
