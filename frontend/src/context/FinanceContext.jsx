import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { seedData } from '../data/seed'
import { resolveThemeMode } from '../utils/finance'

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
  const date = type === 'income' ? row.income_date : row.expense_date
  const time = row.income_time || row.expense_time || row.time || saved.time || ''
  return {
    ...saved,
    id: row.id,
    description: row.description || saved.description || row.source || row.category || '',
    amount: Number(row.amount),
    type,
    category: row.category || row.source || saved.category || 'Other',
    date: date || saved.date || '',
    time,
    accountId: saved.accountId || accountId || '',
    method: saved.method || 'Online banking',
    notes: saved.notes || ''
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
  const common = { amount: Number(item.amount), description: item.description || null }
  return item.type === 'income'
    ? {
        ...common,
        source: item.category,
        income_date: item.date || undefined,
        income_time: item.time || undefined
      }
    : {
        ...common,
        category: item.category,
        expense_date: item.date || undefined,
        expense_time: item.time || undefined
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

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setSyncStatus('idle')
      setSyncError('')
      return
    }

    setSyncStatus('loading')
    setSyncError('')
    try {
      const [incomeResult, expenseResult, portfolioResult] = await Promise.all([
        requestApi('/api/income', session),
        requestApi('/api/expenses', session),
        requestApi('/api/portfolio', session)
      ])
      if (!Array.isArray(incomeResult.income) || !Array.isArray(expenseResult.expenses) || !Array.isArray(portfolioResult.portfolio)) {
        throw new Error('The finance API returned an invalid records response.')
      }

      setData(previous => ({
        ...previous,
        transactions: [
          ...incomeResult.income.map(row => mapTransaction(row, 'income', previous.transactions, previous.accounts[0]?.id)),
          ...expenseResult.expenses.map(row => mapTransaction(row, 'expense', previous.transactions, previous.accounts[0]?.id))
        ],
        investments: portfolioResult.portfolio.map(row => mapInvestment(row, previous.investments))
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
    if (key === 'transactions' || key === 'investments') {
      if (!session?.access_token) throw new Error('Sign in before saving financial records.')
      const endpoint = key === 'investments' ? '/api/portfolio' : transactionEndpoint(item)
      const payload = key === 'investments' ? portfolioPayload(item) : transactionPayload(item)
      const result = await requestApi(endpoint, session, { method: 'POST', body: payload })
      const saved = key === 'investments'
        ? mapInvestment(result.portfolio, [item])
        : savedTransaction(result, item)
      setData(previous => ({ ...previous, [key]: [saved, ...previous[key]] }))
      return saved
    }
    setData(previous => ({ ...previous, [key]: [item, ...previous[key]] }))
    return item
  }

  const replace = async (key, item) => {
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

  const reset = async () => {
    if (session?.access_token) {
      await Promise.all([
        ...data.transactions.map(item => requestApi(`${transactionEndpoint(item)}/${encodeURIComponent(item.id)}`, session, { method: 'DELETE' })),
        ...data.investments.map(item => requestApi(`/api/portfolio/${encodeURIComponent(item.id)}`, session, { method: 'DELETE' }))
      ])
    }
    const profile = { name: session?.name || 'User', email: session?.email || '' }
    setData({ ...clone(seedData), profile })
    return profile
  }

  const value = useMemo(() => ({
    data, update, add, replace, remove, reset, refresh, syncStatus, syncError
  }), [data, session, refresh, syncStatus, syncError])
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => useContext(FinanceContext)
