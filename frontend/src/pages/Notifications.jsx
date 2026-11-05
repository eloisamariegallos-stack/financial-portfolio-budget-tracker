import React, { useEffect, useState } from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import EmptyState from '../components/EmptyState'

// Dates from the database are ISO timestamps; older local reminders may be plain text.
const formatDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value || '') : date.toLocaleString()
}

const iconStyle = notification => {
  if (notification.read) return 'bg-slate-100 text-slate-500'
  if (notification.type === 'budget_exceeded') return 'bg-rose-100 text-rose-700'
  if (notification.type === 'budget_warning') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-800'
}

export default function Notifications() {
  const { data, add, remove, markNotificationRead, markAllNotificationsRead, refreshNotifications } = useFinance()
  const [filter, setFilter] = useState('all')

  // Budget alerts are created by the database, so reload them whenever this page opens.
  useEffect(() => { refreshNotifications() }, [refreshNotifications])

  const rows = data.notifications.filter(notification =>
    filter === 'all' || (filter === 'unread' ? !notification.read : notification.read))
  const unreadCount = data.notifications.filter(notification => !notification.read).length

  const run = async action => {
    try {
      await action()
    } catch (error) {
      alert(error.message || 'Something went wrong.')
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Stay in the loop</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Notifications</h1>
        <p className="mt-2 text-sm text-slate-500">Updates and reminders for your workspace.</p>
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => run(markAllNotificationsRead)}>
          <CheckCheck size={15} className="mr-1 inline" /> Mark all read
        </button>
        <button
          className="btn-primary"
          onClick={() => run(() => add('notifications', {
            id: `local-${Date.now()}`,
            type: 'reminder',
            title: 'Personal reminder',
            message: 'Remember to review your financial records.',
            date: new Date().toISOString(),
            read: false
          }))}
        >
          Add reminder
        </button>
      </div>
    </div>

    <div className="card p-4">
      <div className="flex flex-wrap gap-2">
        {[['all', 'All'], ['unread', 'Unread'], ['read', 'Read']].map(([value, label]) => (
          <button
            key={value}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === value ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={() => setFilter(value)}
          >
            {label}{value === 'unread' ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>
    </div>

    <div className="card divide-y divide-slate-100">
      {rows.map(notification => (
        <div key={notification.id} className={`flex gap-4 p-5 ${!notification.read ? 'bg-emerald-50/35' : ''}`}>
          <span className={`mt-1 rounded-xl p-3 ${iconStyle(notification)}`}>
            <Bell size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold">{notification.title}</h2>
              {!notification.read && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">NEW</span>
              )}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
            <p className="mt-2 text-xs text-slate-400">{formatDate(notification.date)}</p>
          </div>
          <div className="flex items-start gap-1">
            {!notification.read && (
              <button
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                onClick={() => run(() => markNotificationRead(notification.id))}
              >
                Mark read
              </button>
            )}
            <button
              className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
              aria-label="Delete notification"
              onClick={() => run(() => remove('notifications', notification.id))}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      {!rows.length && <EmptyState title="You're all caught up" detail="No notifications in this filter." />}
    </div>
  </div>
}