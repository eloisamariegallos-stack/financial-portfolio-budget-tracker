import React from 'react'
export default function StatCard({ label, value, hint, icon:Icon, tone='green' }) {
  const tones = { green:'bg-emerald-50 text-emerald-700', blue:'bg-blue-50 text-blue-700', rose:'bg-rose-50 text-rose-700', violet:'bg-violet-50 text-violet-700', amber:'bg-amber-50 text-amber-700' }
  return <div className="card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-800">{value}</p></div><span className={`rounded-xl p-3 ${tones[tone]||tones.green}`}><Icon size={20}/></span></div>{hint&&<p className="mt-3 text-xs text-slate-500">{hint}</p>}</div>
}