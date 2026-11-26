
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'


import { AuthProvider } from './context/AuthContext'
import { TeamProvider } from './context/TeamProvider'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'

import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Team from './pages/Team'
import Login from './pages/Login'
import Register from './pages/Register'

const App = () => {
  return (
    <AuthProvider>
      <TeamProvider>
        <BrowserRouter>
          <Routes>
            {/* Public authentication pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected workspace pages */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/team" element={<Team />} />
              </Route>
            </Route>

            {/* Unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TeamProvider>
    </AuthProvider>
  )
}

export default App