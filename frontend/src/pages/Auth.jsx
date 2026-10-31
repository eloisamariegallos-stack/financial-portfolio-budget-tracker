
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'

const SESSION_KEY = 'fpt_session_v1'
const API_BASE_URL = 'http://localhost:5000'

const normalizeEmail = email => email.trim().toLowerCase()

const validEmail = email =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)

async function postApi(endpoint, payload) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Request failed.')
  }

  return result
}

function startSession(user, authSession) {
  if (!authSession?.access_token) {
    throw new Error('No authentication token was returned.')
  }

  const expiresAt =
    authSession.expires_at ||
    Math.floor(Date.now() / 1000) + (authSession.expires_in || 3600)

  const session = {
    email: user.email,
    name: user.name || user.email.split('@')[0],
    access_token: authSession.access_token,
    refresh_token: authSession.refresh_token,
    expires_at: expiresAt,
    token_type: authSession.token_type || 'bearer',
    signedInAt: Date.now()
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('fpt-session-change'))
}

function AuthShell({ title, subtitle, children }) {
  const { data, update } = useFinance()
  const isDark = data?.settings?.theme === 'dark'

  const toggleTheme = () =>
    update('settings', prev => ({
      ...prev,
      theme: isDark ? 'light' : 'dark'
    }))

  return (
    <div className="flex min-h-screen items-center justify-center auth-shell bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            className="theme-toggle rounded-xl p-2.5"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <Activity size={25} />
          </span>

          <span className="min-w-0 text-center font-display text-lg font-extrabold leading-tight sm:text-xl">
            Financial Portfolio and Budget Tracker
          </span>
        </div>

        <section className="card auth-card p-6 sm:p-9">
          <h1 className="text-center font-display text-2xl font-extrabold">
            {title}
          </h1>

          <p className="mt-2 text-center text-sm text-slate-500">
            {subtitle}
          </p>

          {children}
        </section>
      </div>
    </div>
  )
}

// LOGIN
export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault()
    setError('')

    const normalized = normalizeEmail(email)

    if (!validEmail(normalized)) {
      setError('Enter a valid email address.')
      return
    }

    if (!password) {
      setError('Enter your password.')
      return
    }

    setBusy(true)

    try {
      const result = await postApi('/api/login', {
        email: normalized,
        password
      })

      const user = {
        email: result.user?.email || normalized,
        name: normalized.split('@')[0]
      }

      startSession(user, result.session)

      nav('/', { replace: true })
    } catch (error) {
      setError(error.message || 'Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Manage your finances in one place"
    >
      <form className="mt-7 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium text-slate-600">
          Email address
          <span className="relative mt-1.5 block">
            <input
              autoComplete="email"
              className="field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-600">
          Password
          <span className="relative mt-1.5 block">
            <input
              autoComplete="current-password"
              className="field pr-10"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              onClick={() => setShow(!show)}
              aria-label="Toggle password visibility"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        <div className="flex justify-end">
          <Link
            className="text-sm font-semibold text-emerald-700"
            to="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          disabled={busy}
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-wait disabled:opacity-60"
        >
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        New to Financial Portfolio?{' '}
        <Link to="/signup" className="font-bold text-emerald-700">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}

// SIGNUP
export function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault()
    setError('')
    setNotice('')

    const normalized = normalizeEmail(email)

    if (!validEmail(normalized)) {
      setError('Enter a valid email address.')
      return
    }

    if (name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)

    try {
      const username =
        normalized
          .split('@')[0]
          .replace(/[^a-zA-Z0-9_]/g, '')
          .slice(0, 30) || 'user'

      const result = await postApi('/api/signup', {
        username,
        email: normalized,
        password,
        full_name: name.trim()
      })

     if (result.requiresEmailConfirmation) {
  setNotice(
    result.message ||
    'Account created. Please check your email for confirmation.'
  )
  return
}

// Login after successful signup
try {
  const loginResult = await postApi('/api/login', {
    email: normalized,
    password
  })

  startSession(
    {
      email: loginResult.user?.email || normalized,
      name: name.trim()
    },
    loginResult.session
  )

  nav('/', { replace: true })

} catch {
  setNotice(
    'Account created successfully, but automatic login failed. Please sign in.'
  )
}
    } catch (error) {
      setError(error.message || 'Unable to create your account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Create an account to get started"
    >
      <form className="mt-7 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium text-slate-600">
          Full name
          <span className="relative mt-1.5 block">
            <input
              autoComplete="name"
              className="field"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-600">
          Email address
          <span className="relative mt-1.5 block">
            <input
              autoComplete="email"
              className="field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-600">
          Password
          <span className="relative mt-1.5 block">
            <input
              autoComplete="new-password"
              className="field pr-10"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              onClick={() => setShow(!show)}
              aria-label="Toggle password visibility"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>

          <span className="mt-1 block text-xs text-slate-400">
            Use at least 8 characters.
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-600">
          Confirm password
          <input
            autoComplete="new-password"
            className="field mt-1.5"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <button
          disabled={busy}
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-wait disabled:opacity-60"
        >
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-emerald-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

// FORGOT PASSWORD
export function ForgotPassword() {
  return (
    <AuthShell
      title="Password recovery unavailable"
      subtitle="Your account security matters"
    >
      <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
        <p>
          This project currently has no verified email-recovery service.
        </p>

        <p>
          To recover an account safely, connect a backend or authentication
          provider that sends a time-limited, single-use recovery link.
        </p>

        <Link
          to="/login"
          className="btn-primary block w-full py-3 text-center"
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  )
}
