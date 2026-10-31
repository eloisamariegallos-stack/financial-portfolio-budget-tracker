import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { seedData } from '../data/seed'
const FinanceContext = createContext(null)
const SESSION_KEY = 'fpt_session_v1'
const dataKey = email => `fpt_finance_data_v1:${String(email || 'guest').toLowerCase()}`
const clone = value => JSON.parse(JSON.stringify(value))
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null } }
const loadData = () => {
  const session = getSession()
  try {
    const saved = localStorage.getItem(dataKey(session?.email))
    const base = clone(seedData)
    if (!saved) return { ...base, profile: { ...base.profile, name: session?.name || 'User', email: session?.email || '' } }
    const parsed = JSON.parse(saved)
    return { ...base, ...parsed, profile: { ...base.profile, ...(parsed.profile || {}), name: session?.name || parsed.profile?.name || 'User', email: session?.email || parsed.profile?.email || '' } }
  } catch { return clone(seedData) }
}
export function FinanceProvider({ children }) {
  const [session,setSession] = useState(getSession)
  const [data,setData] = useState(() => {
    const initial = loadData()
    try {
      const storedTheme = localStorage.getItem('fpt_theme_v1')
      if (storedTheme === 'dark' || storedTheme === 'light') initial.settings = { ...initial.settings, theme: storedTheme }
    } catch {}
    return initial
  })
  useEffect(() => {
    const syncSession = () => {
      const next = getSession(); setSession(next)
      const nextData = loadData()
      try { const storedTheme = localStorage.getItem('fpt_theme_v1'); if (storedTheme === 'dark' || storedTheme === 'light') nextData.settings = { ...nextData.settings, theme: storedTheme } } catch {}
      setData(nextData)
    }
    window.addEventListener('fpt-session-change', syncSession)
    window.addEventListener('storage', syncSession)
    return () => { window.removeEventListener('fpt-session-change', syncSession); window.removeEventListener('storage', syncSession) }
  }, [])
  useEffect(() => {
    const theme = data?.settings?.theme === 'dark' ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('fpt_theme_v1', theme) } catch {}
  }, [data?.settings?.theme])
  useEffect(() => {
    if (!session?.email) return
    try { localStorage.setItem(dataKey(session.email), JSON.stringify(data)) }
    catch (e) { console.error('Could not save financial data in this browser', e) }
  }, [data, session?.email])
  const update = (key, value) => setData(prev => ({ ...prev, [key]: typeof value === 'function' ? value(prev[key]) : value }))
  const add = (key, item) => update(key, prev => [item, ...prev])
  const replace = (key, item) => update(key, prev => prev.map(x => x.id === item.id ? item : x))
  const remove = (key, id) => update(key, prev => prev.filter(x => x.id !== id))
  const reset = () => setData({ ...clone(seedData), profile: { name: session?.name || 'User', email: session?.email || '' } })
  const value = useMemo(() => ({ data, update, add, replace, remove, reset }), [data, session])
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}
export const useFinance = () => useContext(FinanceContext)
