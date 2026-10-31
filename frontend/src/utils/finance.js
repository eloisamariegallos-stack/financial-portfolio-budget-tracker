export const money = (value, currency='PHP') => new Intl.NumberFormat('en-PH', { style:'currency', currency, maximumFractionDigits:2 }).format(Number(value || 0))
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
export const monthKey = date => String(date || '').slice(0,7)
export const currentMonth = () => new Date().toISOString().slice(0,7)
export const sum = items => items.reduce((total, item) => total + Number(item.amount || 0), 0)

// Account balances are opening balances plus all linked transactions.
// Income increases an account; expenses decrease it. This is derived from
// transaction history so edits/deletions automatically update the balance.
export const balanceForAccount = (account, transactions = []) => {
  const opening = Number(account?.balance || 0)
  const activity = transactions
    .filter(t => t.accountId === account?.id)
    .reduce((total, t) => total + (t.type === 'income' ? 1 : -1) * Number(t.amount || 0), 0)
  return opening + activity
}
export const totalAccountBalance = (accounts = [], transactions = []) =>
  accounts.reduce((total, account) => total + balanceForAccount(account, transactions), 0)
export const monthTransactions = (transactions, month=currentMonth()) => transactions.filter(t => monthKey(t.date) === month)
export const totals = transactions => ({
  income: sum(transactions.filter(t => t.type === 'income')),
  expenses: sum(transactions.filter(t => t.type === 'expense')),
  savings: sum(transactions.filter(t => t.type === 'income')) - sum(transactions.filter(t => t.type === 'expense'))
})
export const expenseByCategory = transactions => {
  const grouped = {}
  transactions.filter(t => t.type === 'expense').forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount) })
  return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value)
}
export function downloadCSV(filename, rows) {
  const csv = rows.map(row => row.map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\r\n')
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
