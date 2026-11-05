
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { seedData } from '../data/seed'
import { postApi } from '../utils/api'

const SESSION_KEY = 'fpt_session_v1'
const REMEMBER_EMAIL_KEY = 'fpt_remembered_email_v1'
const dataKey = email => `fpt_finance_data_v1:${String(email || 'guest').toLowerCase()}`

const normalizeEmail = email => email.trim().toLowerCase()

const validEmail = email =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)

function syncUserPreferences(userEmail, preferences = {}) {
  if (!userEmail) return

  try {
    const existing = JSON.parse(localStorage.getItem(dataKey(userEmail)) || 'null')
    const nextData = {
      ...seedData,
      ...(existing || {}),
      profile: {
        ...(existing?.profile || seedData.profile),
        name: preferences.name || existing?.profile?.name || userEmail.split('@')[0],
        email: userEmail
      },
      settings: {
        ...seedData.settings,
        ...(existing?.settings || {}),
        ...preferences
      }
    }

    localStorage.setItem(dataKey(userEmail), JSON.stringify(nextData))
  } catch {}
}

function startSession(user, authSession, preferences = {}) {
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

  syncUserPreferences(user.email, preferences)
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('fpt-session-change'))
}

function AuthShell({ title, subtitle, children, variant = 'default' }) {
  const isLogin = variant === 'login'

  return (
    <div className="auth-shell flex min-h-screen items-center justify-center p-4">
      <div className="auth-content mx-auto w-full max-w-md">
        <section className={`card auth-card p-6 sm:p-9 ${isLogin ? 'auth-login-card' : ''}`}>
          <div
            className="auth-card-brand mb-3 flex items-center justify-center"
            role="img"
            aria-label="PennyWise"
          >
            <img
              src="/pennywise-mark.png"
              alt=""
              className="auth-brand-mark"
            />
            <img
              src="/pennywise-wordmark.png"
              alt=""
              className="auth-brand-wordmark"
            />
          </div>

          <h1 className={`auth-heading text-center font-display text-2xl font-extrabold ${isLogin ? 'auth-login-heading' : ''}`}>
            {title}
          </h1>

          <p className={`auth-description mt-2 text-center text-sm ${isLogin ? 'auth-login-description' : ''}`}>
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
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) || '')
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem(REMEMBER_EMAIL_KEY)))
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const nav = useNavigate()

  const updateEmail = value => {
    setEmail(value)
    if (rememberMe) {
      if (value) localStorage.setItem(REMEMBER_EMAIL_KEY, value)
      else localStorage.removeItem(REMEMBER_EMAIL_KEY)
    }
  }

  const updateRememberMe = checked => {
    setRememberMe(checked)
    if (checked && email) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email)
    } else if (!checked) {
      localStorage.removeItem(REMEMBER_EMAIL_KEY)
    }
  }

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
      title="Welcome back to PennyWise"
      subtitle="Manage your finances in one place"
      variant="login"
    >
      <form className="mt-7 space-y-4 auth-login-form" onSubmit={submit}>
        <label className="auth-label block text-sm font-medium">
          Email address
          <span className="relative mt-1.5 block">
            <input
              autoComplete="email"
              className="field auth-input"
              type="email"
              value={email}
              onChange={e => updateEmail(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="auth-label block text-sm font-medium">
          Password
          <span className="relative mt-1.5 block">
            <input
              autoComplete="current-password"
              className="field auth-input pr-12"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="auth-password-toggle absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700"
              onClick={() => setShow(value => !value)}
              aria-label={show ? 'Hide password' : 'Show password'}
              aria-pressed={show}
            >
              {show ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
            </button>
          </span>
        </label>

        <div className="auth-login-options flex flex-wrap items-center justify-between gap-3">
          <label className="auth-remember flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={rememberMe}
              onChange={e => updateRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <Link
            className="auth-link text-sm font-semibold"
            to="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" className="auth-error rounded-lg p-3 text-sm">
            {error}
          </p>
        )}

        <button
          disabled={busy}
          className="btn-primary auth-submit flex w-full items-center justify-center gap-2 py-3 disabled:cursor-wait disabled:opacity-60"
        >
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="auth-footer mt-5 text-center text-sm auth-login-footer">
        New to PennyWise?{' '}
        <Link to="/signup" className="auth-link font-bold">
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
  const [showConfirm, setShowConfirm] = useState(false)
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

} catch (error) {
  setNotice(
    `Account created, but automatic sign-in failed: ${error.message || 'Please sign in manually.'}`
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
        <label className="auth-label block text-sm font-medium">
          Full name
          <span className="relative mt-1.5 block">
            <input
              autoComplete="name"
              className="field auth-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="auth-label block text-sm font-medium">
          Email address
          <span className="relative mt-1.5 block">
            <input
              autoComplete="email"
              className="field auth-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="auth-label block text-sm font-medium">
          Password
          <span className="relative mt-1.5 block">
            <input
              autoComplete="new-password"
              className="field auth-input pr-12"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
            />

            <button
              type="button"
              className="auth-password-toggle absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700"
              onClick={() => setShow(value => !value)}
              aria-label={show ? 'Hide password' : 'Show password'}
              aria-pressed={show}
            >
              {show ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
            </button>
          </span>

          <span className="auth-hint mt-1 block text-xs">
            Use at least 8 characters.
          </span>
        </label>

        <label className="auth-label block text-sm font-medium">
          Confirm password
          <span className="relative mt-1.5 block">
            <input
              autoComplete="new-password"
              className="field auth-input pr-12"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-password-toggle absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700"
              onClick={() => setShowConfirm(value => !value)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              aria-pressed={showConfirm}
            >
              {showConfirm ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
            </button>
          </span>
        </label>

        {error && (
          <p role="alert" className="auth-error rounded-lg p-3 text-sm">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="auth-notice rounded-lg p-3 text-sm">
            {notice}
          </p>
        )}

        <button
          disabled={busy}
          className="btn-primary auth-submit flex w-full items-center justify-center gap-2 py-3 disabled:cursor-wait disabled:opacity-60"
        >
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="auth-footer mt-5 text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="auth-link font-bold">
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
      <div className="auth-footer mt-6 space-y-4 text-sm leading-6">
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
