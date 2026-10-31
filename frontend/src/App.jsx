import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { FinanceProvider } from './context/FinanceContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Investments from './pages/Investments'
import Analytics from './pages/Analytics'
import Assistant from './pages/Assistant'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import { Login, Signup, ForgotPassword } from './pages/Auth'
const SESSION_KEY = 'fpt_session_v1'
function hasSession() {
  try {
    const session = JSON.parse(
      localStorage.getItem(SESSION_KEY) || 'null'
    )

    if (!session?.email || !session?.access_token) {
      return false
    }

    const expiresAt = Number(session.expires_at || 0)
    const now = Math.floor(Date.now() / 1000)

    if (expiresAt && expiresAt <= now + 30) {
      return false
    }

    return true
  } catch {
    return false
  }
}
function ProtectedLayout(){const location=useLocation();return hasSession()?<Layout/>:<Navigate to="/login" replace state={{from:location.pathname}}/>}
function GuestOnly({children}){return hasSession()?<Navigate to="/" replace/>:children}
export default function App(){return <FinanceProvider><Routes><Route path="/login" element={<GuestOnly><Login/></GuestOnly>}/><Route path="/signup" element={<GuestOnly><Signup/></GuestOnly>}/><Route path="/forgot-password" element={<GuestOnly><ForgotPassword/></GuestOnly>}/><Route element={<ProtectedLayout/>}><Route path="/" element={<Dashboard/>}/><Route path="/accounts" element={<Accounts/>}/><Route path="/transactions" element={<Transactions/>}/><Route path="/budgets" element={<Budgets/>}/><Route path="/goals" element={<Goals/>}/><Route path="/investments" element={<Investments/>}/><Route path="/analytics" element={<Analytics/>}/><Route path="/assistant" element={<Assistant/>}/><Route path="/notifications" element={<Notifications/>}/><Route path="/settings" element={<Settings/>}/></Route><Route path="*" element={<Navigate to={hasSession()?'/':'/login'} replace/>}/></Routes></FinanceProvider>}
