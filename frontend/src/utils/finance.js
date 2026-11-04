export const SE_ASIA_COUNTRIES = [
  { name: 'Philippines', currency: 'PHP', language: 'English (PH)', locale: 'en-PH' },
  { name: 'Singapore', currency: 'SGD', language: 'English (SG)', locale: 'en-SG' },
  { name: 'Malaysia', currency: 'MYR', language: 'Bahasa Melayu', locale: 'ms-MY' },
  { name: 'Thailand', currency: 'THB', language: 'ไทย', locale: 'th-TH' },
  { name: 'Indonesia', currency: 'IDR', language: 'Bahasa Indonesia', locale: 'id-ID' },
  { name: 'Vietnam', currency: 'VND', language: 'Tiếng Việt', locale: 'vi-VN' },
  { name: 'Brunei', currency: 'BND', language: 'Bahasa Melayu', locale: 'ms-BN' },
  { name: 'Cambodia', currency: 'KHR', language: 'ភាសាខ្មែរ', locale: 'km-KH' },
  { name: 'Laos', currency: 'LAK', language: 'Lao', locale: 'lo-LA' },
  { name: 'Myanmar', currency: 'MMK', language: 'မြန်မာ', locale: 'my-MM' }
]

export const CURRENCY_OPTIONS = [
  { value: 'PHP', label: 'Philippine Peso — PHP (₱)' },
  { value: 'SGD', label: 'Singapore Dollar — SGD (S$)' },
  { value: 'MYR', label: 'Malaysian Ringgit — MYR (RM)' },
  { value: 'THB', label: 'Thai Baht — THB (฿)' },
  { value: 'IDR', label: 'Indonesian Rupiah — IDR (Rp)' },
  { value: 'VND', label: 'Vietnamese Dong — VND (₫)' },
  { value: 'BND', label: 'Brunei Dollar — BND (B$)' },
  { value: 'KHR', label: 'Cambodian Riel — KHR (៛)' },
  { value: 'LAK', label: 'Lao Kip — LAK (₭)' },
  { value: 'MMK', label: 'Myanmar Kyat — MMK (K)' }
]

const currencyLocales = {
  PHP: 'en-PH',
  SGD: 'en-SG',
  MYR: 'en-MY',
  THB: 'th-TH',
  IDR: 'id-ID',
  VND: 'vi-VN',
  BND: 'en-BN',
  KHR: 'km-KH',
  LAK: 'lo-LA',
  MMK: 'my-MM'
}

const currencySymbols = {
  PHP: '₱',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  IDR: 'Rp',
  VND: '₫',
  BND: 'B$',
  KHR: '៛',
  LAK: '₭',
  MMK: 'K'
}

export const getCountryMeta = (country = 'Philippines') =>
  SE_ASIA_COUNTRIES.find(item => item.name === country) || SE_ASIA_COUNTRIES[0]

export const resolveThemeMode = (theme, prefersDark = false) => {
  if (theme === 'dark') return 'dark'
  if (theme === 'system') return prefersDark ? 'dark' : 'light'
  return 'light'
}

const toLocalDateInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toLocalTimeInputValue = (date = new Date()) => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const parseLocalDateTime = (dateValue, timeValue = '') => {
  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue
  }

  const dateText = String(dateValue || '').trim()
  if (!dateText) return null

  const normalized = dateText.includes('T') ? dateText : dateText.includes(' ') ? dateText.replace(' ', 'T') : dateText
  const [datePart, embeddedTime = ''] = normalized.split('T')
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  if (!dateMatch) {
    const parsed = new Date(normalized)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const [, yearText, monthText, dayText] = dateMatch
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const parsed = new Date(year, month - 1, day)
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null

  const timeText = String(timeValue || embeddedTime).trim()
  if (!timeText) return parsed
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/.exec(timeText)
  if (!timeMatch) return null

  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  const second = Number(timeMatch[3] || 0)
  if (hour > 23 || minute > 59 || second > 59) return null
  parsed.setHours(hour, minute, second, 0)
  return parsed
}

export const normalizeTransactionDateTime = (dateValue, timeValue) => {
  const dateText = String(dateValue || '').trim() || toLocalDateInputValue(new Date())
  const timeText = String(timeValue || '').trim()
  const parsed = parseLocalDateTime(dateText, timeText)
  return {
    date: dateText,
    time: parsed && timeText ? timeText : '',
    timestamp: parsed?.getTime() ?? null,
    value: timeText && parsed ? `${dateText}T${timeText}` : dateText
  }
}

export const toUtcIso = (dateValue, timeValue) => {
  const parsed = parseLocalDateTime(dateValue, timeValue || toLocalTimeInputValue())
  return parsed ? parsed.toISOString() : undefined
}

export const splitLocalDateTime = iso => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return {
    date: toLocalDateInputValue(date),
    time: toLocalTimeInputValue(date)
  }
}

export const transactionSortValue = transaction => {
  const rawDate = transaction?.date || ''
  const parsed = parseLocalDateTime(rawDate, transaction?.time)
  return parsed?.getTime() ?? 0
}

export const formatDisplayDate = value => {
  if (!value) return '—'
  const parsed = parseLocalDateTime(value)
  if (!parsed) return value
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatDisplayTime = value => {
  const timeText = String(value || '').trim()
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/.exec(timeText)
  if (!timeMatch) return '—'
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  const second = Number(timeMatch[3] || 0)
  if (hour > 23 || minute > 59 || second > 59) return '—'
  const date = new Date()
  date.setHours(hour, minute, second, 0)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export const money = (value, currency = 'PHP') => {
  const selectedCurrency = currencyLocales[currency] ? currency : 'PHP'
  const formatter = new Intl.NumberFormat(currencyLocales[selectedCurrency], {
    style: 'currency',
    currency: selectedCurrency,
    maximumFractionDigits: 2
  })
  return formatter.formatToParts(Number(value || 0))
    .map(part => part.type === 'currency' ? currencySymbols[selectedCurrency] : part.value)
    .join('')
}
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
export const monthKey = date => {
  if (date instanceof Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  const parsed = parseLocalDateTime(date)
  if (!parsed) {
    const text = String(date || '').trim()
    return text.length >= 7 ? text.slice(0, 7) : ''
  }
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`
}
export const currentMonth = () => monthKey(new Date())
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
