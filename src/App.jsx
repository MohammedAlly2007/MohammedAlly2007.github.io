import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ensureSeed, useStore, logout, refreshFromCloud, notifyChange, syncNow } from './store'
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
import LiveChat from './pages/LiveChat'
import Splash from './components/Splash'

export default function App() {
  const [ready, setReady] = useState(false)
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const state = useStore()
  const session = state.session

  useEffect(() => { ensureSeed().then(() => { notifyChange(); setReady(true) }) }, [])

  // Shared cloud database: keep everyone's data in sync without a reload.
  useEffect(() => {
    if (!session) return
    let alive = true
    const tick = () => { if (alive) refreshFromCloud().catch(() => {}) }
    const onVisible = () => { if (document.visibilityState === 'visible') tick() }
    const id = setInterval(tick, 25000)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearInterval(id)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [session])

  // React to connectivity changes: when the network returns, push any data
  // that was saved while offline and pull the latest from the cloud.
  useEffect(() => {
    const onOnline = () => { setOnline(true); if (session) syncNow().catch(() => {}) }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [session])

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

  if (!ready) return <Splash />

  const isAuth = !!session
  const isCFO = session?.role === 'cfo'
  const canEdit = ['cfo', 'accountant', 'ceo'].includes(session?.role)

  return (
    <>
    {!online && (
      <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-xs font-semibold text-center py-1.5 shadow-md no-print">
        Hakuna mtandao — data inahifadhiwa kwenye kifaa hiki; itasawazishwa mtandao urudi.
      </div>
    )}
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
              <Route path="/chat" element={<LiveChat />} />
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