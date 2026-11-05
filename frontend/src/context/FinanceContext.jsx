import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { seedData } from '../data/seed'
import { resolveThemeMode, toUtcIso, splitLocalDateTime } from '../utils/finance'

const FinanceContext = createContext(null)
const SESSION_KEY = 'fpt_session_v1'
const dataKey = email => `fpt_finance_data_v1:${String(email || 'guest').toLowerCase()}`
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const clone = value => JSON.parse(JSON.stringify(value))
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null } }

const loadData = () => {
  const session = getSession()
  try {
    const saved = localStorage.getItem(dataKey(session?.email))
    const base = clone(seedData)
    if (!saved) {
      return {
        ...base,
        profile: { ...base.profile, name: session?.name || 'User', email: session?.email || '' },
        settings: { ...base.settings, country: base.settings.country || 'Philippines', currency: base.settings.currency || 'PHP', language: base.settings.language || 'English (PH)' }
      }
    }
    const parsed = JSON.parse(saved)
    return {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...(parsed.profile || {}), name: session?.name || parsed.profile?.name || 'User', email: session?.email || parsed.profile?.email || '' },
      settings: { ...base.settings, ...(parsed.settings || {}), country: parsed.settings?.country || base.settings.country || 'Philippines', currency: parsed.settings?.currency || base.settings.currency || 'PHP', language: parsed.settings?.language || base.settings.language || 'English (PH)' }
    }
  } catch { return clone(seedData) }
}

async function requestApi(endpoint, session, { method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || `Finance API request failed (${response.status}).`)
  }
  return result
}

function mapTransaction(row, type, previous, accountId) {
  const saved = previous.find(item => String(item.id) === String(row.id)) || {}
  const local = row.occurred_at ? splitLocalDateTime(row.occurred_at) : null
  const date = local?.date || (type === 'income' ? row.income_date : row.expense_date)
  const time = local?.time || row.income_time || row.expense_time || row.time || saved.time || ''
  return {
    ...saved,
    id: row.id,
    description: row.description || saved.description || row.source || row.category || '',
    amount: Number(row.amount),
    type,
    category: row.category || row.source || saved.category || 'Other',
    date: date || saved.date || '',
    time: typeof time === 'string' ? time.slice(0, 5) : '',
    accountId: saved.accountId || accountId || '',
    method: row.payment_method || saved.method || (type === 'expense' ? 'Cash' : 'Online banking'),
    notes: saved.notes || ''
  }
}

function mapGoal(row) {
  return {
    id: row.id,
    name: row.title,
    target: row.target_amount == null ? 0 : Number(row.target_amount),
    saved: Number(row.current_amount),
    targetDate: row.target_date || '',
    history: (row.contributions || []).map(c => ({
      id: c.id,
      date: c.contributed_on,
      type: c.direction,
      amount: Number(c.amount)
    }))
  }
}

function goalPayload(item) {
  return {
    title: item.name,
    target_amount: Number(item.target),
    current_amount: Number(item.saved),
    target_date: item.targetDate || null
  }
}

function mapBudget(row) {
  return {
    id: row.id,
    category: row.category_name,
    limit: Number(row.monthly_limit),
    month: String(row.month).slice(0, 7)
  }
}

function budgetPayload(item) {
  return {
    category_name: item.category,
    monthly_limit: Number(item.limit),
    month: item.month
  }
}

const notificationTitles = {
  budget_exceeded: 'Over budget',
  budget_warning: 'Budget warning',
  reminder: 'Personal reminder'
}

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: notificationTitles[row.type] || 'Notification',
    message: row.message,
    date: row.created_at,
    read: Boolean(row.is_read)
  }
}

function mapInvestment(row, previous) {
  const saved = previous.find(item => String(item.id) === String(row.id)) || {}
  const units = Number(row.quantity)
  const invested = Number(row.purchase_price) * units
  return {
    ...saved,
    id: row.id,
    name: row.asset_name,
    type: row.asset_type,
    units,
    invested,
    value: Number.isFinite(Number(saved.value)) ? Number(saved.value) : invested,
    symbol: saved.symbol || ''
  }
}

function transactionEndpoint(item) {
  return item.type === 'income' ? '/api/income' : '/api/expenses'
}

function transactionPayload(item) {
  const common = {
    amount: Number(item.amount),
    description: item.description || null,
    occurred_at: toUtcIso(item.date, item.time)
  }
  return item.type === 'income'
    ? {
        ...common,
        source: item.category,
        income_date: item.date || undefined
      }
    : {
        ...common,
        category: item.category,
        expense_date: item.date || undefined,
        method: item.method || 'Cash'
      }
}

function portfolioPayload(item) {
  return {
    asset_name: item.name,
    asset_type: item.type,
    quantity: Number(item.units),
    purchase_price: Number(item.invested) / Number(item.units)
  }
}

function savedTransaction(result, item) {
  const row = item.type === 'income' ? result.income : result.expense
  return mapTransaction(row, item.type, [item], item.accountId)
}

export function FinanceProvider({ children }) {
  const [session, setSession] = useState(getSession)
  const [data, setData] = useState(() => {
    const initial = loadData()
    try {
      const storedTheme = localStorage.getItem('fpt_theme_v1')
      if (storedTheme === 'dark' || storedTheme === 'light') initial.settings = { ...initial.settings, theme: storedTheme }
    } catch {}
    return initial
  })
  const [syncStatus, setSyncStatus] = useState(() => getSession()?.access_token ? 'loading' : 'idle')
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    const syncSession = () => {
      const next = getSession()
      setSession(next)
      const nextData = loadData()
      try {
        const storedTheme = localStorage.getItem('fpt_theme_v1')
        if (storedTheme === 'dark' || storedTheme === 'light') nextData.settings = { ...nextData.settings, theme: storedTheme }
      } catch {}
      setData(nextData)
    }
    window.addEventListener('fpt-session-change', syncSession)
    window.addEventListener('storage', syncSession)
    return () => {
      window.removeEventListener('fpt-session-change', syncSession)
      window.removeEventListener('storage', syncSession)
    }
  }, [])

  // Reloads only the notifications (budget alerts are created by the database).
  const refreshNotifications = useCallback(async () => {
    if (!session?.access_token) return
    try {
      const result = await requestApi('/api/notifications', session)
      if (!Array.isArray(result.notifications)) return
      setData(previous => ({ ...previous, notifications: result.notifications.map(mapNotification) }))
    } catch (error) {
      console.warn('Could not load notifications', error)
    }
  }, [session])

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setSyncStatus('idle')
      setSyncError('')
      return
    }

    setSyncStatus('loading')
    setSyncError('')
    try {
      const [incomeResult, expenseResult, portfolioResult, goalsResult, budgetsResult, notificationsResult] = await Promise.all([
        requestApi('/api/income', session),
        requestApi('/api/expenses', session),
        requestApi('/api/portfolio', session),
        requestApi('/api/goals', session),
        requestApi('/api/budgets', session),
        // A notifications problem should not stop the rest of the app from loading.
        requestApi('/api/notifications', session).catch(error => {
          console.warn('Could not load notifications', error)
          return null
        })
      ])
      if (!Array.isArray(incomeResult.income) || !Array.isArray(expenseResult.expenses) || !Array.isArray(portfolioResult.portfolio) || !Array.isArray(goalsResult.goals) || !Array.isArray(budgetsResult.budgets)) {
        throw new Error('The finance API returned an invalid records response.')
      }

      setData(previous => ({
        ...previous,
        transactions: [
          ...incomeResult.income.map(row => mapTransaction(row, 'income', previous.transactions, previous.accounts[0]?.id)),
          ...expenseResult.expenses.map(row => mapTransaction(row, 'expense', previous.transactions, previous.accounts[0]?.id))
        ],
        investments: portfolioResult.portfolio.map(row => mapInvestment(row, previous.investments)),
        goals: goalsResult.goals.map(mapGoal),
        budgets: budgetsResult.budgets.map(mapBudget),
        ...(Array.isArray(notificationsResult?.notifications)
          ? { notifications: notificationsResult.notifications.map(mapNotification) }
          : {})
      }))
      setSyncStatus('synced')
    } catch (error) {
      setSyncError(error.message || 'Unable to load records from the finance API.')
      setSyncStatus('error')
    }
  }, [session])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const setTheme = () => {
      const nextTheme = resolveThemeMode(data?.settings?.theme, mediaQuery.matches)
      document.documentElement.classList.toggle('dark', nextTheme === 'dark')
      document.documentElement.dataset.theme = nextTheme
      try { localStorage.setItem('fpt_theme_v1', nextTheme) } catch {}
    }

    setTheme()

    if (data?.settings?.theme === 'system') {
      const onChange = () => setTheme()
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', onChange)
        return () => mediaQuery.removeEventListener('change', onChange)
      }
      mediaQuery.addListener(onChange)
      return () => mediaQuery.removeListener(onChange)
    }
  }, [data?.settings?.theme])

  useEffect(() => {
    if (!session?.email) return
    try { localStorage.setItem(dataKey(session.email), JSON.stringify(data)) }
    catch (error) { console.error('Could not save financial data in this browser', error) }
  }, [data, session?.email])

  const update = (key, value) => setData(previous => ({
    ...previous,
    [key]: typeof value === 'function' ? value(previous[key]) : value
  }))

  const add = async (key, item) => {
    if (key === 'goals') {
      if (!session?.access_token) throw new Error('Sign in before saving financial records.')
      const result = await requestApi('/api/goals', session, { method: 'POST', body: goalPayload(item) })
      const saved = mapGoal(result.goal)
      setData(previous => ({ ...previous, goals: [saved, ...previous.goals] }))
      return saved
    }
    if (key === 'budgets') {
      if (!session?.access_token) throw new Error('Sign in before saving financial records.')
      const result = await requestApi('/api/budgets', session, { method: 'POST', body: budgetPayload(item) })
      const saved = mapBudget(result.budget)
      setData(previous => ({ ...previous, budgets: [saved, ...previous.budgets] }))
      return saved
    }
    if (key === 'notifications') {
      if (!session?.access_token) {
        setData(previous => ({ ...previous, notifications: [item, ...previous.notifications] }))
        return item
      }
      const result = await requestApi('/api/notifications', session, { method: 'POST', body: { message: item.message } })
      const saved = mapNotification(result.notification)
      setData(previous => ({ ...previous, notifications: [saved, ...previous.notifications] }))
      return saved
    }
    if (key === 'transactions' || key === 'investments') {
      if (!session?.access_token) throw new Error('Sign in before saving financial records.')
      const endpoint = key === 'investments' ? '/api/portfolio' : transactionEndpoint(item)
      const payload = key === 'investments' ? portfolioPayload(item) : transactionPayload(item)
      const result = await requestApi(endpoint, session, { method: 'POST', body: payload })
      const saved = key === 'investments'
        ? mapInvestment(result.portfolio, [item])
        : savedTransaction(result, item)
      setData(previous => ({ ...previous, [key]: [saved, ...previous[key]] }))
      // A new expense can trigger a budget alert in the database, so reload notifications.
      if (key === 'transactions' && item.type === 'expense') refreshNotifications()
      return saved
    }
    setData(previous => ({ ...previous, [key]: [item, ...previous[key]] }))
    return item
  }

  const replace = async (key, item) => {
    if (key === 'goals') {
      if (!session?.access_token) throw new Error('Sign in before saving financial records.')
      const result = await requestApi(`/api/goals/${encodeURIComponent(item.id)}`, session, { method: 'PUT', body: goalPayload(item) })
      const saved = mapGoal(result.goal)
      setData(previous => ({ ...previous, goals: previous.goals.map(record => String(record.id) === String(saved.id) ? saved : record) }))
      return saved
    }
    if (key === 'budgets') {
      if (!session?.access_token) throw new Error('Sign in before saving financial records.')
      const result = await requestApi(`/api/budgets/${encodeURIComponent(item.id)}`, session, { method: 'PUT', body: budgetPayload(item) })
      const saved = mapBudget(result.budget)
      setData(previous => ({ ...previous, budgets: previous.budgets.map(record => String(record.id) === String(saved.id) ? saved : record) }))
      return saved
    }
    if (key === 'transactions' || key === 'investments') {
      if (!session?.access_token) throw new Error('Sign in before saving financial records.')
      const current = data[key].find(record => String(record.id) === String(item.id))
      if (key === 'transactions' && current && current.type !== item.type) {
        const createEndpoint = transactionEndpoint(item)
        const created = await requestApi(createEndpoint, session, { method: 'POST', body: transactionPayload(item) })
        const saved = savedTransaction(created, item)
        try {
          await requestApi(`${transactionEndpoint(current)}/${encodeURIComponent(current.id)}`, session, { method: 'DELETE' })
        } catch (error) {
          try {
            await requestApi(`${createEndpoint}/${encodeURIComponent(saved.id)}`, session, { method: 'DELETE' })
          } catch (rollbackError) {
            throw new Error(`Could not change the transaction type: ${error.message} Cleanup also failed: ${rollbackError.message}`)
          }
          throw error
        }
        setData(previous => ({ ...previous, transactions: [saved, ...previous.transactions.filter(record => String(record.id) !== String(current.id))] }))
        if (item.type === 'expense') refreshNotifications()
        return saved
      }
      const endpoint = key === 'investments' ? `/api/portfolio/${encodeURIComponent(item.id)}` : `${transactionEndpoint(item)}/${encodeURIComponent(item.id)}`
      const payload = key === 'investments' ? portfolioPayload(item) : transactionPayload(item)
      const result = await requestApi(endpoint, session, { method: 'PUT', body: payload })
      const saved = key === 'investments'
        ? mapInvestment(result.portfolio, [item])
        : savedTransaction(result, item)
      setData(previous => ({ ...previous, [key]: previous[key].map(record => String(record.id) === String(item.id) ? saved : record) }))
      return saved
    }
    setData(previous => ({ ...previous, [key]: previous[key].map(record => record.id === item.id ? item : record) }))
    return item
  }

  const remove = async (key, id) => {
    if (key === 'goals') {
      if (!session?.access_token) throw new Error('Sign in before deleting financial records.')
      await requestApi(`/api/goals/${encodeURIComponent(id)}`, session, { method: 'DELETE' })
      setData(previous => ({ ...previous, goals: previous.goals.filter(record => String(record.id) !== String(id)) }))
      return
    }
    if (key === 'budgets') {
      if (!session?.access_token) throw new Error('Sign in before deleting financial records.')
      await requestApi(`/api/budgets/${encodeURIComponent(id)}`, session, { method: 'DELETE' })
      setData(previous => ({ ...previous, budgets: previous.budgets.filter(record => String(record.id) !== String(id)) }))
      return
    }
    if (key === 'notifications') {
      if (session?.access_token) {
        await requestApi(`/api/notifications/${encodeURIComponent(id)}`, session, { method: 'DELETE' })
      }
      setData(previous => ({ ...previous, notifications: previous.notifications.filter(record => String(record.id) !== String(id)) }))
      return
    }
    if (key === 'transactions' || key === 'investments') {
      if (!session?.access_token) throw new Error('Sign in before deleting financial records.')
      const record = data[key].find(item => String(item.id) === String(id))
      if (!record) return
      const endpoint = key === 'investments'
        ? `/api/portfolio/${encodeURIComponent(id)}`
        : `${transactionEndpoint(record)}/${encodeURIComponent(id)}`
      await requestApi(endpoint, session, { method: 'DELETE' })
    }
    setData(previous => ({ ...previous, [key]: previous[key].filter(record => String(record.id) !== String(id)) }))
  }

  const markNotificationRead = async id => {
    if (session?.access_token) {
      await requestApi(`/api/notifications/${encodeURIComponent(id)}/read`, session, { method: 'PUT' })
    }
    setData(previous => ({
      ...previous,
      notifications: previous.notifications.map(record => String(record.id) === String(id) ? { ...record, read: true } : record)
    }))
  }

  const markAllNotificationsRead = async () => {
    if (session?.access_token) {
      await requestApi('/api/notifications/read-all', session, { method: 'PUT' })
    }
    setData(previous => ({
      ...previous,
      notifications: previous.notifications.map(record => ({ ...record, read: true }))
    }))
  }

  const contribute = async (id, direction, amount) => {
    if (!session?.access_token) throw new Error('Sign in before saving financial records.')
    const result = await requestApi(`/api/goals/${encodeURIComponent(id)}/contributions`, session, {
      method: 'POST',
      body: { direction, amount: Number(amount) }
    })
    const saved = mapGoal(result.goal)
    setData(previous => ({ ...previous, goals: previous.goals.map(record => String(record.id) === String(saved.id) ? saved : record) }))
    return saved
  }

  const reset = async () => {
    if (session?.access_token) {
      await Promise.all([
        ...data.transactions.map(item => requestApi(`${transactionEndpoint(item)}/${encodeURIComponent(item.id)}`, session, { method: 'DELETE' })),
        ...data.investments.map(item => requestApi(`/api/portfolio/${encodeURIComponent(item.id)}`, session, { method: 'DELETE' })),
        ...data.goals.map(item => requestApi(`/api/goals/${encodeURIComponent(item.id)}`, session, { method: 'DELETE' })),
        ...data.budgets.map(item => requestApi(`/api/budgets/${encodeURIComponent(item.id)}`, session, { method: 'DELETE' })),
        // Notifications are cleaned up on a best-effort basis; a failure here should not block the reset.
        ...data.notifications.map(item => requestApi(`/api/notifications/${encodeURIComponent(item.id)}`, session, { method: 'DELETE' }).catch(() => null))
      ])
    }
    const profile = { name: session?.name || 'User', email: session?.email || '' }
    setData({ ...clone(seedData), profile })
    return profile
  }

  const value = useMemo(() => ({
    data, update, add, replace, remove, contribute, reset, refresh,
    refreshNotifications, markNotificationRead, markAllNotificationsRead,
    syncStatus, syncError
  }), [data, session, refresh, refreshNotifications, syncStatus, syncError])
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => useContext(FinanceContext)