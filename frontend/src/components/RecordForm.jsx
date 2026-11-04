import React, { useEffect, useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { uid } from '../utils/finance'
export default function RecordForm({ fields, initial, onSave, onCancel, submitLabel='Save changes' }) {
  const { data } = useFinance()
  const [form,setForm] = useState(() => ({ ...Object.fromEntries(fields.map(f=>[f.name, f.defaultValue ?? ''])), ...(initial||{}) }))
  const [error,setError] = useState('')
  const fieldLabel = field => field.label.replace('₱', data.settings?.currency || 'PHP')

  useEffect(() => {
    const defaults = Object.fromEntries(fields.map(field => [field.name, field.defaultValue ?? '']))
    setForm({ ...defaults, ...(initial || {}) })
  }, [initial])

  const change = (name,value) => setForm(prev=>({...prev,[name]:value}))
  async function submit(e) {
    e.preventDefault()
    for(const field of fields) {
      if(field.required && !String(form[field.name] ?? '').trim()) { setError(`${fieldLabel(field)} is required.`); return }
      if(field.type==='number' && field.required && !(Number(form[field.name]) > 0)) { setError(`${fieldLabel(field)} must be greater than zero.`); return }
    }
    setError('')
    try {
      await onSave({ ...form, id: initial?.id || uid() })
    } catch (error) {
      setError(error.message || 'Could not save this record.')
    }
  }
  return <form onSubmit={submit} className="space-y-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map(field=><label key={field.name} className={`block text-sm font-medium text-slate-600 ${field.wide?'sm:col-span-2':''}`}>{fieldLabel(field)}{field.required?' *':''}
        {field.type==='select' ? <select className="field mt-1.5" value={form[field.name]??''} onChange={e=>change(field.name,e.target.value)}>{field.options.map(opt=><option key={typeof opt==='string'?opt:opt.value} value={typeof opt==='string'?opt:opt.value}>{typeof opt==='string'?opt:opt.label}</option>)}</select>
        : field.type==='textarea' ? <textarea className="field mt-1.5" rows="3" value={form[field.name]??''} onChange={e=>change(field.name,e.target.value)} placeholder={field.placeholder||''}/>
        : <input className="field mt-1.5" type={field.type||'text'} min={field.type==='number'?'0.01':undefined} step={field.type==='number'?'0.01':undefined} value={form[field.name]??''} onChange={e=>change(field.name,e.target.value)} placeholder={field.placeholder||''} />}
      </label>)}
    </div>
    {error&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button><button className="btn-primary" type="submit">{submitLabel}</button></div>
  </form>
}