import React from 'react'
import { Inbox } from 'lucide-react'
export default function EmptyState({ title='No records found', detail='Try changing your filters or add a new record.' }) {
  return <div className="py-12 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Inbox size={22}/></div><p className="font-semibold text-slate-700">{title}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></div>
}