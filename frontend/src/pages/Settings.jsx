import React, { useState } from 'react'
import { Download, Globe, Palette, RotateCcw, Save, ShieldAlert, UserRound } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { CURRENCY_OPTIONS, downloadCSV, getCountryMeta, SE_ASIA_COUNTRIES } from '../utils/finance'
import Modal from '../components/Modal'

const defaultSettings = {
  country: 'Philippines',
  currency: 'PHP',
  language: 'English (PH)',
  theme: 'light',
  warningThreshold: 80
}

export default function Settings() {
  const { data, update, reset } = useFinance()
  const [profile, setProfile] = useState(data.profile)
  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...data.settings,
    country: data.settings?.country || 'Philippines',
    currency: data.settings?.currency || 'PHP',
    language: data.settings?.language || 'English (PH)'
  })
  const [notice, setNotice] = useState('')
  const [resetError, setResetError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  const save = () => {
    if (!profile.name.trim() || !profile.email.includes('@')) {
      setNotice('Please enter a name and a valid email address.')
      return
    }

    const normalizedCountry = settings.country || 'Philippines'
    const countryMeta = getCountryMeta(normalizedCountry)
    const nextSettings = {
      ...settings,
      country: normalizedCountry,
      currency: CURRENCY_OPTIONS.some(item => item.value === settings.currency) ? settings.currency : 'PHP',
      language: settings.language || countryMeta.language,
      warningThreshold: Number(settings.warningThreshold)
    }

    setSettings(nextSettings)
    update('profile', profile)
    update('settings', nextSettings)
    setNotice('Settings saved successfully.')
    setTimeout(() => setNotice(''), 2500)
  }

  const exportData = () => downloadCSV(
    'Financial-Portfolio-and-Budget-Tracker-data.csv',
    [['Section', 'JSON data'], ...Object.entries(data).map(([key, value]) => [key, JSON.stringify(value)])]
  )

  const resetData = async () => {
    setResetError('')
    try {
      const resetProfile = await reset()
      setProfile(resetProfile)
      setSettings(defaultSettings)
      setConfirmReset(false)
      setNotice('Financial data reset successfully.')
    } catch (error) {
      setResetError(error.message || 'Could not reset financial data.')
    }
  }

  const handleCountryChange = nextCountry => {
    const countryMeta = getCountryMeta(nextCountry)
    setSettings(prev => ({
      ...prev,
      country: nextCountry,
      language: countryMeta.language
    }))
  }

  const handleCurrencyChange = currency => {
    setSettings(previous => ({ ...previous, currency }))
    update('settings', { ...data.settings, currency })
  }

  return <div className="space-y-6">
    <div>
      <p className="text-sm font-semibold text-emerald-700">Personalize your workspace</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold">Settings</h1>
      <p className="mt-2 text-sm text-slate-500">Manage your profile, preferences, and saved data.</p>
    </div>
    {notice && <div role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

    <div className="grid gap-5 xl:grid-cols-2">
      <section className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><UserRound size={20}/></span>
          <div><h2 className="font-bold">A. Personal information</h2><p className="text-sm text-slate-500">Update your profile details.</p></div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-600">Full name<input className="field mt-1.5" value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })}/></label>
          <label className="block text-sm font-medium text-slate-600">Email address<input type="email" className="field mt-1.5" value={profile.email} onChange={event => setProfile({ ...profile, email: event.target.value })}/></label>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-700"><Globe size={20}/></span>
          <div><h2 className="font-bold">B. Region and language</h2><p className="text-sm text-slate-500">Set your country, currency, and language.</p></div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-600">Country
            <select className="field mt-1.5" value={settings.country} onChange={event => handleCountryChange(event.target.value)}>
              {SE_ASIA_COUNTRIES.map(option => <option key={option.name} value={option.name}>{option.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-600">Currency
            <select className="field mt-1.5" value={settings.currency} onChange={event => handleCurrencyChange(event.target.value)}>
              {CURRENCY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-600">Language
            <select className="field mt-1.5" value={settings.language} onChange={event => setSettings({ ...settings, language: event.target.value })}>
              {Array.from(new Set(SE_ASIA_COUNTRIES.map(item => item.language))).map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </section>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <section className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl bg-amber-50 p-3 text-amber-700"><Palette size={20}/></span>
          <div><h2 className="font-bold">C. Appearance</h2><p className="text-sm text-slate-500">Choose the look that feels best.</p></div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-600">Theme
            <select className="field mt-1.5" value={settings.theme} onChange={event => {
              const nextTheme = event.target.value
              setSettings({ ...settings, theme: nextTheme })
              update('settings', { ...data.settings, theme: nextTheme })
            }}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl bg-violet-50 p-3 text-violet-700"><Save size={20}/></span>
          <div><h2 className="font-bold">D. Preferences</h2><p className="text-sm text-slate-500">Small adjustments for daily use.</p></div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-600">Budget warning threshold: {settings.warningThreshold}%
            <input className="mt-3 w-full accent-emerald-700" type="range" min="50" max="100" step="5" value={settings.warningThreshold} onChange={event => setSettings({ ...settings, warningThreshold: Number(event.target.value) })}/>
            <span className="mt-1 block text-xs text-slate-400">Show a warning when spending reaches this percentage of a budget.</span>
          </label>
        </div>
      </section>
    </div>

    <div className="flex justify-end"><button className="btn-primary" onClick={save}>Save settings</button></div>
    <section className="card p-6">
      <h2 className="font-bold">Data management</h2>
      <p className="mt-1 text-sm text-slate-500">Reset data clears your financial records and restores an empty workspace.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="btn-secondary" onClick={exportData}><Download size={15} className="mr-1 inline"/> Export data</button>
        <button className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100" onClick={() => { setResetError(''); setConfirmReset(true) }}><RotateCcw size={15} className="mr-1 inline"/> Reset data</button>
      </div>
    </section>
    {confirmReset && <Modal title="Reset all financial data?" onClose={() => setConfirmReset(false)}>
      <div className="rounded-xl bg-rose-50 p-4 text-sm leading-6 text-rose-800"><ShieldAlert size={20} className="mb-2"/>This permanently clears your financial records and restores a blank workspace. This cannot be undone.</div>
      {resetError && <p role="alert" className="mt-3 text-sm text-rose-700">{resetError}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-secondary" onClick={() => setConfirmReset(false)}>Cancel</button>
        <button className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700" onClick={resetData}>Yes, reset data</button>
      </div>
    </Modal>}
  </div>
}
