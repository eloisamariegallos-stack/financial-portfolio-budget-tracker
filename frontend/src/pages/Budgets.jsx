import React, { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { currentMonth, money, monthTransactions } from '../utils/finance'
import Modal from '../components/Modal'
import RecordForm from '../components/RecordForm'
import EmptyState from '../components/EmptyState'

const categories = ['Food', 'Transportation', 'Shopping', 'Bills', 'Education', 'Health', 'Housing', 'Software', 'Entertainment', 'Other']
const fields = [
  { name: 'category', label: 'Category', type: 'select', options: categories, required: true },
  { name: 'limit', label: 'Budget limit', type: 'number', required: true },
  { name: 'month', label: 'Month', type: 'text', placeholder: 'YYYY-MM', required: true }
]

// Same matching rule as the database triggers: ignore case and surrounding spaces.
const normalize = value => String(value || '').trim().toLowerCase()

export default function Budgets() {
  const { data, add, replace, remove } = useFinance()
  const [month, setMonth] = useState(currentMonth())
  const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState(null)
  const [query, setQuery] = useState('')

  // Percentage (0-100). Falls back to 80, the same level the database uses for budget warnings.
  const warningThreshold = Number(data.settings.warningThreshold) || 80

  const expenses = monthTransactions(data.transactions, month).filter(transaction => transaction.type === 'expense')
  const rows = data.budgets.filter(budget => budget.month === month && normalize(budget.category).includes(normalize(query)))
  const currencyFields = fields.map(field => field.name === 'limit'
    ? { ...field, label: `Budget limit (${data.settings.currency})` }
    : field)

  const closeModal = () => {
    setModal(false)
    setEdit(null)
  }

  const save = async budget => {
    const item = { ...budget, limit: Number(budget.limit) }
    try {
      if (edit) {
        await replace('budgets', item)
      } else {
        await add('budgets', item)
      }
      closeModal()
    } catch (error) {
      alert(error.message || 'Could not save the budget.')
    }
  }

  const deleteBudget = async budget => {
    if (!confirm(`Delete ${budget.category} budget?`)) return
    try {
      await remove('budgets', budget.id)
    } catch (error) {
      alert(error.message || 'Could not delete the budget.')
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Plan your spending</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Budgets</h1>
        <p className="mt-2 text-sm text-slate-500">Set category limits and keep spending on track.</p>
      </div>
      <button className="btn-primary" onClick={() => { setEdit(null); setModal(true) }}>
        <Plus size={16} className="mr-1 inline" /> Create budget
      </button>
    </div>

    <div className="card flex flex-wrap items-end gap-4 p-4">
      <label className="text-sm text-slate-500">
        Month
        <select className="field mt-1 block min-w-48" value={month} onChange={event => setMonth(event.target.value)}>
          <option value={currentMonth()}>{currentMonth()} (current)</option>
          {Array.from({ length: 18 }, (_, index) => {
            const date = new Date()
            date.setDate(1)
            date.setMonth(date.getMonth() - index)
            return date.toISOString().slice(0, 7)
          }).filter(value => value !== currentMonth()).map(value => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-sm text-slate-500">
        Search category
        <input className="field mt-1 block" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a budget" />
      </label>
      <div className="ml-auto">
        <p className="text-xs text-slate-500">Total allocated</p>
        <p className="text-xl font-extrabold">{money(rows.reduce((sum, budget) => sum + budget.limit, 0), data.settings.currency)}</p>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      {rows.map(budget => {
        const spent = expenses
          .filter(transaction => normalize(transaction.category) === normalize(budget.category))
          .reduce((sum, transaction) => sum + transaction.amount, 0)
        const percentage = budget.limit > 0 ? spent / budget.limit * 100 : 0
        const remaining = budget.limit - spent
        // Over budget only when spending is ABOVE the limit (matches the database alert rule).
        const isOver = spent > budget.limit
        const isWarning = !isOver && percentage >= warningThreshold
        return <div key={budget.id} className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{budget.month}</span>
              <h2 className="mt-3 text-lg font-bold">{budget.category}</h2>
            </div>
            <div className="flex gap-1">
              <button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => { setEdit(budget); setModal(true) }}>
                <Pencil size={15} />
              </button>
              <button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" onClick={() => deleteBudget(budget)}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">Spent so far</p>
              <p className="mt-1 text-2xl font-extrabold">{money(spent, data.settings.currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Budget limit</p>
              <p className="font-bold">{money(budget.limit, data.settings.currency)}</p>
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className={isOver ? 'font-semibold text-rose-600' : isWarning ? 'font-semibold text-amber-600' : 'text-slate-500'}>
              {percentage.toFixed(0)}% used {isOver ? '· Over budget' : isWarning ? '· Approaching limit' : ''}
            </span>
            <span className={remaining < 0 ? 'text-rose-600' : 'text-slate-500'}>
              {money(Math.abs(remaining), data.settings.currency)} {remaining < 0 ? 'over' : 'left'}
            </span>
          </div>
        </div>
      })}
    </div>

    {!rows.length && <div className="card"><EmptyState title="No budgets for this month" detail="Create a budget or select another month." /></div>}

    {modal && <Modal title={edit ? 'Edit budget' : 'Create budget'} onClose={closeModal}>
      <RecordForm
        fields={currencyFields}
        initial={edit || { month, limit: 3000, category: 'Food' }}
        onSave={save}
        onCancel={closeModal}
      />
    </Modal>}
  </div>
}