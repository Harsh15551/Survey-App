# Veerbhadreshwar Trust — Household Survey Frontend

React (Vite) frontend for the Gulbarga & Bidar household survey app, covering all
four roles: Admin, Supervisor Admin, Field Agent, and Citizen.

This is a **frontend-only build with mock data** (`src/data/mockData.js`) standing
in for your backend, so you can review and demo the full UI/UX before the API exists.
Every place that needs a real network call is marked with a comment like:

```js
// In production: POST /api/surveys { ...form, fieldAgentId: user.id }
```

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Demo accounts

Staff login (`/login`) — phone number + any password 4+ characters:

| Role | Phone |
|---|---|
| Admin | `9900011122` |
| Supervisor Admin | `9900022233` or `9900033344` |
| Field Agent | `9900044455`, `9900055566`, `9900066677` |

Citizen login (`/citizen/login` or scan a QR from **Admin → QR codes**):
- House ID: any ID from the mock households (e.g. `100001`)
- Phone: must match that household's phone (visible in `mockData.js`)
- OTP: `123456` (hardcoded for the demo)

## Project structure

```
src/
  context/AuthContext.jsx   — mock auth; swap staffLogin/citizenRequestOtp/
                               citizenVerifyOtp internals for real API calls
  data/mockData.js          — stand-in for backend responses; also holds all
                               dropdown option lists (problems, schemes, etc.)
  components/layout/        — Sidebar, TopBar, AppShell (role-based route guard)
  components/ui/            — Badge, StatCard, Modal, MultiSelect
  pages/admin/               — Dashboard, households table, user management, QR codes
  pages/supervisor/          — Dashboard, field agent activity monitoring
  pages/fieldagent/          — Home, 6-section new survey form, survey list
  pages/citizen/             — OTP login, household view, emergency numbers, grievance
  utils/exportData.js       — CSV (Excel-compatible) + print-to-PDF export helpers
```

## Wiring up your real backend

1. **Auth** — replace the three functions in `AuthContext.jsx` with calls to your
   `/api/auth/*` endpoints; store the JWT instead of the raw user object.
2. **Data fetching** — every page currently imports directly from `mockData.js`.
   Replace those imports with a data-fetching hook (React Query is a good fit)
   that calls your REST API, keeping the same shape the components expect.
3. **Survey submission** — `NewSurvey.jsx`'s `handleSubmit` currently generates a
   house ID client-side for the demo. In production, that ID must come from the
   server (`POST /api/surveys`) so uniqueness is guaranteed across all field agents.
4. **Exports** — `utils/exportData.js` does browser-only CSV/print-to-PDF. Swap for
   calls to a backend export endpoint once you want real `.xlsx`/`.pdf` files and
   server-side audit logging of exports.
5. **QR codes** — `AdminQrCodes.jsx` encodes `https://app.veerbhadreshwartrust.in/h/{houseId}`.
   Update `CITIZEN_BASE_URL` to your real deployed domain before printing plates.
6. **Offline support for field agents** — not yet implemented here. Add a service
   worker + IndexedDB queue (e.g. via `workbox` or `idb`) so `NewSurvey.jsx` can
   save submissions locally and sync when connectivity returns — important for
   rural coverage areas.

## Design notes

- Palette: deep ink-navy for structure/chrome, a terracotta-clay accent for primary
  actions — a civic, legible palette rather than a generic SaaS blue.
- Field Agent's survey form is a 6-step wizard (not one long scroll) since it's
  filled standing at a doorstep, often on a small screen.
- Citizen portal is a separate, simpler visual shell (no sidebar) since it's a
  single household's read-only view reached via QR, not a work dashboard.
