// src/LenderDashboard.jsx
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAimProgram, getLenderPDA } from './useAimProgram'
import {
  ArrowLeft, RefreshCw, Users, TrendingUp, AlertTriangle,
  CheckCircle2, Loader2, ShieldAlert, Search, ExternalLink,
  ChevronUp, ChevronDown, Wallet, Clock
} from 'lucide-react'

const EXPLORER = (address) =>
  `https://explorer.solana.com/address/${address}?cluster=devnet`

function shortKey(pubkey) {
  const s = pubkey?.toString() || ''
  return s.length > 10 ? `${s.slice(0, 4)}...${s.slice(-4)}` : s
}

function lamportsToSol(lamports) {
  return (Number(lamports) / 1e9).toFixed(3)
}

// Same time-based calculation used in Dashboard.jsx / AdminDashboard.jsx —
// LoanAccount stores isRepaid (bool) + createdAt + repaymentWeeks, not a
// status enum.
function getLoanStatus(loan) {
  if (!loan) return null
  if (loan.isRepaid) return 'repaid'
  const createdAt = loan.createdAt.toNumber() * 1000
  const durationMs = loan.repaymentWeeks * 7 * 24 * 60 * 60 * 1000
  const deadline = createdAt + durationMs
  if (Date.now() > deadline) return 'overdue'
  return 'active'
}

function StatusBadge({ loan }) {
  const key = getLoanStatus(loan)
  if (!key) return null
  const map = {
    active:  { label: 'Active',  cls: 'border-amber-400/30 text-amber-400' },
    overdue: { label: 'Overdue', cls: 'border-red-400/30 text-red-400' },
    repaid:  { label: 'Repaid',  cls: 'border-green-400/30 text-green-400' },
  }
  const s = map[key] || { label: key, cls: 'border-white/15 text-white/40' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${s.cls}`}>
      {s.label}
    </span>
  )
}

function StatCard({ icon, label, value, sub, accent }) {
  const map = {
    neutral: { text: 'text-white/40' },
    green:   { text: 'text-green-400' },
    red:     { text: 'text-red-400' },
    amber:   { text: 'text-amber-400' },
  }
  const c = map[accent] || map.neutral
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`shrink-0 w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function LenderDashboard({ onBack }) {
  const { publicKey } = useWallet()
  const { fetchLender, fetchAllLoans, fetchAllFarmers } = useAimProgram()

  const [lenderAccount, setLenderAccount] = useState(null)
  const [checkingLender, setCheckingLender] = useState(true)

  const [loans,   setLoans]   = useState([])   // [{ loanPDA, loan, farmerPDA, farmerData }]
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const [search,       setSearch]       = useState('')
  const [sortKey,      setSortKey]      = useState('status')
  const [sortDir,      setSortDir]      = useState('asc')
  const [statusFilter, setStatusFilter] = useState('all')

  const lenderPDA = useMemo(
    () => (publicKey ? getLenderPDA(publicKey) : null),
    [publicKey]
  )

  // Confirm this wallet is a registered lender before showing anything else.
  useEffect(() => {
    let cancelled = false
    async function checkLender() {
      if (!publicKey) { setCheckingLender(false); return }
      setCheckingLender(true)
      const acc = await fetchLender()
      if (!cancelled) {
        setLenderAccount(acc)
        setCheckingLender(false)
      }
    }
    checkLender()
    return () => { cancelled = true }
  }, [publicKey, fetchLender])

  const loadPortfolio = useCallback(async () => {
    if (!lenderPDA) return
    setLoading(true)
    setError(null)
    try {
      const [allLoans, allFarmers] = await Promise.all([
        fetchAllLoans(),
        fetchAllFarmers(),
      ])

      const farmersByPDA = {}
      for (const f of allFarmers) farmersByPDA[f.publicKey.toString()] = f.account

      const mine = allLoans
        .filter(l => l.account.lender?.toString() === lenderPDA.toString())
        .map(l => ({
          loanPDA: l.publicKey,
          loan: l.account,
          farmerPDA: l.account.farmer,
          farmerData: farmersByPDA[l.account.farmer?.toString()] || null,
        }))

      setLoans(mine)
    } catch (e) {
      setError('Failed to load your loan portfolio. Make sure your wallet is on devnet.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [lenderPDA, fetchAllLoans, fetchAllFarmers])

  useEffect(() => {
    if (lenderAccount) loadPortfolio()
  }, [lenderAccount, loadPortfolio])

  // ---- Stats ----
  const totalFinanced = loans.length
  const activeLoans   = loans.filter(l => getLoanStatus(l.loan) === 'active').length
  const overdueLoans  = loans.filter(l => getLoanStatus(l.loan) === 'overdue').length
  const repaidLoans   = loans.filter(l => getLoanStatus(l.loan) === 'repaid').length
  const outstandingSol = loans
    .filter(l => getLoanStatus(l.loan) === 'active' || getLoanStatus(l.loan) === 'overdue')
    .reduce((sum, l) => sum + Number(l.loan.amount), 0)

  const filteredLoans = loans
    .filter(l => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        (l.farmerData?.fullName          || '').toLowerCase().includes(q) ||
        (l.farmerData?.owner?.toString() || '').toLowerCase().includes(q) ||
        (l.farmerData?.cropType          || '').toLowerCase().includes(q)
      const status = getLoanStatus(l.loan) || 'none'
      const matchStatus = statusFilter === 'all' || statusFilter === status
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      let va, vb
      if (sortKey === 'name')   { va = a.farmerData?.fullName || '';   vb = b.farmerData?.fullName || ''   }
      if (sortKey === 'amount') { va = Number(a.loan.amount);          vb = Number(b.loan.amount)          }
      if (sortKey === 'status') { va = getLoanStatus(a.loan) || 'zzz'; vb = getLoanStatus(b.loan) || 'zzz' }
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
      ? <ChevronUp size={12} className="text-green-400" />
      : <ChevronDown size={12} className="text-green-400" />
  }

  // ---- Access states ----
  if (!publicKey) {
    return (
      <div className="w-full max-w-2xl px-6 flex flex-col items-center gap-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center">
          <Wallet size={28} className="text-white/40" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Wallet required</h2>
          <p className="text-white/50 text-sm">Connect your lender wallet to view your dashboard.</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition">
          <ArrowLeft size={14} /> Back to home
        </button>
      </div>
    )
  }

  if (checkingLender) {
    return (
      <div className="w-full max-w-2xl px-6 flex flex-col items-center gap-3 py-20 text-white/40">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm">Checking lender registration…</span>
      </div>
    )
  }

  if (!lenderAccount) {
    return (
      <div className="w-full max-w-2xl px-6 flex flex-col items-center gap-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center">
          <ShieldAlert size={28} className="text-white/40" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">No lender account found</h2>
          <p className="text-white/50 text-sm">
            This wallet isn't registered as a lender on AIM Protocol yet.
          </p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition">
          <ArrowLeft size={14} /> Back to home
        </button>
      </div>
    )
  }

  if (!lenderAccount.isActive) {
    return (
      <div className="w-full max-w-2xl px-6 flex flex-col items-center gap-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Clock size={28} className="text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Pending approval</h2>
          <p className="text-white/50 text-sm">
            {lenderAccount.name} is registered but not yet approved by admin.
            You'll be able to view your farmer portfolio here once approved.
          </p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition">
          <ArrowLeft size={14} /> Back to home
        </button>
      </div>
    )
  }

  // ---- Full dashboard ----
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
            <h1 className="text-xl md:text-2xl font-bold">{lenderAccount.name}</h1>
            <p className="text-white/40 text-xs mt-0.5">
              Your farmer portfolio and repayment history — live from Solana devnet
            </p>
          </div>
        </div>
        <button onClick={loadPortfolio}
          disabled={loading}
          className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] px-4 py-2 rounded-xl text-sm transition disabled:opacity-50">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={<Users size={18} />}
          label="Farmers financed" value={loading ? '—' : totalFinanced}
          sub="all-time" accent="neutral" />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Active loans" value={loading ? '—' : activeLoans}
          sub={`${lamportsToSol(outstandingSol)} SOL outstanding`} accent="amber" />
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Overdue" value={loading ? '—' : overdueLoans}
          sub="need attention" accent="red" />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Repaid" value={loading ? '—' : repaidLoans}
          sub={totalFinanced > 0 ? `${Math.round((repaidLoans / totalFinanced) * 100)}% rate` : '—'}
          accent="green" />
        <StatCard
          icon={<Wallet size={18} />}
          label="Capital remaining" value={lamportsToSol(lenderAccount.capitalBudgetLamports)}
          sub="SOL available to lend" accent="neutral" />
      </div>

      {/* Search / filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by farmer name, wallet, or crop…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-400/50 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'overdue', 'repaid'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition border ${
                statusFilter === s
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08]'
              }`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 border-b border-white/[0.06]">
          {[
            { key: 'name',   label: 'Farmer'     },
            { key: null,     label: 'Wallet'     },
            { key: null,     label: 'Crop'       },
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

        {!loading && filteredLoans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/40">
            <Users size={28} className="opacity-40" />
            <span className="text-sm">
              {loans.length === 0 ? "You haven't financed any farmers yet." : 'No results match your filter.'}
            </span>
          </div>
        )}

        {!loading && filteredLoans.map(({ loanPDA, loan, farmerPDA, farmerData }) => (
          <div key={loanPDA.toString()}
            className={`grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_40px] gap-2 md:gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition ${
              getLoanStatus(loan) === 'overdue' ? 'bg-red-500/[0.03]' : ''
            }`}>
            <div className="flex flex-col justify-center">
              <span className="text-sm font-medium text-white">{farmerData?.fullName || '—'}</span>
              <span className="text-xs text-white/40 mt-0.5">
                {farmerData?.district || '—'}{farmerData?.farmSize ? ` · ${farmerData.farmSize} acres` : ''}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-xs font-mono text-white/40">{shortKey(farmerData?.owner)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-white/70">{farmerData?.cropType || '—'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-white/70">{lamportsToSol(loan.amount)} SOL</span>
            </div>
            <div className="flex items-center">
              <StatusBadge loan={loan} />
            </div>
            <div className="flex items-center">
              <a href={EXPLORER(farmerPDA.toString())} target="_blank" rel="noopener noreferrer"
                className="text-white/30 hover:text-green-400 transition">
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {!loading && loans.length > 0 && (
        <p className="text-white/30 text-xs text-center">
          Showing {filteredLoans.length} of {loans.length} farmers financed
        </p>
      )}
    </div>
  )
}