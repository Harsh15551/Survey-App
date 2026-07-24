import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { getAccessToken, setToken, clearToken } from '../api/client'

const AuthContext = createContext(null)

const STORAGE_KEY = 'survey_app_session'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  }, [session])

  // Map backend roles (ADMIN, SUPERVISOR, FIELD_AGENT) to frontend (admin, supervisor, field_agent)
  function mapRole(backendRole) {
    return backendRole.toLowerCase()
  }

  // Staff login (Admin / Supervisor / Field Agent) --------------------------
  async function staffLogin(phone, password) {
    const result = await authApi.staffLogin(phone, password)
    if (!result.ok) return result
    const user = { ...result.user, role: mapRole(result.user.role) }
    setSession({ type: 'staff', user })
    return { ok: true, user }
  }

  // Citizen login: houseCode + phone -> instant access --------------------
  async function citizenLogin(houseId, phone) {
    const result = await authApi.citizenLogin(houseId, phone)
    if (!result.ok) return result
    setSession({ type: 'citizen', houseId, phone, household: result.household })
    return { ok: true }
  }

  const handleLogout = useCallback(async () => {
    await authApi.logout()
    clearToken()
    setSession(null)
  }, [])

  const value = useMemo(() => ({
    session,
    role: session?.type === 'staff' ? session.user.role : session?.type === 'citizen' ? 'citizen' : null,
    user: session?.type === 'staff' ? session.user : null,
    isAuthenticated: !!session && !!getAccessToken(),
    staffLogin,
    citizenLogin,
    logout: handleLogout
  }), [session, handleLogout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
