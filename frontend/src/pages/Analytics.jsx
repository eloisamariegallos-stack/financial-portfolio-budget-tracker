import React, { useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { currentMonth, downloadCSV, expenseByCategory, money, monthKey } from '../utils/finance'
import EmptyState from '../components/EmptyState'

const colors = ['#0f9f6e', '#60a5fa', '#a78bfa', '#f59e0b', '#fb7185', '#14b8a6', '#94a3b8']

export default function Analytics() {
  const { data } = useFinance()
  const [period, setPeriod] = useState('6')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')

  const filteredTransactions = data.transactions.filter(transaction => {
    const matchesType = type === 'all' || transaction.type === type
    const matchesCategory = category === 'all' || transaction.category === category
    return matchesType && matchesCategory
  })

  const months = useMemo(() => {
    const range = Number(period) || 6
    const entries = []
    const current = new Date();
    current.setDate(1)

    for (let index = range - 1; index >= 0; index -= 1) {
      const date = new Date(current.getFullYear(), current.getMonth() - index, 1)
      const key = monthKey(date)
      const row = {
        key,
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: 0,
        expenses: 0,
        savings: 0
      }

      filteredTransactions.forEach(transaction => {
        if (monthKey(transaction.date) !== key) return
        if (transaction.type === 'income') row.income += Number(transaction.amount || 0)
        else row.expenses += Number(transaction.amount || 0)
      })

      row.savings = row.income - row.expenses
      entries.push(row)
    }

    return entries
  }, [filteredTransactions, period])

  const categories = useMemo(
    () => [...new Set(data.transactions.filter(transaction => transaction.type === 'expense').map(transaction => transaction.category))],
    [data.transactions]
  )

  const expenseBreakdown = useMemo(
    () => expenseByCategory(filteredTransactions).filter(item => Number(item.value) > 0),
    [filteredTransactions]
  )

  const report = [['Month', 'Income', 'Expenses', 'Net cash flow'], ...months.map(row => [row.month, row.income, row.expenses, row.savings])]
  const budgetMonth = currentMonth()
  const budgetRows = data.budgets.filter(budget => budget.month === budgetMonth)

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Insights that move you forward</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Analytics & Reports</h1>
        <p className="mt-2 text-sm text-slate-500">Understand cash flow and spending patterns.</p>
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => window.print()}><Printer size={16} className="mr-1 inline" /> Print</button>
        <button className="btn-primary" onClick={() => downloadCSV('financial-analytics.csv', report)}><Download size={16} className="mr-1 inline" /> Export CSV</button>
      </div>
    </div>

    <div className="card grid gap-3 p-4 sm:grid-cols-3">
      <label className="text-xs font-medium text-slate-500">Reporting period
        <select className="field mt-1" value={period} onChange={event => setPeriod(event.target.value)}>
          <option value="3">Last 3 months</option>
          <option value="6">Last 6 months</option>
          <option value="12">Last 12 months</option>
        </select>
      </label>
      <label className="text-xs font-medium text-slate-500">Transaction type
        <select className="field mt-1" value={type} onChange={event => setType(event.target.value)}>
          <option value="all">Income and expenses</option>
          <option value="income">Income only</option>
          <option value="expense">Expenses only</option>
        </select>
      </label>
      <label className="text-xs font-medium text-slate-500">Category filter
        <select className="field mt-1" value={category} onChange={event => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <div className="card p-5">
        <h2 className="font-bold">Income vs. expenses</h2>
        <p className="mt-1 text-sm text-slate-500">Monthly comparison</p>
        <div className="mt-4 h-[280px]">
          {filteredTransactions.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis width={110} tick={{ fontSize: 10 }} tickFormatter={value => money(value, data.settings.currency)} />
                <Tooltip formatter={value => money(value, data.settings.currency)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#0f9f6e" radius={[5, 5, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#fb7185" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No matching transactions" />}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold">Expense breakdown</h2>
        <p className="mt-1 text-sm text-slate-500">Categories across selected transactions</p>
        <div className="mt-4 h-[280px]">
          {expenseBreakdown.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="value" nameKey="name" outerRadius={95} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expenseBreakdown.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip formatter={value => money(value, data.settings.currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No expenses in this selection" />}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold">Net cash flow trend</h2>
        <p className="mt-1 text-sm text-slate-500">Income minus expenses</p>
        <div className="mt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={months}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis width={110} tick={{ fontSize: 10 }} tickFormatter={value => money(value, data.settings.currency)} />
              <Tooltip formatter={value => money(value, data.settings.currency)} />
              <Line type="monotone" dataKey="savings" name="Net cash flow" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold">Budget utilization</h2>
        <p className="mt-1 text-sm text-slate-500">Current month by category</p>
        <div className="mt-5 space-y-4">
          {budgetRows.length ? (
            budgetRows.map(budget => {
              const spent = data.transactions
                .filter(transaction => transaction.type === 'expense' && transaction.category === budget.category && monthKey(transaction.date) === budget.month)
                .reduce((total, transaction) => total + Number(transaction.amount || 0), 0)
              const utilization = budget.limit > 0 ? Math.min(100, (spent / budget.limit) * 100) : 0

              return <div key={budget.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{budget.category}</span>
                  <span>{money(spent, data.settings.currency)} / {money(budget.limit, data.settings.currency)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${utilization >= 100 ? 'bg-rose-500' : utilization >= Number(data.settings.warningThreshold || 80) ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${utilization}%` }} />
                </div>
              </div>
            })
          ) : <EmptyState title="No budget data" />}
        </div>
      </div>
    </div>

    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-bold">Monthly report</h2>
        <p className="mt-1 text-sm text-slate-500">Based on your selected filters and financial records.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              {['Month', 'Income', 'Expenses', 'Net cash flow'].map(column => <th key={column} className="px-5 py-3">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {months.map(row => <tr key={row.key} className="border-t border-slate-100">
              <td className="px-5 py-3 font-semibold">{row.month}</td>
              <td className="px-5 py-3 text-emerald-700">{money(row.income, data.settings.currency)}</td>
              <td className="px-5 py-3">{money(row.expenses, data.settings.currency)}</td>
              <td className={`px-5 py-3 font-semibold ${row.savings >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{money(row.savings, data.settings.currency)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </div>
}
