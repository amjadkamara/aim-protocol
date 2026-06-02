// src/AdminDashboard.jsx
import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAimProgram, getLoanPDA } from './useAimProgram'
import {
  ArrowLeft, RefreshCw, Users, TrendingUp, AlertTriangle,
  CheckCircle2, Loader2, ShieldAlert, Search, ExternalLink,
  ChevronUp, ChevronDown
} from 'lucide-react'

const ADMIN_WALLETS = [Cz3GvsRaBsuAHoRiJd5sV6ZTAkE8TsFJAyuYWEtV7Qu2]
const EXPLORER = (address) =>
  `https://explorer.solana.com/address/${address}?cluster=devnet`

function shortKey(pubkey) {
  const s = pubkey?.toString() || ''
  return s.length > 10 ? `${s.slice(0, 4)}...${s.slice(-4)}` : s
}

function lamportsToSol(lamports) {
  return (Number(lamports) / 1e9).toFixed(3)
}

function getLoanStatus(loan) {
  if (!loan?.status) return null
  try { return Object.keys(loan.status)[0] || null } catch { return null }
}

function StatusBadge({ status }) {
  const key = getLoanStatus({ status })
  if (!key) return null
  const map = {
    active:  { label: 'ACTIVE',  cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    overdue: { label: 'OVERDUE', cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
    repaid:  { label: 'REPAID',  cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
  }
  const s = map[key] || { label: key.toUpperCase(), cls: 'bg-white/10 text-white/50 border-white/10' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  )
}

function StatCard({ icon, label, value, sub, accent }) {
  const map = {
    violet: { grad: 'from-violet-500/20', border: 'border-violet-500/20', text: 'text-violet-400' },
    green:  { grad: 'from-green-500/20',  border: 'border-green-500/20',  text: 'text-green-400'  },
    red:    { grad: 'from-red-500/20',    border: 'border-red-500/20',    text: 'text-red-400'    },
    blue:   { grad: 'from-blue-500/20',   border: 'border-blue-500/20',   text: 'text-blue-400'   },
  }
  const c = map[accent] || map.violet
  return (
    <div className={`relative bg-white/[0.04] border ${c.border} rounded-2xl p-5 overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${c.grad} to-transparent pointer-events-none`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`shrink-0 w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard({ onBack }) {
  const { publicKey } = useWallet()
  const { program } = useAimProgram()

  const [farmers,      setFarmers]      = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [sortKey,      setSortKey]      = useState('name')
  const [sortDir,      setSortDir]      = useState('asc')
  const [statusFilter, setStatusFilter] = useState('all')

  const isAdmin =
    ADMIN_WALLETS.length === 0 ||
    (publicKey && ADMIN_WALLETS.includes(publicKey.toString()))

  const loadData = useCallback(async () => {
    if (!program) return
    setLoading(true)
    setError(null)
    try {
      const allFarmers = await program.account.farmerAccount.all()
      const enriched = await Promise.all(
        allFarmers.map(async ({ publicKey: farmerPDA, account: farmerData }) => {
          let loan = null
          try {
            const loanPDA = getLoanPDA(farmerData.owner)
            loan = await program.account.loanAccount.fetch(loanPDA)
          } catch { /* no loan yet */ }
          return { farmerPDA, farmerData, loan }
        })
      )
      setFarmers(enriched)
    } catch (e) {
      setError('Failed to load on-chain data. Make sure your wallet is on devnet.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [program])

  useEffect(() => { loadData() }, [loadData])

  const totalFarmers   = farmers.length
  const activeLoans    = farmers.filter(f => getLoanStatus(f.loan) === 'active').length
  const overdueLoans   = farmers.filter(f => getLoanStatus(f.loan) === 'overdue').length
  const repaidLoans    = farmers.filter(f => getLoanStatus(f.loan) === 'repaid').length
  const totalIssuedSol = farmers
    .filter(f => f.loan)
    .reduce((sum, f) => sum + Number(f.loan.amount), 0)

  const filtered = farmers
    .filter(f => {
      const q           = search.toLowerCase()
      const matchSearch = !q ||
        (f.farmerData.fullName          || '').toLowerCase().includes(q) ||
        (f.farmerData.owner?.toString() || '').toLowerCase().includes(q) ||
        (f.farmerData.cropType          || '').toLowerCase().includes(q)
      const loanStatus  = getLoanStatus(f.loan) || 'none'
      const matchStatus =
        statusFilter === 'all' ||
        statusFilter === loanStatus ||
        (statusFilter === 'none' && !f.loan)
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      let va, vb
      if (sortKey === 'name')   { va = a.farmerData.fullName || '';        vb = b.farmerData.fullName || ''        }
      if (sortKey === 'crop')   { va = a.farmerData.cropType || '';        vb = b.farmerData.cropType || ''        }
      if (sortKey === 'amount') { va = a.loan ? Number(a.loan.amount) : 0; vb = b.loan ? Number(b.loan.amount) : 0 }
      if (sortKey === 'status') { va = getLoanStatus(a.loan) || 'zzz';     vb = getLoanStatus(b.loan) || 'zzz'    }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronUp size={12} className="opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-violet-400" />
      : <ChevronDown size={12} className="text-violet-400" />
  }

  if (!publicKey) {
    return (
      <div className="w-full max-w-2xl px-6 flex flex-col items-center gap-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center">
          <ShieldAlert size={28} className="text-white/40" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
          <p className="text-white/50 text-sm">Connect your admin wallet to access the dashboard.</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition">
          <ArrowLeft size={14} /> Back to home
        </button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-2xl px-6 flex flex-col items-center gap-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <ShieldAlert size={28} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-white/50 text-sm">This wallet is not authorised to view the admin dashboard.</p>
          <p className="text-white/30 text-xs mt-2 font-mono">{publicKey.toString()}</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition">
          <ArrowLeft size={14} /> Back to home
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl px-4 md:px-8 flex flex-col gap-8 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between pt-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] flex items-center justify-center transition">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-white/40 text-xs mt-0.5">
              All registered farmers and loans — live from Solana devnet
            </p>
          </div>
        </div>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] px-4 py-2 rounded-xl text-sm transition disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Users size={18} />}
          label="Total Farmers" value={loading ? '—' : totalFarmers}
          sub="registered on-chain" accent="violet" />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Active Loans" value={loading ? '—' : activeLoans}
          sub={`${lamportsToSol(totalIssuedSol)} SOL issued`} accent="blue" />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Overdue" value={loading ? '—' : overdueLoans}
          sub="need attention" accent="red" />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Repaid" value={loading ? '—' : repaidLoans}
          sub={totalFarmers > 0 ? `${Math.round((repaidLoans / totalFarmers) * 100)}% rate` : '—'}
          accent="green" />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, wallet, or crop…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'overdue', 'repaid', 'none'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition border ${
                statusFilter === s
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08]'
              }`}>
              {s === 'none' ? 'No Loan' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Farmer table */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">

        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 border-b border-white/[0.06]">
          {[
            { key: 'name',   label: 'Farmer'     },
            { key: null,     label: 'Wallet'     },
            { key: 'crop',   label: 'Crop'       },
            { key: 'amount', label: 'Loan (SOL)' },
            { key: 'status', label: 'Status'     },
          ].map(({ key, label }) => (
            <button key={label} onClick={() => key && toggleSort(key)}
              className={`flex items-center gap-1 text-left text-white/30 text-xs uppercase tracking-widest ${key ? 'hover:text-white/60 transition' : ''}`}>
              {label}{key && <SortIcon col={key} />}
            </button>
          ))}
          <span className="text-white/30 text-xs uppercase tracking-widest">Link</span>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/40">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm">Loading on-chain data…</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/40">
            <Users size={28} className="opacity-40" />
            <span className="text-sm">
              {farmers.length === 0 ? 'No farmers registered yet.' : 'No results match your filter.'}
            </span>
          </div>
        )}

        {!loading && filtered.map(({ farmerPDA, farmerData, loan }) => (
          <div key={farmerPDA.toString()}
            className={`grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-2 md:gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition ${
              getLoanStatus(loan) === 'overdue' ? 'bg-red-500/[0.03]' : ''
            }`}>

            <div className="flex flex-col justify-center">
              <span className="text-sm font-medium text-white">{farmerData.fullName || '—'}</span>
              <span className="text-xs text-white/40 mt-0.5">
                {farmerData.district || '—'}{farmerData.farmSize ? ` · ${farmerData.farmSize} ha` : ''}
              </span>
            </div>

            <div className="flex items-center">
              <span className="text-xs font-mono text-white/40">{shortKey(farmerData.owner)}</span>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-white/70">{farmerData.cropType || '—'}</span>
            </div>

            <div className="flex items-center">
              <span className="text-sm text-white/70">
                {loan ? `${lamportsToSol(loan.amount)} SOL` : <span className="text-white/20">—</span>}
              </span>
            </div>

            <div className="flex items-center">
              {loan
                ? <StatusBadge status={loan.status} />
                : <span className="text-white/20 text-xs">No loan</span>
              }
            </div>

            <div className="flex items-center">
              <a href={EXPLORER(farmerPDA.toString())} target="_blank" rel="noopener noreferrer"
                className="text-white/30 hover:text-violet-400 transition">
                <ExternalLink size={14} />
              </a>
            </div>

          </div>
        ))}
      </div>

      {!loading && farmers.length > 0 && (
        <p className="text-white/30 text-xs text-center">
          Showing {filtered.length} of {farmers.length} registered farmers
        </p>
      )}

    </div>
  )
}