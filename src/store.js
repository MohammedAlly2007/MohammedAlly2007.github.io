import React from 'react'
// Lightweight localStorage-backed store with cross-component sync.
const KEY = 'smartsoko_board_finance_v3'
const EVT = 'ssbf:change'

const defaultState = () => ({
  users: [
    { id: 'u1', email: 'cfo@smartsoko.co.tz', name: 'CFO (Msimamizi Mkuu)', role: 'cfo', passwordHash: null, memberId: null, _pw: 'smartsoko123' },
    { id: 'u2', email: 'ceo@smartsoko.co.tz', name: 'CEO / Mkurugenzi', role: 'ceo', passwordHash: null, memberId: null, _pw: 'smartsoko123' },
    { id: 'u4', email: 'accountantsmartsokosuleyman@khamisi', name: 'Mhasibu (Accountant) — Suleyman', role: 'accountant', passwordHash: null, memberId: null, _pw: '20062006' },
    { id: 'u5', email: 'Itdepartmentpassword@ahmad', name: 'IT Department', role: 'accountant', passwordHash: null, memberId: null, _pw: '88778877' },
  ],
  members: [],
  campaigns: [],
  payments: [],
  expenses: [],
  budgets: [],
  audit: [],
  session: null,
})

// password for all seeded users = 'smartsoko123'
export async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export async function ensureSeed() {
  const raw = localStorage.getItem(KEY)
  const base = defaultState()
  const hashedUsers = await Promise.all(base.users.map(async (u) => {
    const { _pw, ...rest } = u
    return { ...rest, passwordHash: await hashPassword(_pw || 'smartsoko123') }
  }))

  if (!raw) {
    base.users = hashedUsers
    localStorage.setItem(KEY, JSON.stringify(base))
    return
  }

  // Merge: add any missing seeded users (by email) without wiping existing data/passwords.
  try {
    const state = JSON.parse(raw)
    if (!Array.isArray(state.users)) state.users = []
    const existing = new Set(state.users.map((u) => String(u.email || '').toLowerCase()))
    for (const u of hashedUsers) {
      if (!existing.has(String(u.email).toLowerCase())) {
        state.users.push(u)
        existing.add(String(u.email).toLowerCase())
      }
      // Do not overwrite passwordHash/role/name of existing accounts.
    }
    if (!state.session) state.session = null
    // Backfill collections introduced by newer versions so old saves keep working.
    ;['users', 'members', 'campaigns', 'payments', 'expenses', 'budgets', 'audit'].forEach((key) => {
      if (!Array.isArray(state[key])) state[key] = []
    })
    // Remove any leftover demo data from previous versions (by known demo ids).
    const demoMemberIds = new Set(['m1', 'm2', 'm3'])
    const demoCampaignIds = new Set(['c1'])
    if (Array.isArray(state.members)) state.members = state.members.filter((m) => !demoMemberIds.has(m.id))
    if (Array.isArray(state.campaigns)) state.campaigns = state.campaigns.filter((c) => !demoCampaignIds.has(c.id))
    if (Array.isArray(state.payments)) state.payments = state.payments.filter((p) => !demoMemberIds.has(p.memberId) && !demoCampaignIds.has(p.campaignId))
    if (Array.isArray(state.expenses)) state.expenses = state.expenses.filter((e) => !['e1', 'e2', 'e3'].includes(e.id))
    if (Array.isArray(state.budgets)) state.budgets = state.budgets.filter((b) => b.id !== 'b1')
    if (Array.isArray(state.audit)) state.audit = state.audit.filter((a) => a.id !== 'a1')
    // Remove the demo member user account.
    if (Array.isArray(state.users)) state.users = state.users.filter((u) => u.id !== 'u3' && String(u.email || '').toLowerCase() !== 'juma@smartsoko.co.tz')
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    base.users = hashedUsers
    localStorage.setItem(KEY, JSON.stringify(base))
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getState() { return loadState() || defaultState() }

export function setState(updater) {
  const s = getState()
  const next = typeof updater === 'function' ? updater(s) : updater
  saveState(next)
  return next
}

export function useStore() {
  const [state, setLocal] = React.useState(getState())
  React.useEffect(() => {
    const handler = () => setLocal(getState())
    window.addEventListener(EVT, handler)
    window.addEventListener('storage', handler)
    return () => { window.removeEventListener(EVT, handler); window.removeEventListener('storage', handler) }
  }, [])
  return state
}

// helpers
export const money = (n) => new Intl.NumberFormat('sw-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(Number(n || 0))

export function genId(prefix = 'id') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}` }

export async function login(email, password) {
  const s = getState()
  const u = s.users.find(x => x.email.toLowerCase() === email.toLowerCase())
  if (!u) return { ok: false, error: 'Mtumiaji hajapatikana.' }
  const h = await hashPassword(password)
  if (h !== u.passwordHash) return { ok: false, error: 'Nenosiri si sahihi.' }
  const session = { userId: u.id, role: u.role, name: u.name, memberId: u.memberId }
  setState(prev => ({ ...prev, session }))
  return { ok: true, session }
}

export function logout() { setState(prev => ({ ...prev, session: null })) }

export function auditLog(action, detail = '') {
  setState(prev => ({
    ...prev,
    audit: [{ id: genId('a'), action, detail, user: prev.session?.name || 'Mfumo', role: prev.session?.role || '', at: new Date().toISOString() }, ...(prev.audit || [])].slice(0, 500)
  }))
}

export function currentSession() { return getState().session }

export function roleLabel(role) {
  if (role === 'cfo') return 'CFO (Super Admin)'
  if (role === 'accountant') return 'Mhasibu (Accountant)'
  if (role === 'ceo') return 'CEO / Mkurugenzi'
  return 'Mwanachama'
}

// calculations
export function memberExpected(member, campaigns) {
  const base = Number(member.requiredAmount || 0)
  const special = (campaigns || []).reduce((sum, c) => sum + Number(c.perMemberAmount || 0), 0)
  return base + special
}

export function memberPaid(memberId, payments) {
  return (payments || []).filter(p => p.memberId === memberId).reduce((s, p) => s + Number(p.amount || 0), 0)
}

export function memberStatus(member, campaigns, payments) {
  const exp = memberExpected(member, campaigns)
  const paid = memberPaid(member.id, payments)
  if (paid <= 0) return 'none'
  if (paid >= exp) return 'complete'
  return 'owes'
}

export function totalCollected(payments) { return (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0) }

// Expenses count towards the fund only once approved. Records created before the
// approval workflow existed have no status, so they are treated as approved.
export function isApproved(expense) { return (expense?.status || 'approved') === 'approved' }
export function approvedExpenses(expenses) { return (expenses || []).filter(isApproved) }
export function pendingExpenses(expenses) { return (expenses || []).filter(e => e.status === 'pending') }
export function totalExpenses(expenses) { return approvedExpenses(expenses).reduce((s, e) => s + Number(e.amount || 0), 0) }
export function balance(payments, expenses) { return totalCollected(payments) - totalExpenses(expenses) }

export function expensesInPeriod(expenses, period) {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const y = String(now.getFullYear())
  return approvedExpenses(expenses).filter(e => {
    const d = String(e.date || '')
    return period === 'yearly' ? d.slice(0, 4) === y : d.slice(0, 7) === ym
  })
}

export function memberDebt(member, campaigns, payments) {
  return Math.max(0, memberExpected(member, campaigns) - memberPaid(member.id, payments))
}

export function paymentTotalForCampaign(payments, campaignId) {
  return (payments || []).filter(p => p.campaignId === campaignId).reduce((s, p) => s + Number(p.amount || 0), 0)
}

export function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function initials(name = '') {
  return String(name).trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
}