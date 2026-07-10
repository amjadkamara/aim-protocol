import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  ShieldCheck, Coins, Loader2, AlertCircle,
  Clock, AlertTriangle, CheckCircle2, MapPin,
  Sprout, Calendar, Hash, History, Building2, Store
} from 'lucide-react'
import { useAimProgram, getFarmerPDA } from './useAimProgram'

function getLoanStatus(loan) {
  if (!loan) return null
  if (loan.isRepaid) return 'repaid'
  const createdAt = loan.createdAt.toNumber() * 1000
  const durationMs = loan.repaymentWeeks * 7 * 24 * 60 * 60 * 1000
  const deadline = createdAt + durationMs
  if (Date.now() > deadline) return 'overdue'
  return 'active'
}

function getDaysInfo(loan) {
  if (!loan) return null
  const createdAt = loan.createdAt.toNumber() * 1000
  const durationMs = loan.repaymentWeeks * 7 * 24 * 60 * 60 * 1000
  const deadline = createdAt + durationMs
  const diffMs = deadline - Date.now()
  const diffDays = Math.abs(Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  return { diffDays, overdue: Date.now() > deadline, deadline }
}

function StatusBadge({ color, children }) {
  const colors = {
    green: 'border-green-400/30 text-green-400',
    amber: 'border-amber-400/30 text-amber-400',
    red: 'border-red-400/30 text-red-400',
    neutral: 'border-white/15 text-white/40',
  }
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${colors[color]}`}>
      {children}
    </span>
  )
}

export default function Dashboard({ onBack, onRequestLoan, onRepayLoan, onViewHistory, onMarketplace }) {
  const { publicKey } = useWallet()
  const { fetchFarmer, fetchLoan, fetchLender, closeLoan } = useAimProgram()

  const [farmer, setFarmer] = useState(null)
  const [lender, setLender] = useState(null)
  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!publicKey) return
    setLoading(true)
    Promise.all([fetchLender(), fetchFarmer(), fetchLoan()]).then(([lenderData, farmerData, loanData]) => {
      // lender takes priority if somehow both exist (shouldn't happen given
      // on-chain mutual exclusivity, but resolve deterministically)
      if (lenderData) {
        setLender(lenderData)
        setFarmer(null)
        setLoan(null)
      } else {
        setLender(null)
        setFarmer(farmerData)
        setLoan(loanData)
      }
      setLoading(false)
    })
  }, [publicKey])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 gap-4">
        <Loader2 size={32} className="animate-spin text-white/40" />
        <p className="text-white/40">Loading your dashboard...</p>
      </div>
    )
  }

  if (lender) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">

          <button onClick={onBack} className="text-white/40 hover:text-white text-sm mb-8 transition">
            ← Back
          </button>

          <h2 className="text-2xl font-bold mb-1">My dashboard</h2>
          <p className="text-white/40 text-sm mb-8">Your lender profile on AIM Protocol.</p>

          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-white/50" />
              <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Lender profile</span>
            </div>

            <h3 className="text-2xl font-bold mb-4">{lender.name}</h3>

            <div className="mb-4">
              {lender.isActive ? (
                <StatusBadge color="green">Active</StatusBadge>
              ) : (
                <StatusBadge color="amber">Pending approval</StatusBadge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-white/40 text-xs mb-1">Max loan</p>
                <p className="font-semibold">
                  {(lender.maxLoanLamports.toNumber() / 1_000_000_000).toFixed(2)} SOL
                </p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Interest rate</p>
                <p className="font-semibold">{(lender.interestRateBps / 100).toFixed(1)}% APR</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Max duration</p>
                <p className="font-semibold">{lender.maxDurationWeeks} weeks</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Capital budget</p>
                <p className="font-semibold">
                  {(lender.capitalBudgetLamports.toNumber() / 1_000_000_000).toFixed(2)} SOL
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                <MapPin size={11} /> Location
              </p>
              <p className="font-semibold">{lender.city}, {lender.country}</p>
            </div>
          </div>

          {!lender.isActive && (
            <div className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white/50 text-xs mb-6">
              Your registration is awaiting admin approval. Once approved, your profile will
              appear on the loan marketplace and you can begin deploying capital to farmers.
            </div>
          )}

          <button
            onClick={onMarketplace}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Store size={18} /> View loan marketplace →
          </button>
        </div>
      </div>
    )
  }

  if (!farmer) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center gap-6">
        <AlertCircle size={64} className="text-white/20" />
        <h2 className="text-2xl font-bold">No Farmer ID found</h2>
        <p className="text-white/50 max-w-sm">
          You need to create a Farmer ID before accessing your dashboard.
        </p>
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white text-sm transition"
        >
          ← Back to home
        </button>
      </div>
    )
  }

  const loanStatus = getLoanStatus(loan)
  const daysInfo = loan ? getDaysInfo(loan) : null
  const solAmount = loan ? (loan.amount.toNumber() / 1_000_000_000).toFixed(3) : null
  const memberSince = new Date(farmer.createdAt.toNumber() * 1000).toLocaleDateString()
  const farmerPDA = getFarmerPDA(publicKey).toString()

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        <button onClick={onBack} className="text-white/40 hover:text-white text-sm mb-8 transition">
          ← Back
        </button>

        <h2 className="text-2xl font-bold mb-1">My dashboard</h2>
        <p className="text-white/40 text-sm mb-8">Your on-chain farming identity and loan status.</p>

        {/* ── Farmer Profile Card ── */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-white/50" />
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Farmer profile</span>
          </div>

          <h3 className="text-2xl font-bold mb-4">{farmer.fullName}</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                <Sprout size={11} /> Crop type
              </p>
              <p className="font-semibold">{farmer.cropType}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                <MapPin size={11} /> District
              </p>
              <p className="font-semibold">{farmer.district}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">Farm size</p>
              <p className="font-semibold">{farmer.farmSize} acres</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                <Calendar size={11} /> Member since
              </p>
              <p className="font-semibold">{memberSince}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
              <Hash size={11} /> Farmer ID (PDA)
            </p>
            <p className="font-mono text-xs text-white/40 break-all">{farmerPDA}</p>
          </div>
        </div>

        {/* ── Loan Status Card ── */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Coins size={18} className="text-white/50" />
            <span className="text-white/50 text-xs font-semibold uppercase tracking-widest">Loan status</span>
          </div>

          {!loan && (
            <div className="flex flex-col items-center text-center py-4 gap-3">
              <p className="text-white/50 text-sm">No active loan. Your account is ready to borrow.</p>
              <StatusBadge color="neutral">No loan</StatusBadge>
            </div>
          )}

          {loan && (
            <>
              {loanStatus === 'active' && (
                <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-3 mb-4">
                  <Clock size={15} />
                  {daysInfo.diffDays} day{daysInfo.diffDays !== 1 ? 's' : ''} remaining until repayment deadline.
                </div>
              )}
              {loanStatus === 'overdue' && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-4">
                  <AlertTriangle size={15} />
                  {daysInfo.diffDays} day{daysInfo.diffDays !== 1 ? 's' : ''} overdue. Please repay as soon as possible.
                </div>
              )}
              {loanStatus === 'repaid' && (
                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3 mb-4">
                  <CheckCircle2 size={15} />
                  Loan repaid. You are eligible for a new loan.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-xs mb-1">Amount</p>
                  <p className="font-semibold text-xl">{solAmount} SOL</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Status</p>
                  {loanStatus === 'active' && <StatusBadge color="amber">Active</StatusBadge>}
                  {loanStatus === 'overdue' && <StatusBadge color="red">Overdue</StatusBadge>}
                  {loanStatus === 'repaid' && <StatusBadge color="green">Repaid</StatusBadge>}
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Purpose</p>
                  <p className="font-semibold text-sm">{loan.purpose}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Repayment period</p>
                  <p className="font-semibold">{loan.repaymentWeeks} weeks</p>
                </div>
                {daysInfo && (
                  <div>
                    <p className="text-white/40 text-xs mb-1">Deadline</p>
                    <p className="font-semibold text-sm">
                      {new Date(daysInfo.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3">
          {loan && loanStatus === 'repaid' && (
            <button
              onClick={async () => {
                try {
                  await closeLoan()
                  setLoan(null)
                } catch(e) {
                  console.log(e.message)
                }
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white/60 text-sm font-semibold py-2 rounded-lg transition"
            >
              Clear repaid loan account to re-borrow →
            </button>
          )}
          {(!loan || loanStatus === 'repaid') && (
            <button
              onClick={onRequestLoan}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Coins size={18} /> Request a loan →
            </button>
          )}
          {loan && loanStatus !== 'repaid' && (
            <button
              onClick={onRepayLoan}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 size={18} /> Repay loan in full →
            </button>
          )}
          <button
            onClick={onViewHistory}
            className="w-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <History size={18} /> View loan history →
          </button>
        </div>

      </div>
    </div>
  )
}
