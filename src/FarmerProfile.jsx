import { useState } from 'react'
import { useAimProgram, getFarmerPDA, getLoanPDA } from './useAimProgram'
import { web3 } from '@coral-xyz/anchor'
import {
  Search, UserCheck, Sprout, MapPin, Ruler,
  CreditCard, CheckCircle, AlertCircle, Clock, ArrowLeft
} from 'lucide-react'

const LAMPORTS = 1_000_000_000

function getLoanStatus(loan) {
  if (!loan?.status) return null
  try {
    const keys = Object.keys(loan.status)
    return keys[0] || null
  } catch {
    return null
  }
}

function StatusBadge({ status }) {
  if (!status) return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/40">
      No Loan
    </span>
  )
  const map = {
    active:  { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30',   label: 'Active',  icon: <Clock size={11} /> },
    overdue: { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30',    label: 'Overdue', icon: <AlertCircle size={11} /> },
    repaid:  { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30',  label: 'Repaid',  icon: <CheckCircle size={11} /> },
  }
  const s = map[status] || map.active
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {s.label}
    </span>
  )
}

export default function FarmerProfile({ onBack }) {
  const { program } = useAimProgram()
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [farmer, setFarmer]     = useState(null)
  const [loan, setLoan]         = useState(null)
  const [lookedUp, setLookedUp] = useState(null) // the pubkey we searched

  const handleLookup = async () => {
    const input = query.trim()
    if (!input) return
    if (!program) {
      setError('Connect your wallet to enable profile lookup.')
      return
    }

    setLoading(true)
    setError(null)
    setFarmer(null)
    setLoan(null)

    let pubkey
    try {
      pubkey = new web3.PublicKey(input)
    } catch {
      setError('Invalid wallet address. Please enter a valid Solana public key.')
      setLoading(false)
      return
    }

    try {
      const farmerPDA = getFarmerPDA(pubkey)
      const farmerData = await program.account.farmerAccount.fetch(farmerPDA)
      setFarmer({ ...farmerData, pda: farmerPDA.toString() })
      setLookedUp(input)

      // Loan is optional — farmer may have none
      try {
        const loanPDA = getLoanPDA(pubkey)
        const loanData = await program.account.loanAccount.fetch(loanPDA)
        setLoan(loanData)
      } catch {
        setLoan(null)
      }
    } catch {
      setError('No farmer profile found for this wallet address.')
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLookup()
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '—'
    try {
      return new Date(timestamp.toNumber() * 1000).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    } catch {
      return '—'
    }
  }

  const formatSOL = (lamports) => {
    if (!lamports) return '0 SOL'
    try {
      return (lamports.toNumber() / LAMPORTS).toFixed(4) + ' SOL'
    } catch {
      return '—'
    }
  }

  const loanStatus = getLoanStatus(loan)

  return (
    <div className="w-full max-w-2xl px-6 md:px-10 flex flex-col gap-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack}
          className="text-white/40 hover:text-white/80 transition flex items-center gap-1.5 text-sm">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Farmer Profile Lookup</h1>
        <p className="text-white/40 text-sm">
          Enter any wallet address to view their on-chain farmer identity and loan status.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter wallet address..."
          className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 font-mono"
        />
        <button
          onClick={handleLookup}
          disabled={loading || !query.trim()}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition text-sm"
        >
          <Search size={15} />
          {loading ? 'Looking up...' : 'Look Up'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Profile card */}
      {farmer && (
        <div className="flex flex-col gap-4">

          {/* Identity card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">

            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{farmer.name || farmer.fullName || '—'}</h2>
                  <p className="text-white/40 text-xs font-mono mt-0.5">
                    {lookedUp.slice(0, 8)}...{lookedUp.slice(-8)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Verified On-Chain</span>
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06]" />

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-white/30 text-[10px] uppercase tracking-widest">Crop</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-400">
                  <Sprout size={13} /> {farmer.cropType || farmer.crop || '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-white/30 text-[10px] uppercase tracking-widest">District</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin size={13} className="text-white/40" />
                  {farmer.district || '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-white/30 text-[10px] uppercase tracking-widest">Farm Size</span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Ruler size={13} className="text-white/40" />
                  {farmer.farmSize ? `${farmer.farmSize} acres` : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-white/30 text-[10px] uppercase tracking-widest">Member Since</span>
                <span className="text-sm font-medium text-white/70">
                  {formatDate(farmer.createdAt)}
                </span>
              </div>
            </div>

            {/* PDA */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <span className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">
                Farmer PDA
              </span>
              
               <a href={`https://explorer.solana.com/address/${farmer.pda}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-violet-400 hover:text-violet-300 transition break-all"
              >
                {farmer.pda}
              </a>
            </div>
          </div>

          {/* Loan card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard size={15} className="text-white/50" />
                Current Loan
              </div>
              <StatusBadge status={loanStatus} />
            </div>

            {loan ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest">Amount</span>
                  <span className="text-sm font-medium text-white/80">{formatSOL(loan.amount)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest">Purpose</span>
                  <span className="text-sm font-medium text-white/80">{loan.purpose || '—'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest">Due Date</span>
                  <span className={`text-sm font-medium ${loanStatus === 'overdue' ? 'text-red-400' : 'text-white/80'}`}>
                    {formatDate(loan.dueDate)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest">Requested</span>
                  <span className="text-sm font-medium text-white/80">{formatDate(loan.requestedAt)}</span>
                </div>
              </div>
            ) : (
              <p className="text-white/30 text-sm">
                No active loan on record. This farmer is eligible to borrow.
              </p>
            )}
          </div>

        </div>
      )}

      {/* Empty state — before any search */}
      {!farmer && !error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-white/[0.06] rounded-2xl bg-white/[0.02]">
          <div className="w-14 h-14 rounded-full bg-white/[0.05] flex items-center justify-center text-white/20">
            <Search size={24} />
          </div>
          <p className="text-white/30 text-sm">Enter a wallet address above to look up a farmer profile.</p>
          <p className="text-white/20 text-xs">All data is read directly from Solana devnet.</p>
        </div>
      )}

    </div>
  )
}