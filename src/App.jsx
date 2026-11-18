import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ensureSeed, useStore, logout } from './store'
import Login from './pages/Login'
import Layout from './components/Layout'
import ToastContainer from './components/Toast'
import ConfirmModal from './components/ConfirmModal'
import GlobalSearch from './components/GlobalSearch'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Contributions from './pages/Contributions'
import Payments from './pages/Payments'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import AuditLog from './pages/AuditLog'
import Budgets from './pages/Budgets'
import MemberStatement from './pages/MemberStatement'

export default function App() {
  const [ready, setReady] = useState(false)
  const state = useStore()
  const session = state.session

  useEffect(() => { ensureSeed().then(() => setReady(true)) }, [])

  // Auto-logout after 30 minutes of inactivity
  useEffect(() => {
    if (!session) return
    let timer
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { logout(); window.location.href = '/login' }, 30 * 60 * 1000) }
    const events = ['mousemove', 'keydown', 'click', 'touchstart']
    events.forEach(e => window.addEventListener(e, reset))
    reset()
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)) }
  }, [session])

  if (!ready) return <div className="min-h-screen flex items-center justify-center">Inapakia...</div>

  const isAuth = !!session
  const isCFO = session?.role === 'cfo'
  const canEdit = ['cfo', 'accountant', 'ceo'].includes(session?.role)

  return (
    <>
    <ToastContainer />
    <ConfirmModal />
    <BrowserRouter>
      <GlobalSearch />
      <Routes>
        <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/*" element={isAuth ? (
          <Layout session={session}>
            <Routes>
              <Route path="/" element={<Dashboard canEdit={canEdit} />} />
              <Route path="/members" element={<Members canEdit={canEdit} />} />
              <Route path="/contributions" element={<Contributions canEdit={canEdit} />} />
              <Route path="/payments" element={<Payments canEdit={canEdit} />} />
              <Route path="/expenses" element={<Expenses canEdit={canEdit} />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={session?.role === 'cfo' ? <Settings /> : <Navigate to="/" />} />
              <Route path="/audit" element={session?.role === 'cfo' ? <AuditLog /> : <Navigate to="/" />} />
              <Route path="/budgets" element={<Budgets canEdit={canEdit} />} />
              <Route path="/statement/:id" element={<MemberStatement />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        ) : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}