import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Activity, Bell, Bot, BriefcaseBusiness, ChartNoAxesCombined, ChevronLeft, ChevronRight, CircleDollarSign, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Search, Settings, Wallet, X, Moon, Sun } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
const SESSION_KEY = 'fpt_session_v1'
function signOut(){ localStorage.removeItem(SESSION_KEY); window.dispatchEvent(new Event('fpt-session-change')) }
const nav = [
  ['/', 'Dashboard', LayoutDashboard], ['/accounts','My Accounts',Wallet], ['/transactions','Transactions',CreditCard],
  ['/budgets','Budgets',CircleDollarSign], ['/goals','Savings Goals',Goal], ['/investments','Investments',BriefcaseBusiness],
  ['/analytics','Analytics & Reports',ChartNoAxesCombined], ['/assistant','AI Finance Assistant',Bot], ['/notifications','Notifications',Bell],
  ['/settings','Settings',Settings]
]
export default function Layout() {
  const [collapsed,setCollapsed] = useState(false), [mobileOpen,setMobileOpen] = useState(false), [profileOpen,setProfileOpen] = useState(false), [search,setSearch] = useState('')
  const { data, update, refresh, syncStatus, syncError } = useFinance(); const navigate=useNavigate()
  const isDark = data?.settings?.theme === 'dark' || (data?.settings?.theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const toggleTheme = () => update('settings', prev => ({ ...prev, theme: isDark ? 'light' : 'dark' }))
  const unread=data.notifications.filter(n=>!n.read).length
  const sidebar = <aside className={`flex h-full min-h-screen flex-col overflow-y-auto bg-[#092f27] text-white ${collapsed?'w-[82px]':'w-[255px]'} transition-all duration-200`}>
    <div className="flex min-h-[78px] items-center gap-3 border-b border-white/10 px-4 py-3">{<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500"><Activity size={22}/></span>}{!collapsed&&<div className="min-w-0"><p className="font-display text-base font-extrabold leading-tight tracking-tight">FinanceTracker</p><p className="mt-1 text-[10px] uppercase tracking-[.16em] text-emerald-100/55">Budget Tracker</p></div>}</div>
    <div className="px-3 pt-4"><p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-100/40 ${collapsed?'text-center':''}`}>{collapsed?'•••':'Workspace'}</p>{nav.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'} title={collapsed?label:undefined} onClick={()=>setMobileOpen(false)} className={({isActive})=>`nav-item mb-1 ${isActive?'active':''} ${collapsed?'justify-center px-0':''}`}><Icon size={18} className="shrink-0"/>{!collapsed&&<><span className="flex-1">{label}</span>{label==='Notifications'&&unread>0&&<span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px]">{unread}</span>}</>}</NavLink>)}<button onClick={()=>{signOut();setMobileOpen(false);navigate('/login',{replace:true})}} title={collapsed?'Sign out':undefined} className={`nav-item mt-2 border-t border-white/10 pt-4 text-rose-200 hover:bg-rose-500/10 hover:text-white ${collapsed?'justify-center px-0':''}`}><LogOut size={18} className="shrink-0"/>{!collapsed&&<span>Sign out</span>}</button></div>
    <div className="mt-auto p-3"><button onClick={()=>setCollapsed(!collapsed)} className="nav-item justify-center">{collapsed?<ChevronRight size={18}/>:<><ChevronLeft size={18}/><span>Collapse sidebar</span></>}</button></div>
  </aside>
  return <div className="app-shell min-h-screen lg:flex">
    <div className="no-print hidden lg:block">{sidebar}</div>
    {mobileOpen&&<div className="no-print fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={()=>setMobileOpen(false)}></div><div className="relative h-full w-[280px] overflow-y-auto">{sidebar}<button className="absolute right-3 top-5 rounded-lg bg-white/10 p-2" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div></div>}
    <div className="min-w-0 flex-1">
      <header className="app-topbar no-print sticky top-0 z-30 flex h-[78px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="hidden text-sm text-slate-400 sm:block">FinanceTracker <span className="mx-2">/</span><span className="font-semibold text-slate-700">Financial overview</span></div></div>
        <div className="flex items-center gap-2 sm:gap-4"><label className="relative hidden md:block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&navigate('/transactions?search='+encodeURIComponent(search))} className="search-input w-48 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none focus:border-emerald-400" placeholder="Search transactions..."/></label><button type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} title={`Switch to ${isDark ? 'light' : 'dark'} mode`} className="theme-toggle rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">{isDark?<Sun size={19}/>:<Moon size={19}/>}</button><button onClick={()=>navigate('/notifications')} className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"><Bell size={19}/>{unread>0&&<span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>}</button><div className="relative"><button onClick={()=>setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">{data.profile.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><span className="hidden text-left sm:block"><span className="block text-sm font-semibold">{data.profile.name}</span><span className="block text-[11px] text-slate-400">Personal account</span></span></button>{profileOpen&&<div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-100 bg-white p-2 shadow-xl"><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={()=>{navigate('/settings');setProfileOpen(false)}}>Profile & settings</button><button className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50" onClick={()=>{setProfileOpen(false);signOut();navigate('/login',{replace:true})}}><LogOut size={14} className="mr-2 inline"/>Sign out</button></div>}</div></div>      </header>
      <main className="app-main mx-auto max-w-[1600px] p-4 sm:p-7">
        {syncStatus === 'loading' && <p role="status" className="mb-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">Loading your saved financial records...</p>}
        {syncStatus === 'error' && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800"><span>Could not sync financial records: {syncError}</span><button className="btn-secondary" onClick={refresh}>Retry</button></div>}
        <Outlet/>
      </main>
      <footer className="px-7 pb-6 text-center text-xs text-slate-400">FinanceTracker</footer>
    </div>
  </div>
}