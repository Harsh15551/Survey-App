import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import CitizenLogin from './pages/citizen/CitizenLogin'
import CitizenHousehold from './pages/citizen/CitizenHousehold'
import EmergencyNumbers from './pages/citizen/EmergencyNumbers'
import GrievanceForm from './pages/citizen/GrievanceForm'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminHouseholds from './pages/admin/AdminHouseholds'
import AdminUsers from './pages/admin/AdminUsers'
import AdminQrCodes from './pages/admin/AdminQrCodes'
import AdminSupervisors from './pages/admin/AdminSupervisors'
import AdminGrievances from './pages/admin/AdminGrievances'

import SupervisorDashboard from './pages/supervisor/SupervisorDashboard'
import SupervisorTeam from './pages/supervisor/SupervisorTeam'
import SupervisorSurveys from './pages/supervisor/SupervisorSurveys'
import SupervisorGrievances from './pages/supervisor/SupervisorGrievances'

import FieldAgentHome from './pages/field-agent/FieldAgentHome'
import NewSurvey from './pages/field-agent/NewSurvey'
import MySurveys from './pages/field-agent/MySurveys'
import EditSurvey from './pages/field-agent/EditSurvey'

const HOME_BY_ROLE = { admin: '/admin', supervisor: '/supervisor', field_agent: '/field', citizen: '/citizen' }

function RoleRedirect() {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  return <Navigate to={HOME_BY_ROLE[role]} replace />
}

function RequireCitizen({ children }) {
  const { role } = useAuth()
  if (role !== 'citizen') return <Navigate to="/citizen/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />

      {/* Staff auth */}
      <Route path="/login" element={<Login />} />

      {/* Citizen auth + QR entry point (/h/:houseIdParam) */}
      <Route path="/citizen/login" element={<CitizenLogin />} />
      <Route path="/h/:houseIdParam" element={<CitizenLogin />} />
      <Route path="/citizen" element={<RequireCitizen><CitizenHousehold /></RequireCitizen>} />
      <Route path="/citizen/emergency" element={<RequireCitizen><EmergencyNumbers /></RequireCitizen>} />
      <Route path="/citizen/grievance" element={<RequireCitizen><GrievanceForm /></RequireCitizen>} />

      {/* Admin */}
      <Route element={<AppShell allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/households" element={<AdminHouseholds />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/supervisors" element={<AdminSupervisors />} />
        <Route path="/admin/qr-codes" element={<AdminQrCodes />} />
        <Route path="/admin/grievances" element={<AdminGrievances />} />
      </Route>

      {/* Supervisor admin */}
      <Route element={<AppShell allowedRoles={['supervisor']} />}>
        <Route path="/supervisor" element={<SupervisorDashboard />} />
        <Route path="/supervisor/team" element={<SupervisorTeam />} />
        <Route path="/supervisor/surveys" element={<SupervisorSurveys />} />
        <Route path="/supervisor/grievances" element={<SupervisorGrievances />} />
      </Route>

      {/* Field agent */}
      <Route element={<AppShell allowedRoles={['field_agent']} />}>
        <Route path="/field" element={<FieldAgentHome />} />
        <Route path="/field/new-survey" element={<NewSurvey />} />
        <Route path="/field/my-surveys" element={<MySurveys />} />
        <Route path="/field/edit/:houseCode" element={<EditSurvey />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
