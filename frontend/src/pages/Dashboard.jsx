import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, ArrowRight, CalendarDays, Download, Plus, RefreshCw, TrendingUp, Wallet } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { currentMonth, downloadCSV, expenseByCategory, money, monthKey, monthTransactions, totals, totalAccountBalance } from '../utils/finance'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'

const COLORS = ['#557C55', '#8FAF78', '#A4B894', '#6E8970', '#B7CE91', '#82977A', '#A9B79A']

export default function Dashboard() {
  const { data, syncStatus } = useFinance()
  const navigate = useNavigate()
  const monthData = monthTransactions(data.transactions)
  const monthTotals = totals(monthData)
  const categories = expenseByCategory(monthData)
  const recent = [...data.transactions].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5)
  const accountBalance = totalAccountBalance(data.accounts, data.transactions)
  const budget = data.budgets.filter(b => b.month === currentMonth()).reduce((sum, item) => sum + Number(item.limit || 0), 0)
  const spending = Math.min(monthTotals.expenses, budget || monthTotals.expenses)
  const cashflow = Array.from({ length: 6 }, (_, index) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - 5 + index)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const relevant = data.transactions.filter(t => monthKey(t.date) === key)
    return {
      month: d.toLocaleDateString('en', { month: 'short' }),
      Income: totals(relevant).income,
      Expenses: totals(relevant).expenses
    }
  })

  const loading = syncStatus === 'loading'

  return (
    <div className="space-y-7">
      <p className="text-sm font-medium text-slate-500">Financial Portfolio and Budget Tracker</p>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CalendarDays size={15} /> {new Date().toLocaleDateString(data.settings?.language === 'English (PH)' ? 'en-PH' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-800">
            Good to see you, {data.profile.name.split(' ')[0]} <span aria-hidden="true">!</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Here is what is happening with your money today.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={() => downloadCSV('financial-portfolio-report.csv', [['Date', 'Description', 'Type', 'Category', 'Amount'], ...data.transactions.map(t => [t.date, t.description, t.type, t.category, t.amount])])}>
            <Download size={16} /> Export report
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/transactions?new=1')}>
            <Plus size={17} /> Add transaction
          </button>
        </div>
      </div>

      {loading ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="card animate-pulse p-5">
              <div className="h-3 w-20 rounded-full bg-slate-200" />
              <div className="mt-5 h-8 w-32 rounded-xl bg-slate-200" />
              <div className="mt-3 h-3 w-28 rounded-full bg-slate-100" />
            </div>
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total balance" value={money(accountBalance, data.settings.currency)} hint="Across your tracked accounts" icon={Wallet} tone="green" />
          <StatCard label="Income this month" value={money(monthTotals.income, data.settings.currency)} hint="Money coming in" icon={ArrowDownRight} tone="blue" />
          <StatCard label="Expenses this month" value={money(monthTotals.expenses, data.settings.currency)} hint="Money going out" icon={ArrowUpRight} tone="rose" />
          <StatCard label="Net savings this month" value={money(monthTotals.savings, data.settings.currency)} hint="Income minus expenses" icon={TrendingUp} tone="violet" />
        </section>
      )}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card p-5 sm:p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Cash flow</h2>
              <p className="mt-1 text-sm text-slate-500">Income compared with expenses</p>
            </div>
            <button onClick={() => navigate('/analytics')} className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
              Details <ArrowRight size={15} />
            </button>
          </div>
          <div className="h-[270px]">
            {cashflow.some(item => item.Income || item.Expenses) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflow} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2ef" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={value => money(value, data.settings.currency)} />
                  <Tooltip formatter={value => money(value, data.settings.currency)} />
                  <Area type="monotone" dataKey="Income" stroke="#0f9f6e" fill="url(#incomeFill)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Expenses" stroke="#f97373" fill="#fee2e2" fillOpacity={0.45} strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </div>
          <div className="mt-3 flex justify-center gap-5 text-xs text-slate-500">
            <span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />Income</span>
            <span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-rose-400" />Expenses</span>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="font-bold text-slate-800">Spending breakdown</h2>
            <p className="mt-1 text-sm text-slate-500">By category this month</p>
          </div>
          <div className="h-[190px]">
            {categories.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={53} outerRadius={78} paddingAngle={3}>
                    {categories.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => money(value, data.settings.currency)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No expenses yet" />
            )}
          </div>
          <div className="space-y-3">
            {categories.slice(0, 4).map((category, index) => (
              <div key={category.name} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                  {category.name}
                </span>
                <span className="font-semibold text-slate-800">{money(category.value, data.settings.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-800">Recent transactions</h2>
              <p className="mt-1 text-xs text-slate-500">Your latest money activity</p>
            </div>
            <button onClick={() => navigate('/transactions')} className="text-sm font-semibold text-emerald-700">
              View all <ArrowRight size={14} className="ml-1 inline" />
            </button>
          </div>

          {recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Transaction</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(item => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-semibold text-slate-700">{item.description}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">{item.date}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{item.category}</span>
                      </td>
                      <td className={`whitespace-nowrap px-5 py-4 text-right font-bold ${item.type === 'income' ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {item.type === 'income' ? '+' : '-'}{money(item.amount, data.settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Monthly budgets</h2>
              <p className="mt-1 text-sm text-slate-500">This month&apos;s spending target</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm text-slate-600">Used</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-800">{money(spending, data.settings.currency)}</p>
              <p className="mt-1 text-xs text-slate-500">of {money(budget || 0, data.settings.currency)} budget</p>
            </div>
            <div className="space-y-3">
              {budget ? (
                <>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (spending / budget) * 100 || 0)}%` }} />
                  </div>
                  <p className="text-sm text-slate-500">{Math.round(Math.min(100, (spending / budget) * 100 || 0))}% of your monthly budget is in use.</p>
                </>
              ) : (
                <p className="text-sm text-slate-500">Set a monthly budget to start tracking your spending plan.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
