import { NavLink } from 'react-router-dom'

const NAV_BY_ROLE = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: 'ti-layout-dashboard', end: true },
    { to: '/admin/supervisors', label: 'Supervisors', icon: 'ti-user-check' },
    { to: '/admin/households', label: 'Survey data', icon: 'ti-table' },
    { to: '/admin/users', label: 'Team & access', icon: 'ti-users' },
    { to: '/admin/qr-codes', label: 'QR codes', icon: 'ti-qrcode' }
  ],
  supervisor: [
    { to: '/supervisor', label: 'Dashboard', icon: 'ti-layout-dashboard', end: true },
    { to: '/supervisor/team', label: 'Field agents', icon: 'ti-users' },
    { to: '/supervisor/surveys', label: 'Surveys', icon: 'ti-clipboard-text' }
  ],
  field_agent: [
    { to: '/field', label: 'Home', icon: 'ti-home', end: true },
    { to: '/field/new-survey', label: 'New survey', icon: 'ti-clipboard-plus' },
    { to: '/field/my-surveys', label: 'My surveys', icon: 'ti-list-details' }
  ]
}

const ROLE_LABEL = {
  admin: 'Admin',
  supervisor: 'Supervisor Admin',
  field_agent: 'Field Agent'
}

export default function Sidebar({ role, userName }) {
  const items = NAV_BY_ROLE[role] || []

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink-900 text-ink-100 md:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay-500 text-sm font-bold text-white">VT</div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-white leading-tight">VEERBHADRESHWAR TRUST</p>
          <p className="text-xs text-ink-400">Gulbarga &amp; Bidar</p>
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
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-800 px-6 py-4">
        <p className="text-xs uppercase tracking-wide text-ink-500">{ROLE_LABEL[role]}</p>
        <p className="truncate text-sm font-medium text-white">{userName}</p>
      </div>
    </aside>
  )
}
