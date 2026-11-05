import React, { useMemo, useState } from 'react'
import { Bot, Lightbulb, RotateCcw, Send, Sparkles, User } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { postApi } from '../utils/api'
import { expenseByCategory, money, monthTransactions, totals } from '../utils/finance'

const SESSION_KEY = 'fpt_session_v1'
const suggestions = [
  'Summarize my finances this month.',
  'What is my biggest expense category?',
  'Which budgets are nearly exceeded?',
  'Forecast my spending next month.',
  'How can I reduce my expenses?',
  'How much more do I need for my savings goal?',
  'Compare my income and expenses.'
]

function getAccessToken() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')?.access_token
  } catch {
    return null
  }
}

function buildFinancialContext(data) {
  const month = new Date().toISOString().slice(0, 7)
  const transactions = monthTransactions(data.transactions)
  const monthlyTotals = totals(transactions)
  const expensesByCategory = expenseByCategory(transactions).map(category => ({
    category: category.name,
    amount: category.value
  }))
  const budgets = data.budgets
    .filter(budget => budget.month === month)
    .map(budget => ({
      category: budget.category,
      limit: budget.limit,
      spent: transactions
        .filter(transaction =>
          transaction.type === 'expense' && transaction.category === budget.category
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0)
    }))
  const goals = data.goals.map(goal => ({
    name: goal.name,
    target: goal.target,
    saved: goal.saved
  }))

  return JSON.stringify({
    month,
    currency: data.settings.currency,
    income: monthlyTotals.income,
    expenses: monthlyTotals.expenses,
    netCashFlow: monthlyTotals.savings,
    expensesByCategory,
    budgets,
    goals
  })
}

export default function Assistant() {
  const { data } = useFinance()
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'Hi! I’m your PennyWise Finance Assistant. Ask me about your income, expenses, budgets, and savings goals. What would you like to know?'
  }])

  const send = async (text = question) => {
    const prompt = text.trim()
    if (!prompt || loading) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      setMessages(previous => [...previous, {
        role: 'assistant',
        text: 'Please sign in again before using the finance assistant.'
      }])
      return
    }

    const conversation = [...messages.slice(-19), { role: 'user', text: prompt }]
    setMessages(conversation)
    setQuestion('')
    setLoading(true)

    try {
      const result = await postApi('/api/assistant/chat', {
        messages: conversation.map(message => ({
          role: message.role,
          content: message.text
        })),
        financialContext: buildFinancialContext(data)
      }, accessToken)
      setMessages(previous => [...previous, { role: 'assistant', text: result.answer }])
    } catch (error) {
      setMessages(previous => [...previous, {
        role: 'assistant',
        text: `I couldn't get a response: ${error.message}`
      }])
    } finally {
      setLoading(false)
    }
  }

  const insights = useMemo(() => {
    const transactions = monthTransactions(data.transactions)
    const monthlyTotals = totals(transactions)
    const topExpense = expenseByCategory(transactions)[0]
    return [
      {
        title: 'Monthly net cash flow',
        value: money(monthlyTotals.savings, data.settings.currency),
        detail: 'Income minus expenses this month'
      },
      {
        title: 'Top expense category',
        value: topExpense?.name || 'No data',
        detail: topExpense
          ? money(topExpense.value, data.settings.currency)
          : 'Add expenses to see a breakdown'
      },
      {
        title: 'Active savings goals',
        value: String(data.goals.length),
        detail: 'Goals you are currently tracking'
      }
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Your personal money companion</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">AI Finance Assistant</h1>
        <p className="mt-2 text-sm text-slate-500">
          Ask questions about your current financial data.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Your question and a brief financial summary are sent to Cohere to generate replies.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card flex min-h-[620px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
                <Bot size={22} />
              </span>
              <div><h2 className="font-bold">Finance Assistant</h2></div>
            </div>
            <button
              className="btn-secondary text-sm"
              onClick={() => setMessages([{
                role: 'assistant',
                text: 'Conversation cleared. What would you like to explore?'
              }])}
            >
              <RotateCcw size={14} className="mr-1 inline" /> Clear
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === 'user'
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </span>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'rounded-tr-sm bg-emerald-700 text-white'
                    : 'rounded-tl-sm border border-slate-100 bg-white text-slate-700 shadow-sm'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  <Bot size={16} />
                </span>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  disabled={loading}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={event => {
                event.preventDefault()
                send()
              }}
            >
              <input
                className="field"
                value={question}
                onChange={event => setQuestion(event.target.value)}
                placeholder="Ask about your finances..."
                aria-label="Ask the finance assistant"
              />
              <button
                className="btn-primary shrink-0"
                disabled={!question.trim() || loading}
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </form>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <Sparkles size={17} className="text-amber-500" /> Financial insights
            </h2>
            <div className="mt-4 space-y-3">
              {insights.map(insight => (
                <div key={insight.title} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{insight.title}</p>
                  <p className="mt-1 font-bold text-slate-800">{insight.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{insight.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <Lightbulb size={17} className="text-amber-500" /> Try asking
            </h2>
            <div className="mt-3 space-y-1">
              {suggestions.slice(4).concat(suggestions.slice(0, 2)).map(suggestion => (
                <button
                  key={suggestion}
                  className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
                  onClick={() => send(suggestion)}
                  disabled={loading}
                >
                  {suggestion} →
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
