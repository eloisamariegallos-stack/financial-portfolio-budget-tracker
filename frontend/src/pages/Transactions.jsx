import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { downloadCSV, formatDisplayDate, formatDisplayTime, money, normalizeTransactionDateTime, transactionSortValue, uid } from '../utils/finance'
import Modal from '../components/Modal'
import RecordForm from '../components/RecordForm'
import EmptyState from '../components/EmptyState'

const categories = ['Food', 'Transportation', 'Shopping', 'Bills', 'Education', 'Health', 'Housing', 'Software', 'Entertainment', 'Salary', 'Freelance', 'Business', 'Allowance', 'Investment', 'Gift', 'Other']

const localDateValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildFields = (accounts, currency) => [
  { name: 'description', label: 'Description', required: true, placeholder: 'e.g. Grocery shopping' },
  { name: 'amount', label: `Amount (${currency})`, type: 'number', required: true },
  { name: 'type', label: 'Type', type: 'select', options: ['expense', 'income'], required: true },
  { name: 'category', label: 'Category', type: 'select', options: categories, required: true },
  { name: 'accountId', label: 'Account', type: 'select', options: accounts.map(a => ({ value: a.id, label: a.name })), required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'time', label: 'Time', type: 'time' },
  { name: 'method', label: 'Payment method', type: 'select', options: ['Cash', 'Debit card', 'Credit card', 'Bank transfer', 'Online banking', 'Digital wallet'], required: true },
  { name: 'notes', label: 'Notes', type: 'textarea', wide: true }
]

export default function Transactions() {
  const { data, add, replace, remove } = useFinance()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(params.get('search') || '')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [account, setAccount] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState('newest')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [view, setView] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null)
      if (data.accounts.length) {
        setModal(true)
      } else {
        setNotice('Add an account first, then you can record a transaction.')
      }
      setParams(previous => {
        previous.delete('new')
        return previous
      }, { replace: true })
    }
  }, [params, setParams, data.accounts.length])

  const filtered = useMemo(() => {
    const matches = data.transactions.filter(transaction => {
      const haystack = `${transaction.description || ''} ${transaction.category || ''} ${transaction.notes || ''}`.toLowerCase()
      const matchesQuery = haystack.includes(query.toLowerCase())
      const matchesType = type === 'all' || transaction.type === type
      const matchesCategory = category === 'all' || transaction.category === category
      const matchesAccount = account === 'all' || transaction.accountId === account
      const matchesFrom = !from || String(transaction.date || '').localeCompare(from) >= 0
      const matchesTo = !to || String(transaction.date || '').localeCompare(to) <= 0
      return matchesQuery && matchesType && matchesCategory && matchesAccount && matchesFrom && matchesTo
    })

    return [...matches].sort((a, b) => {
      const aValue = transactionSortValue(a)
      const bValue = transactionSortValue(b)
      switch (sort) {
        case 'oldest':
          return aValue - bValue
        case 'amount-high':
          return Number(b.amount) - Number(a.amount)
        case 'amount-low':
          return Number(a.amount) - Number(b.amount)
        case 'newest':
        default:
          return bValue - aValue
      }
    })
  }, [account, category, data.transactions, from, query, sort, to, type])

  const openEdit = transaction => {
    setEditing({
      ...transaction,
      time: transaction.time || '',
      date: transaction.date || localDateValue()
    })
    setModal(true)
  }

  const save = async transaction => {
    const normalized = normalizeTransactionDateTime(transaction.date, transaction.time)
    const item = {
      ...transaction,
      amount: Number(transaction.amount),
      date: normalized.date,
      time: normalized.time,
      notes: transaction.notes || ''
    }

    if (editing) {
      await replace('transactions', item)
      setNotice('Transaction updated.')
    } else {
      await add('transactions', item)
      setNotice('Transaction added.')
    }

    setModal(false)
    setEditing(null)
    setTimeout(() => setNotice(''), 2500)
  }

  const deleteTransaction = async transaction => {
    if (!window.confirm(`Delete "${transaction.description}"?`)) return
    try {
      await remove('transactions', transaction.id)
    } catch (error) {
      alert(error.message || 'Could not delete this transaction.')
    }
  }

  const clear = () => {
    setQuery('')
    setType('all')
    setCategory('all')
    setAccount('all')
    setFrom('')
    setTo('')
    setSort('newest')
  }

  const exportRows = [
    ['Date', 'Time', 'Description', 'Type', 'Category', 'Account', 'Payment method', 'Amount', 'Notes'],
    ...filtered.map(transaction => [
      formatDisplayDate(transaction.date),
      formatDisplayTime(transaction.time),
      transaction.description,
      transaction.type,
      transaction.category,
      data.accounts.find(accountItem => accountItem.id === transaction.accountId)?.name || 'Deleted account',
      transaction.method,
      transaction.amount,
      transaction.notes || ''
    ])
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Money activity</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">Transactions</h1>
          <p className="mt-2 text-sm text-slate-500">Track every amount coming in and going out.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => downloadCSV('transactions.csv', exportRows)}>
            <Download size={16} className="mr-1 inline" /> Export CSV
          </button>
          <button className="btn-primary" onClick={() => {
            setEditing(null)
            if (data.accounts.length) {
              setModal(true)
            } else {
              setNotice('Add an account first, then you can record a transaction.')
              navigate('/accounts')
            }
          }}>
            <Plus size={17} className="mr-1 inline" /> Add transaction
          </button>
        </div>
      </div>

      {notice && (
        <div role="status" className="flex flex-col gap-3 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{notice}</span>
          {notice.includes('Add an account first') && (
            <button className="btn-primary shrink-0" onClick={() => navigate('/accounts')}>Go to Accounts</button>
          )}
        </div>
      )}

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="field search-input pl-10" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search transactions" />
          </label>
          <select className="field" value={type} onChange={event => setType(event.target.value)}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="field" value={category} onChange={event => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="field" value={account} onChange={event => setAccount(event.target.value)}>
            <option value="all">All accounts</option>
            {data.accounts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <label className="text-xs text-slate-500">
            From
            <input type="date" className="field mt-1" value={from} onChange={event => setFrom(event.target.value)} />
          </label>
          <label className="text-xs text-slate-500">
            To
            <input type="date" className="field mt-1" value={to} onChange={event => setTo(event.target.value)} />
          </label>
          <select className="field" value={sort} onChange={event => setSort(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-high">Amount: high to low</option>
            <option value="amount-low">Amount: low to high</option>
          </select>
          <button className="btn-secondary" onClick={clear}>
            <X size={15} className="mr-1 inline" /> Clear filters
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold">All transactions</h2>
            <p className="mt-1 text-xs text-slate-500">{filtered.length} records found</p>
          </div>
          <div className="text-sm text-slate-500">Income shown in <span className="font-semibold text-emerald-700">green</span></div>
        </div>

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  {['Transaction', 'Category / Account', 'Date', 'Payment', 'Amount', 'Actions'].map(column => (
                    <th key={column} className="px-5 py-3 font-semibold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(transaction => (
                  <tr key={transaction.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <button onClick={() => setView(transaction)} className="text-left font-semibold text-slate-700 hover:text-emerald-700">
                        {transaction.description}
                      </button>
                      <p className="mt-1 text-xs capitalize text-slate-400">{transaction.type}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs">{transaction.category}</span>
                      <p className="mt-2 text-xs text-slate-500">{data.accounts.find(accountItem => accountItem.id === transaction.accountId)?.name || 'Unknown account'}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      <div>{formatDisplayDate(transaction.date)}</div>
                      <div className="mt-1 text-xs text-slate-400">{formatDisplayTime(transaction.time)}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{transaction.method}</td>
                    <td className={`whitespace-nowrap px-5 py-4 font-bold ${transaction.type === 'income' ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{money(transaction.amount, data.settings.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <button title="View" className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setView(transaction)}>View</button>
                        <button title="Edit" className="rounded-lg p-2 hover:bg-slate-100" onClick={() => openEdit(transaction)}><Pencil size={15} /></button>
                        <button title="Delete" className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" onClick={() => deleteTransaction(transaction)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState title="No transactions match your filters" /></div>
        )}
      </div>

      {modal && (
        <Modal title={editing ? 'Edit transaction' : 'Add transaction'} onClose={() => { setModal(false); setEditing(null) }} wide>
          <RecordForm
            fields={buildFields(data.accounts, data.settings.currency)}
            initial={
              editing || {
                description: '',
                amount: '',
                type: 'expense',
                category: 'Food',
                accountId: data.accounts[0]?.id || '',
                date: localDateValue(),
                time: '',
                method: 'Cash',
                notes: ''
              }
            }
            onSave={save}
            onCancel={() => { setModal(false); setEditing(null) }}
            submitLabel={editing ? 'Save changes' : 'Add transaction'}
          />
        </Modal>
      )}

      {view && (
        <Modal title="Transaction details" onClose={() => setView(null)}>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">{view.description}</p>
              <p className="mt-1 uppercase tracking-wide text-slate-400">{view.type}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Date</p>
                <p className="mt-1 font-medium text-slate-700">{formatDisplayDate(view.date)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Time</p>
                <p className="mt-1 font-medium text-slate-700">{formatDisplayTime(view.time)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Category</p>
                <p className="mt-1 font-medium text-slate-700">{view.category}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
                <p className="mt-1 font-bold text-slate-800">{view.type === 'income' ? '+' : '-'}{money(view.amount, data.settings.currency)}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Notes</p>
              <p className="mt-1 text-slate-700">{view.notes || 'No notes added.'}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
