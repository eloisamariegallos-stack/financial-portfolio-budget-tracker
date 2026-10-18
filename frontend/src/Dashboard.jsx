import React, { useState, useEffect } from 'react';

import {

  LayoutDashboard,

  ArrowLeftRight,

  ChartNoAxesCombined,

  Settings,

  Wallet,

  Sparkles,

  TrendingUp,

  TrendingDown,

  Search,

  Utensils,

  ShoppingBag,

  CarFront,

  BriefcaseBusiness,

  Receipt,

  HeartPulse,

  BookOpen,

  Gamepad2,

  House,

  Trash2,

  FileText,

  CircleDollarSign,

  Tags,

  Plus,

  RotateCcw,

  CheckCircle2,

  ChevronDown,

} from 'lucide-react';



function Dashboard({ onLogout }) {

  // 1. LOCAL STORAGE SYSTEM: Hydrate transactions ledger from active window memory cache

  const [transactions, setTransactions] = useState(() => {

    const saved = localStorage.getItem('project_noah_transactions');

    if (saved) return JSON.parse(saved);

    // Turned to empty array as default so it becomes truly blank after reset

    return [];

  });



  const [transactionSuccess, setTransactionSuccess] = useState('');



  // Controlled UI Form State Engines

  const [description, setDescription] = useState('');

  const [amount, setAmount] = useState('');

  const [transactionType, setTransactionType] = useState('expense');

  const [category, setCategory] = useState('Food');



  // Multi-view navigation handler state context framework

  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);



  // Maintain transactional state preservation across refresh boundaries

  useEffect(() => {

    localStorage.setItem('project_noah_transactions', JSON.stringify(transactions));

  }, [transactions]);



  // Comprehensive mathematical pipeline to ensure data absolute integrity

  const totalIncome = transactions

    .filter(t => t.type === 'income')

    .reduce((sum, t) => sum + Number(t.amount), 0);



  const totalExpenses = transactions

    .filter(t => t.type === 'expense')

    .reduce((sum, t) => sum + Number(t.amount), 0);



  const totalBalance = totalIncome - totalExpenses;



  // PIPELINE HOOK: Append new sanitized structural nodes into state block

  const handleSaveTransaction = (e) => {

    e.preventDefault();

    if (!description || !amount || Number(amount) <= 0) {

      alert("Please enter a valid description and amount parameters!");

      return;

    }



    const newTransaction = {

      id: Date.now(),

      description: description,

      type: transactionType,

      amount: Number(amount),

      category: category

    };



    setTransactions([newTransaction, ...transactions]);

    setDescription('');

    setAmount('');

  };



  // PIPELINE HOOK: Safely remove nodes from state context

  const handleDeleteTransaction = (id) => {

    if (window.confirm("Are you sure you want to delete this transaction record?")) {

      setTransactions(transactions.filter(t => t.id !== id));

    }

  };



  // HELPER INTERPRETER: Maps specific categories to visual indicators

  const getCategoryIcon = (cat) => {

    switch (cat) {

      case 'Food': return '🍔';

      case 'Transportation': return '🚌';

      case 'Software': return '💻';

      case 'Salary': return '💰';

      default: return '📝';

    }

  };



  // RECENT TRANSACTIONS: SEARCH, FILTERS, AND PAGINATION

const [transactionSearch, setTransactionSearch] = useState('');

const [transactionFilter, setTransactionFilter] = useState('all');

const [visibleTransactionCount, setVisibleTransactionCount] = useState(5);



const filteredTransactions = transactions.filter((t) => {

  const search = transactionSearch.toLowerCase().trim();



  const matchesSearch =

    String(t.description || '').toLowerCase().includes(search) ||

    String(t.category || '').toLowerCase().includes(search);



  const matchesFilter =

    transactionFilter === 'all' ||

    (transactionFilter === 'income' && t.type === 'income') ||

    (transactionFilter === 'expenses' && t.type !== 'income');



  return matchesSearch && matchesFilter;

});



const visibleTransactions = filteredTransactions.slice(

  0,

  visibleTransactionCount

);

    return (

    <div
      className="relative min-h-dvh w-full overflow-x-hidden font-sans text-slate-100"
      style={{
        background: `
          radial-gradient(ellipse at 0% 15%, rgba(0, 150, 110, 0.22), transparent 38%),
          radial-gradient(ellipse at 100% 85%, rgba(0, 150, 110, 0.20), transparent 38%),
          linear-gradient(135deg, #071513 0%, #080d12 50%, #071512 100%)
        `,
        backgroundAttachment: "fixed",
      }}
    >
      {/* ================= BACKGROUND AURORA GLOWS ================= */}
      <div className="pointer-events-none absolute -left-40 -top-40 z-0 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-20 top-1/4 z-0 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 z-0 h-[450px] w-[450px] rounded-full bg-emerald-500/5 blur-[120px]" />



      {/* Typography refinements for the signed-in dashboard */}
      <style>{`
        .tracker-main { font-size: 14px; }
        .tracker-main [class~="text-[9px]"] { font-size: 11px !important; line-height: 1.35 !important; }
        .tracker-main [class~="text-[10px]"] { font-size: 11px !important; line-height: 1.4 !important; }
        .tracker-main [class~="text-xs"] { font-size: 13px !important; line-height: 1.5 !important; }
        .tracker-main [class~="text-sm"] { font-size: 14px !important; line-height: 1.5 !important; }
        .tracker-main [class~="text-base"] { font-size: 16px !important; line-height: 1.5 !important; }
        .tracker-main [class~="text-2xl"] { font-size: clamp(1.5rem, 2vw, 1.8rem) !important; line-height: 1.25 !important; }
        .tracker-main [class~="text-3xl"] { font-size: clamp(1.65rem, 2.2vw, 2rem) !important; line-height: 1.25 !important; }
      `}</style>

      {/* 1. COLLAPSIBLE LEFT SIDEBAR */}
      <aside className={`fixed left-0 top-0 z-30 flex h-dvh w-64 flex-col justify-between overflow-y-auto border-r border-[#1f2937] bg-[#111827]/95 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div>

          {/* User Profile Area */}

          <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-slate-800">

            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-xl font-bold text-[#0b0f19] shadow-lg mb-3">

              CM

            </div>

            <h4 className="font-bold text-white text-sm">Chanty More</h4>

            <p className="text-xs text-slate-500 uppercase mt-0.5 tracking-wider">Project Noah</p>

          </div>



          {/* Navigation Links */}

          <nav className="space-y-1">

            <button

              onClick={() => setCurrentView('dashboard')}

              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${currentView === 'dashboard' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}

            >

              <span><LayoutDashboard size= {18} /></span> Dashboard

            </button>

            <button

              onClick={() => setCurrentView('analytics')}

              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${currentView === 'analytics' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}

            >

              <span><ChartNoAxesCombined size= {18} /></span> Analytics

            </button>

            <button

              onClick={() => setCurrentView('settings')}

              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${currentView === 'settings' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}

            >

              <span><Settings size={18} /></span> Settings

            </button>

          </nav>

        </div>



        {/* Brand Logo & Logout Button */}

        <div className="pt-6 border-t border-slate-800 space-y-4">

          <div className="flex items-center gap-2 px-2">

            <span className="text-teal-400 text-lg">📊</span>

            <span className="font-black tracking-widest text-white text-sm">FINANCIAL TRACKER</span>

          </div>

          <button

            onClick={onLogout}

            className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-2"

          >

            Logout Account

          </button>

        </div>

      </aside>

      {/* Edge tab: click to hide/show the sidebar */}
      <button
        type="button"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        aria-expanded={sidebarOpen}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        className="fixed top-1/2 z-40 flex h-14 w-7 -translate-y-1/2 items-center justify-center rounded-r-xl border border-l-0 border-emerald-400/30 bg-[#111827]/95 text-emerald-300 shadow-lg shadow-emerald-950/30 backdrop-blur-md transition-all duration-300 hover:w-9 hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        style={{ left: sidebarOpen ? '16rem' : '0' }}
      >
        <span className="text-2xl leading-none" aria-hidden="true">{sidebarOpen ? '‹' : '›'}</span>
      </button>

      {/* 2. MAIN WORKSPACE PANEL */}
      <main className={`tracker-main relative z-10 min-h-dvh min-w-0 p-4 transition-[margin] duration-300 ease-in-out md:p-6 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>

        <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute left-0 top-[40%] h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-[450px] w-[450px] rounded-full bg-emerald-400/5 blur-[130px]" />



        <div className="relative z-10 mb-7 text-center">

  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
    Financial Portfolio & Budget Tracker
  </h1>

  <p className="mt-2 text-sm text-slate-400">
    Welcome back to your financial monitoring overview.
  </p>

</div>


        {/* ANALYTICS SUBPANEL */}

        {currentView === 'analytics' && (

          <div className="bg-[#111a20]/90 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/15 shadow-xl">

            <h3 className="text-base font-bold text-white mb-2">Financial Analytics</h3>

            <p className="text-xs text-slate-400 mb-4">Visual breakdown of your earnings vs spending metrics.</p>

            <div className="space-y-4">

              <div>

                <div className="flex justify-between text-xs mb-1"><span>Income Share</span><span className="text-emerald-400 font-bold">{totalIncome > 0 ? Math.round((totalIncome / (totalIncome + totalExpenses)) * 100) : 0}%</span></div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all" style={{ width: `${totalIncome > 0 ? (totalIncome / (totalIncome + totalExpenses)) * 100 : 0}%` }}></div></div>

              </div>

              <div>

                <div className="flex justify-between text-xs mb-1"><span>Expense Share</span><span className="text-rose-400 font-bold">{totalExpenses > 0 ? Math.round((totalExpenses / (totalIncome + totalExpenses)) * 100) : 0}%</span></div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden"><div className="bg-rose-500 h-full transition-all" style={{ width: `${totalExpenses > 0 ? (totalExpenses / (totalIncome + totalExpenses)) * 100 : 0}%` }}></div></div>

              </div>

            </div>

          </div>

        )}



                {/* SETTINGS SUBPANEL */}

        {currentView === 'settings' && (

          <div className="bg-[#111a20]/90 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/15 shadow-xl">

            <h3 className="text-base font-bold text-white mb-2">Account Settings</h3>

            <p className="text-xs text-slate-400 mb-4">Manage your profile preferences and system thresholds.</p>

            <div className="text-xs text-slate-300 space-y-2">

              <p><strong>Profile Name:</strong>Chanty More</p>

              <p><strong>System Scope:</strong> Financial Portfolio & Budget Tracker V1.0</p>

              {/* This will clear storage AND empty the active state without logging you out */}

              <button

                onClick={() => {

                  localStorage.removeItem('project_noah_transactions');

                  setTransactions([]);

                  alert("Application database has been successfully wiped clean!");

                }}

                className="mt-4 bg-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-rose-500 hover:text-white transition cursor-pointer"

              >

                Reset App Data

              </button>

            </div>

          </div>

        )}





        {/* MAIN DASHBOARD FRAME METRICS */}

        {currentView === 'dashboard' && (

          <div className="space-y-8">

            {/* Top Summary Balance Cards */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-[#111a20]/90 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/15 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-500/10">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Balance</p>

                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">

                  <Wallet size={20} />

                  </div>

                </div>

                <h3 className="text-3xl font-extrabold tracking-tight text-white mt-2">₱{totalBalance.toLocaleString()}</h3>

              </div>

              <div className="bg-[#111a20]/90 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/15 shadow-xl border-l-4 border-l-emerald-500 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-emerald-500/10">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Income</p>

                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">

                   <TrendingUp size={20} />

                  </div>

                </div>



                <h3 className="text-3xl font-extrabold tracking-tight text-emerald-400 mt-2">₱{totalIncome.toLocaleString()}</h3>

              </div>

              <div className="bg-[#111a20]/90 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/15 shadow-xl border-l-4 border-l-rose-500 transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/60 hover:shadow-rose-500/10 hover:shadow-lg">

                <div className="flex items-center justify-between">

                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Expenses</p>

                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">

                  <TrendingDown size={20} />

                  </div>

                </div>

                <h3 className="text-3xl font-extrabold tracking-tight text-rose-400 mt-2">₱{totalExpenses.toLocaleString()}</h3>

              </div>

            </div>



            {/* Layout Workspaces: Form Input Module & Transactions Ledger Table Grid */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">



{/* INPUT FORM MODULE — PREMIUM DARK DESIGN */}

<div className="relative overflow-hidden bg-[#111a20]/90 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/15 shadow-xl lg:col-span-1 h-fit">



  {/* SUBTLE TOP ACCENT */}

  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />



  {/* FORM HEADER */}

  <div className="flex items-start gap-3 mb-6">

    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">

      <Plus size={22} className="text-teal-400" />

    </div>



    <div>

      <h3 className="text-base font-bold text-white">

        Add New Transaction

      </h3>

      <p className="text-xs text-slate-500 mt-1">

        Record your income and expenses

      </p>

    </div>

  </div>



  <form

    className="space-y-5"

    onSubmit={(e) => {

      setTransactionSuccess('');



      const isValid =

        description.trim() !== '' &&

        amount !== '' &&

        Number(amount) > 0;



      handleSaveTransaction(e);



      if (isValid) {

        setTransactionSuccess('Transaction saved successfully!');

      }

    }}

  >



    {/* DESCRIPTION */}

    <div>

      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">

        Description

      </label>



      <div className="relative">

        <FileText

          size={17}

          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"

        />



        <input

          type="text"

          value={description}

          onChange={(e) => {

            setDescription(e.target.value);

            setTransactionSuccess('');

          }}

          placeholder="e.g. Monthly salary"

          className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/10 transition"

          required

        />

      </div>

    </div>



    {/* AMOUNT */}

    <div>

      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">

        Amount

      </label>



      <div className="relative">

        <CircleDollarSign

          size={18}

          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"

        />



        <input

          type="number"

          value={amount}

          onChange={(e) => {

            setAmount(e.target.value);

            setTransactionSuccess('');

          }}

          placeholder="0.00"

          min="0.01"

          step="0.01"

          className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/10 transition"

          required

        />

      </div>



      {/* LIVE AMOUNT PREVIEW */}

      <div className="flex items-center justify-between mt-2 px-1">

        <span className="text-[10px] text-slate-500">

          Amount preview

        </span>



        <span className={`text-xs font-bold ${

          transactionType === 'income'

            ? 'text-emerald-400'

            : 'text-rose-400'

        }`}>

          {transactionType === 'income' ? '+' : '-'}₱

          {Number(amount) > 0

            ? Number(amount).toLocaleString('en-PH', {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2

              })

            : '0.00'}

        </span>

      </div>

    </div>



    {/* TRANSACTION TYPE */}

    <div>

      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">

        Transaction Type

      </label>



      <div className="relative">

        <ArrowLeftRight

          size={17}

          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"

        />



        <select

          value={transactionType}

          onChange={(e) => {

            const nextType = e.target.value;

            setTransactionType(nextType);

            setCategory(nextType === 'income' ? 'Salary' : 'Food');

            setTransactionSuccess('');

          }}

          className="w-full appearance-none bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-white outline-none focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/10 transition cursor-pointer"

        >

          <option value="expense">Expense</option>

          <option value="income">Income</option>

        </select>



        <ChevronDown

          size={16}

          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"

        />

      </div>



      <p className="text-[10px] text-slate-500 mt-2">

        {transactionType === 'income'

          ? 'Money received or earned'

          : 'Money spent or paid'}

      </p>

    </div>



    {/* DYNAMIC CATEGORY */}

    <div>

      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">

        Category

      </label>



      <div className="relative">

        <Tags

          size={17}

          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"

        />



        <select

          value={category}

          onChange={(e) => {

            setCategory(e.target.value);

            setTransactionSuccess('');

          }}

          className="w-full appearance-none bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-white outline-none focus:border-teal-500/70 focus:ring-2 focus:ring-teal-500/10 transition cursor-pointer"

        >

          {transactionType === 'expense' ? (

            <>

              <option value="Food">Food &amp; Dining</option>

              <option value="Transportation">Transportation</option>

              <option value="Software">Software &amp; Subscriptions</option>

              <option value="Shopping">Shopping</option>

              <option value="Bills">Bills &amp; Utilities</option>

              <option value="Education">Education</option>

              <option value="Health">Health &amp; Medical</option>

              <option value="Entertainment">Entertainment</option>

              <option value="Housing">Housing &amp; Rent</option>

              <option value="Personal">Personal Care</option>

              <option value="Other">Other Expenses</option>

            </>

          ) : (

            <>

              <option value="Salary">Salary Earnings</option>

              <option value="Freelance">Freelance Work</option>

              <option value="Business">Business Income</option>

              <option value="Allowance">Allowance</option>

              <option value="Investment">Investment Returns</option>

              <option value="Gift">Gifts Received</option>

              <option value="Other Income">Other Income</option>

            </>

          )}

        </select>



        <ChevronDown

          size={16}

          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"

        />

      </div>

    </div>



    {/* SUCCESS FEEDBACK */}

    {transactionSuccess && (

      <div

        role="status"

        className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-xs font-medium text-emerald-400"

      >

        <CheckCircle2 size={17} className="shrink-0" />

        {transactionSuccess}

      </div>

    )}



    {/* ACTION BUTTONS */}

    <div className="space-y-2 pt-1">

      <button

        type="submit"

        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#07110f] font-bold py-3 rounded-xl text-xs transition duration-200 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"

      >

        <Plus size={16} strokeWidth={2.5} />

        Add Transaction

      </button>



      <button

        type="button"

        onClick={() => {

          setDescription('');

          setAmount('');

          setCategory(transactionType === 'income' ? 'Salary' : 'Food');

          setTransactionSuccess('');

        }}

        className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-white font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"

      >

        <RotateCcw size={14} />

        Reset Form

      </button>

    </div>



  </form>

</div>





              {/* RECENT TRANSACTION LEDGER TABLE WITH DYNAMIC COUNTER */}

              <div className="bg-[#111a20]/90 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/15 shadow-xl lg:col-span-2">



  {/* HEADER */}

  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">

    <div>

      <h3 className="text-base font-bold text-white">Recent Transactions</h3>

      <p className="text-xs text-slate-500 mt-1">

        Manage and review your transaction history

      </p>

    </div>



    <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 self-start">

      Matches: <span className="text-teal-400 font-bold">{filteredTransactions.length}</span>

    </span>

  </div>



  {/* SEARCH BAR */}

  <div className="relative mb-4">

    <Search

      size={17}

      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"

    />

    <input

      type="text"

      value={transactionSearch}

      onChange={(e) => {

        setTransactionSearch(e.target.value);

        setVisibleTransactionCount(5);

      }}

      placeholder="Search description or category..."

      className="w-full bg-[#0f1420] border border-[#2a3245] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/20 transition"

    />

  </div>



  {/* FILTER TABS */}

  <div className="flex flex-wrap items-center gap-2 mb-5">

    {[

      { label: 'All', value: 'all' },

      { label: 'Income', value: 'income' },

      { label: 'Expenses', value: 'expenses' },

    ].map((filter) => (

      <button

        key={filter.value}

        type="button"

        onClick={() => {

          setTransactionFilter(filter.value);

          setVisibleTransactionCount(5);

        }}

        className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${

          transactionFilter === filter.value

            ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'

            : 'bg-slate-800/50 text-slate-400 border-slate-700/70 hover:text-white hover:bg-slate-800'

        }`}

      >

        {filter.label}

      </button>

    ))}

  </div>



  {/* TRANSACTION TABLE */}

  {filteredTransactions.length > 0 ? (

    <>

      <div className="overflow-x-auto">

        <table className="w-full text-left text-xs border-collapse">

          <thead>

            <tr className="border-b border-slate-800 text-slate-500 uppercase font-semibold">

              <th className="pb-3 pr-4">Description</th>

              <th className="pb-3 pr-4">Category / Type</th>

              <th className="pb-3 text-right">Amount</th>

            </tr>

          </thead>



          <tbody className="divide-y divide-slate-800/40 text-slate-300">

            {visibleTransactions.map((t) => {

              const cat = String(t.category || '').toLowerCase();

              const isIncome = t.type === 'income';



              let CategoryIcon = Wallet;

              let iconColor = 'text-teal-400';

              let iconBg = 'bg-teal-500/10';



              if (

                cat.includes('food') ||

                cat.includes('restaurant') ||

                cat.includes('grocery')

              ) {

                CategoryIcon = Utensils;

                iconColor = 'text-orange-400';

                iconBg = 'bg-orange-500/10';

              } else if (

                cat.includes('shop') ||

                cat.includes('cloth')

              ) {

                CategoryIcon = ShoppingBag;

                iconColor = 'text-purple-400';

                iconBg = 'bg-purple-500/10';

              } else if (

                cat.includes('transport') ||

                cat.includes('travel') ||

                cat.includes('fuel') ||

                cat.includes('gas') ||

                cat.includes('car')

              ) {

                CategoryIcon = CarFront;

                iconColor = 'text-sky-400';

                iconBg = 'bg-sky-500/10';

              } else if (

                cat.includes('salary') ||

                cat.includes('job') ||

                cat.includes('work')

              ) {

                CategoryIcon = BriefcaseBusiness;

                iconColor = 'text-emerald-400';

                iconBg = 'bg-emerald-500/10';

              } else if (

                cat.includes('bill') ||

                cat.includes('utilit') ||

                cat.includes('software')

              ) {

                CategoryIcon = Receipt;

                iconColor = 'text-amber-400';

                iconBg = 'bg-amber-500/10';

              } else if (

                cat.includes('health') ||

                cat.includes('medical')

              ) {

                CategoryIcon = HeartPulse;

                iconColor = 'text-rose-400';

                iconBg = 'bg-rose-500/10';

              } else if (

                cat.includes('education') ||

                cat.includes('school') ||

                cat.includes('book')

              ) {

                CategoryIcon = BookOpen;

                iconColor = 'text-indigo-400';

                iconBg = 'bg-indigo-500/10';

              } else if (

                cat.includes('entertainment') ||

                cat.includes('game')

              ) {

                CategoryIcon = Gamepad2;

                iconColor = 'text-fuchsia-400';

                iconBg = 'bg-fuchsia-500/10';

              } else if (

                cat.includes('home') ||

                cat.includes('house') ||

                cat.includes('rent')

              ) {

                CategoryIcon = House;

                iconColor = 'text-cyan-400';

                iconBg = 'bg-cyan-500/10';

              }



              return (

                <tr

                  key={t.id}

                  className="group hover:bg-slate-800/30 transition-colors duration-200"

                >

                  {/* DESCRIPTION */}

                  <td className="py-4 pr-4">

                    <div className="flex items-center gap-3 min-w-[150px]">

                      <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>

                        <CategoryIcon size={17} strokeWidth={1.8} />

                      </div>



                      <div className="min-w-0">

                        <p className="font-semibold text-white truncate max-w-[180px]">

                          {t.description || 'Untitled transaction'}

                        </p>

                        <p className="text-[10px] text-slate-500 mt-1">

                          {isIncome ? 'Money received' : 'Money spent'}

                        </p>

                      </div>

                    </div>

                  </td>



                  {/* CATEGORY AND TYPE */}

                  <td className="py-4 pr-4">

                    <div className="flex flex-col items-start gap-1.5">

                      <span className="text-slate-300 font-medium">

                        {t.category || 'Other'}

                      </span>



                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${

                        isIncome

                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'

                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'

                      }`}>

                        {isIncome ? 'Income' : 'Expense'}

                      </span>

                    </div>

                  </td>



                  {/* AMOUNT AND DELETE */}

                  <td className="py-4 text-right">

                    <div className="flex items-center justify-end gap-3">

                      <span className={`font-bold whitespace-nowrap ${

                        isIncome ? 'text-emerald-400' : 'text-rose-400'

                      }`}>

                        {isIncome ? '+' : '-'}₱{Number(t.amount || 0).toLocaleString()}

                      </span>



                      <button

                        type="button"

                        onClick={() => handleDeleteTransaction(t.id)}

                        title="Delete transaction"

                        aria-label={`Delete ${t.description || 'transaction'}`}

                        className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"

                      >

                        <Trash2 size={15} />

                      </button>

                    </div>

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>



      {/* LOAD MORE */}

      {visibleTransactions.length < filteredTransactions.length && (

        <div className="border-t border-slate-800/70 mt-3 pt-4 text-center">

          <button

            type="button"

            onClick={() =>

              setVisibleTransactionCount((count) => count + 5)

            }

            className="px-5 py-2.5 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 hover:text-teal-400 hover:border-teal-500/30 transition text-xs font-semibold"

          >

            Load More

            <span className="ml-2 text-slate-500">

              (+{filteredTransactions.length - visibleTransactions.length})

            </span>

          </button>

        </div>

      )}

    </>

  ) : (

    /* EMPTY STATE */

    <div className="py-12 px-4 flex flex-col items-center text-center border border-dashed border-slate-700/70 rounded-xl bg-[#0f1420]/50">

      <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">

        <Search size={21} className="text-slate-500" />

      </div>



      <h4 className="text-sm font-semibold text-white mb-1">

        {transactions.length === 0

          ? 'No transactions yet'

          : 'No matching transactions'}

      </h4>



      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">

        {transactions.length === 0

          ? 'Your transactions will appear here after you add your first record.'

          : 'Try a different search term or select another filter.'}

      </p>



      {(transactionSearch || transactionFilter !== 'all') && (

        <button

          type="button"

          onClick={() => {

            setTransactionSearch('');

            setTransactionFilter('all');

            setVisibleTransactionCount(5);

          }}

          className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/15 transition"

        >

          Clear Search & Filters

        </button>

      )}

    </div>)}</div>









            </div>

          </div>

        )}



      </main>

    </div>

  );

}



export default Dashboard;
