import React from 'react'
import { X } from 'lucide-react'
export default function Modal({ title, onClose, children, wide=false }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={e => { if(e.target===e.currentTarget) onClose() }}>
    <section className={`max-h-[92vh] w-full ${wide?'max-w-2xl':'max-w-lg'} overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
      <header className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4"><h2 className="font-bold text-slate-800">{title}</h2><button aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></header>
      <div className="p-6">{children}</div>
    </section>
  </div>
}