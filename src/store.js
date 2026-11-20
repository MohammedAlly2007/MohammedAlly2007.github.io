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
  chat: [],
  session: null,
})

// password for all seeded users = 'smartsoko123'
export async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export async function ensureSeed() {
  // If a cloud database (Supabase) is configured, pull from it first so all
  // devices/users share the same data. Falls back to localStorage on failure.
  if (cloudConfigured()) {
    try {
      const cloud = await cloudPull()
      const ok = cloud._ok || {}
      const hasCloudData = ['members', 'campaigns', 'payments', 'expenses', 'budgets', 'audit', 'users', 'chat']
        .some((k) => (cloud[k] || []).length)
      delete cloud._ok
      if (hasCloudData) {
        const existing = loadState() || {}
        const next = { ...existing, ...cloud, session: existing.session || null }
        if (!cloud.users.length) next.users = existing.users || []
        localStorage.setItem(KEY, JSON.stringify(next))
        return
      }
      // Cloud empty: push local data up (first-time migration).
      const local = loadState()
      if (local) await cloudSync(local)
    } catch { /* fall through to localStorage seeding */ }
  }

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
    ;['users', 'members', 'campaigns', 'payments', 'expenses', 'budgets', 'audit', 'chat'].forEach((key) => {
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
  lastWriteAt = Date.now()
  window.dispatchEvent(new CustomEvent(EVT))
  // Optional cloud sync (Supabase free tier) — only if configured.
  cloudSync(state).catch(() => {})
}

export function getState() { return loadState() || defaultState() }

export function notifyChange() { window.dispatchEvent(new CustomEvent(EVT)) }

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

// ---------- Optional cloud sync (Supabase free tier) ----------
// Only activates when the user has saved a Supabase URL + Anon Key in Settings.
// Uses the Supabase REST (PostgREST) API directly — no SDK dependency.

const SB_DEFAULT_URL = 'https://tbtjukggjjqjgwrwkqrb.supabase.co'
const SB_DEFAULT_KEY = 'sb_publishable_5iWpaaSkJIpczjZXCfJm9Q_DmE3_gPP'

// Timestamp of the last local write. Used to avoid a background refresh
// overwriting a change that has not finished uploading yet.
let lastWriteAt = 0
const CHAT_ACTION = 'chat'

function cloudConfigured() {
  try {
    const url = (localStorage.getItem('sb_url') || SB_DEFAULT_URL).trim()
    const key = (localStorage.getItem('sb_key') || SB_DEFAULT_KEY).trim()
    return !!(url && key)
  } catch { return false }
}

function cloudHeaders() {
  const key = (localStorage.getItem('sb_key') || SB_DEFAULT_KEY).trim()
  return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }
}

function cloudBase() {
  return (localStorage.getItem('sb_url') || SB_DEFAULT_URL).trim().replace(/\/$/, '')
}

function toDb(table, row) {
  switch (table) {
    case 'board_members': return { id: row.id, full_name: row.fullName, phone: row.phone || '', email: row.email || '', position: row.position || 'Mwanachama', required_amount: Number(row.requiredAmount || 0), notes: row.notes || '', created_at: row.createdAt || new Date().toISOString() }
    case 'board_campaigns': return { id: row.id, name: row.name, purpose: row.purpose || '', target_amount: Number(row.targetAmount || 0), per_member_amount: Number(row.perMemberAmount || 0), start_date: row.startDate || null, due_date: row.dueDate || null, status: row.status || 'active', created_at: row.createdAt || new Date().toISOString() }
    case 'board_payments': return { id: row.id, member_id: row.memberId || null, campaign_id: row.campaignId || null, amount: Number(row.amount || 0), paid_on: row.date || new Date().toISOString().slice(0, 10), note: row.note || '', receipt_url: row.receiptUrl || '', recorded_by: row.recordedBy || '', created_at: row.createdAt || new Date().toISOString() }
    case 'board_expenses': return { id: row.id, title: row.title, category: row.category || 'operations', amount: Number(row.amount || 0), spent_on: row.date || new Date().toISOString().slice(0, 10), approved_by: row.approvedBy || '', approved_at: row.approvedAt || null, status: row.status || 'approved', note: row.note || '', receipt_url: row.receiptUrl || '', recorded_by: row.recordedBy || '', created_at: row.createdAt || new Date().toISOString() }
    case 'board_budgets': return { id: row.id, category: row.category || 'operations', amount: Number(row.amount || 0), period: row.period || 'monthly', note: row.note || '', created_at: row.createdAt || new Date().toISOString() }
    case 'board_audit': return { id: row.id, action: row.action, detail: row.detail || '', actor: row.user || '', role: row.role || '', created_at: row.at || new Date().toISOString() }
    case 'board_users': return { id: row.id, name: row.name, email: row.email, role: row.role || 'member', member_id: row.memberId || null, password_hash: row.passwordHash, created_at: new Date().toISOString() }
    default: return row
  }
}

function fromDb(table, row) {
  switch (table) {
    case 'board_members': return { id: row.id, fullName: row.full_name, phone: row.phone || '', email: row.email || '', position: row.position || 'Mwanachama', requiredAmount: Number(row.required_amount || 0), notes: row.notes || '', createdAt: row.created_at }
    case 'board_campaigns': return { id: row.id, name: row.name, purpose: row.purpose || '', targetAmount: Number(row.target_amount || 0), perMemberAmount: Number(row.per_member_amount || 0), startDate: row.start_date || '', dueDate: row.due_date || '', status: row.status || 'active', createdAt: row.created_at }
    case 'board_payments': return { id: row.id, memberId: row.member_id, campaignId: row.campaign_id, amount: Number(row.amount || 0), date: row.paid_on, note: row.note || '', receiptUrl: row.receipt_url || '', recordedBy: row.recorded_by || '', createdAt: row.created_at }
    case 'board_expenses': return { id: row.id, title: row.title, category: row.category || 'operations', amount: Number(row.amount || 0), date: row.spent_on, approvedBy: row.approved_by || '', approvedAt: row.approved_at || null, status: row.status || 'approved', note: row.note || '', receiptUrl: row.receipt_url || '', recordedBy: row.recorded_by || '', createdAt: row.created_at }
    case 'board_budgets': return { id: row.id, category: row.category || 'operations', amount: Number(row.amount || 0), period: row.period || 'monthly', note: row.note || '', createdAt: row.created_at }
    case 'board_audit': return { id: row.id, action: row.action, detail: row.detail || '', user: row.actor || '', role: row.role || '', at: row.created_at }
    case 'board_users': return { id: row.id, name: row.name, email: row.email, role: row.role || 'member', memberId: row.member_id, passwordHash: row.password_hash, createdAt: row.created_at }
    default: return row
  }
}

async function cloudFetch(path, options = {}) {
  const url = cloudBase() + path
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12000)
  try {
    const res = await fetch(url, { ...options, headers: { ...cloudHeaders(), ...(options.headers || {}) }, signal: ctrl.signal })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const text = await res.text()
    return text ? JSON.parse(text) : null
  } finally {
    clearTimeout(timer)
  }
}

async function cloudPull() {
  const tables = ['board_members', 'board_campaigns', 'board_payments', 'board_expenses', 'board_budgets', 'board_audit', 'board_users']
  const keys = ['members', 'campaigns', 'payments', 'expenses', 'budgets', 'audit', 'users']
  const result = { members: [], campaigns: [], payments: [], expenses: [], budgets: [], audit: [], users: [], chat: [], session: null }
  const ok = {}
  for (let i = 0; i < tables.length; i++) {
    try {
      const rows = await cloudFetch('/rest/v1/' + tables[i] + '?select=*')
      ok[tables[i]] = true
      if (tables[i] === 'board_audit') {
        // Live Chat rides on the audit table (action = 'chat') so it works with
        // exactly the same database grants as the rest of the app.
        result.audit = (rows || []).filter(r => r.action !== CHAT_ACTION).map(r => fromDb('board_audit', r))
        result.chat = (rows || []).filter(r => r.action === CHAT_ACTION).map(r => ({
          id: r.id,
          body: r.detail || '',
          authorName: r.actor || 'Mtumiaji',
          role: r.role || 'member',
          at: r.created_at,
        }))
      } else {
        result[keys[i]] = (rows || []).map((r) => fromDb(tables[i], r))
      }
    } catch { ok[tables[i]] = false }
  }
  result._ok = ok
  return result
}

function chatToDb(msg) {
  return {
    id: msg.id,
    action: CHAT_ACTION,
    detail: String(msg.body || '').slice(0, 1000),
    actor: msg.authorName || 'Mtumiaji',
    role: msg.role || 'member',
    created_at: msg.at || new Date().toISOString(),
  }
}

async function cloudSync(state) {
  if (!cloudConfigured()) return
  const mapping = [
    ['members', 'board_members'],
    ['campaigns', 'board_campaigns'],
    ['payments', 'board_payments'],
    ['expenses', 'board_expenses'],
    ['budgets', 'board_budgets'],
    ['audit', 'board_audit'],
    ['users', 'board_users'],
  ]
  for (const [key, table] of mapping) {
    const rows = (state[key] || []).map((r) => toDb(table, r))
    if (!rows.length) continue
    try {
      await cloudFetch('/rest/v1/' + table, { method: 'POST', body: JSON.stringify(rows) })
    } catch { /* ignore per-table failures */ }
  }
  // Live Chat messages live in board_audit with action = 'chat'.
  const chatRows = (state.chat || []).map(chatToDb)
  if (chatRows.length) {
    try {
      await cloudFetch('/rest/v1/board_audit', { method: 'POST', body: JSON.stringify(chatRows) })
    } catch { /* ignore */ }
  }
}

// Remove rows from the cloud as well, otherwise the next refresh would bring
// a deleted record back.
export async function cloudDelete(table, ids) {
  if (!cloudConfigured()) return
  const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean).map(String)
  if (!list.length) return
  try {
    await cloudFetch('/rest/v1/' + table + '?id=in.(' + list.map(encodeURIComponent).join(',') + ')', { method: 'DELETE' })
  } catch { /* ignore */ }
}

// Force an immediate two-way sync (used when connectivity returns).
export async function syncNow() {
  if (!cloudConfigured()) return false
  try { await cloudSync(getState()) } catch { /* ignore */ }
  return refreshFromCloud()
}

export async function refreshFromCloud() {
  if (!cloudConfigured()) return false
  // A local save may still be uploading; don't overwrite it mid-flight.
  if (Date.now() - lastWriteAt < 5000) return false
  const cloud = await cloudPull()
  const ok = cloud._ok || {}
  const existing = loadState()
  if (!existing) return false
  const next = { ...existing }
  if (ok.board_members) next.members = cloud.members
  if (ok.board_campaigns) next.campaigns = cloud.campaigns
  if (ok.board_payments) next.payments = cloud.payments
  if (ok.board_expenses) next.expenses = cloud.expenses
  if (ok.board_budgets) next.budgets = cloud.budgets
  if (ok.board_audit) { next.audit = cloud.audit; next.chat = cloud.chat }
  // Never accept an empty user list — that would lock everybody out.
  if (ok.board_users && cloud.users.length) next.users = cloud.users
  next.session = existing.session || null
  delete next._ok
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(EVT))
  return true
}

// ---------- Live Chat ----------
export function markChatSeen() {
  localStorage.setItem('chat_seen_at', String(Date.now()))
  window.dispatchEvent(new CustomEvent(EVT))
}

export function unreadChatCount(state) {
  const seen = Number(localStorage.getItem('chat_seen_at') || 0)
  const me = state?.session?.userId
  return (state?.chat || []).filter(c => c.authorId !== me && new Date(c.at).getTime() > seen).length
}

export function sendChat(body) {
  const text = String(body || '').trim().slice(0, 1000)
  const s = getState()
  if (!text || !s.session) return null
  const msg = {
    id: genId('c'),
    authorId: s.session.userId,
    authorName: s.session.name,
    role: s.session.role,
    body: text,
    at: new Date().toISOString(),
  }
  setState(prev => ({ ...prev, chat: [...(prev.chat || []), msg].slice(-400) }))
  return msg
}