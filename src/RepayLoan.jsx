import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Coins, Loader2, CheckCircle2, AlertCircle, Clock, AlertTriangle } from 'lucide-react'
import { useAimProgram } from './useAimProgram'

function getLoanStatus(loan) {
  if (!loan) return null
  if (loan.isRepaid) return 'repaid'
  const createdAt = loan.createdAt.toNumber() * 1000
  const durationMs = loan.repaymentWeeks * 7 * 24 * 60 * 60 * 1000
  const deadline = createdAt + durationMs
  const now = Date.now()
  if (now > deadline) return 'overdue'
  return 'active'
}

function getDaysInfo(loan) {
  if (!loan) return null
  const createdAt = loan.createdAt.toNumber() * 1000
  const durationMs = loan.repaymentWeeks * 7 * 24 * 60 * 60 * 1000
  const deadline = createdAt + durationMs
  const now = Date.now()
  const diffMs = deadline - now
  const diffDays = Math.abs(Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  return { diffDays, overdue: now > deadline, deadline }
}

export default function RepayLoan({ onBack, onRepaid }) {
  const { publicKey } = useWallet()
  const { fetchLoan, fetchFarmer, repayLoan } = useAimProgram()

  const [loan, setLoan] = useState(null)
  const [farmer, setFarmer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('idle') // idle | repaying | success | error
  const [txSignature, setTxSignature] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!publicKey) return
    setLoading(true)
    Promise.all([fetchLoan(), fetchFarmer()]).then(([loanData, farmerData]) => {
      setLoan(loanData)
      setFarmer(farmerData)
      setLoading(false)
    })
  }, [publicKey])

  const handleRepay = async () => {
    if (!publicKey) return
    setStatus('repaying')
    setError('')
    try {
      const result = await repayLoan()
      setTxSignature(result.signature)
      setStatus('success')
      if (onRepaid) onRepaid()
    } catch (err) {
      setError(err.message || 'Transaction failed. Please try again.')
      setStatus('error')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 gap-4">
        <Loader2 size={32} className="animate-spin text-white/40" />
        <p className="text-white/40">Loading loan details...</p>
      </div>
    )
  }

  // No loan found
  if (!loan) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center gap-6">
        <AlertCircle size={64} className="text-white/20" />
        <h2 className="text-2xl font-bold">No Active Loan</h2>
        <p className="text-white/50 max-w-sm">
          You don't have any loan on record. Request a microloan first.
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
  const daysInfo = getDaysInfo(loan)
  const solAmount = (loan.amount.toNumber() / 1_000_000_000).toFixed(3)

  // Success screen
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center gap-6">
        <CheckCircle2 size={64} className="text-green-400" />
        <h2 className="text-3xl font-bold">Loan Fully Repaid!</h2>
        <p className="text-white/60 max-w-md">
          Your loan has been marked as repaid on-chain. Your account is clear — you may now apply for a new loan.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-md w-full text-left">
          <p className="text-white/40 text-xs mb-1">AMOUNT REPAID</p>
          <p className="font-semibold text-green-400 text-xl mb-3">{solAmount} SOL</p>
          <p className="text-white/40 text-xs mb-1">PURPOSE</p>
          <p className="font-semibold mb-3">{loan.purpose}</p>
          <div className="mt-2 pt-3 border-t border-white/10">
            <p className="text-white/40 text-xs mb-1">STATUS</p>
            <span className="bg-green-400/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-400/30">
              ✓ REPAID ON-CHAIN
            </span>
          </div>
        </div>
        
          < a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-lg transition"
        >
          View Transaction ↗
        </a>
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white text-sm transition"
        >
          ← Back to home
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="text-white/40 hover:text-white text-sm mb-8 transition">
          ← Back
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Coins className="text-yellow-400" size={32} />
          <h2 className="text-2xl font-bold">Loan Repayment</h2>
        </div>
        <p className="text-white/50 text-sm mb-8">
          Review your active loan and repay in full to restore your borrowing eligibility.
        </p>

        {/* Status banner */}
        {loanStatus === 'overdue' && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-6">
            <AlertTriangle size={16} />
            This loan is {daysInfo.diffDays} day{daysInfo.diffDays !== 1 ? 's' : ''} overdue. Please repay as soon as possible.
          </div>
        )}

        {loanStatus === 'active' && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-4 py-3 mb-6">
            <Clock size={16} />
            {daysInfo.diffDays} day{daysInfo.diffDays !== 1 ? 's' : ''} remaining until repayment deadline.
          </div>
        )}

        {loanStatus === 'repaid' && (
          <div className="flex items-center gap-2 text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3 mb-6">
            <CheckCircle2 size={16} />
            This loan has already been repaid. You are eligible for a new loan.
          </div>
        )}

        {/* Loan details card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
          {farmer && (
            <>
              <p className="text-white/40 text-xs mb-1">FARMER</p>
              <p className="font-semibold mb-4">{farmer.fullName}</p>
            </>
          )}

          <p className="text-white/40 text-xs mb-1">LOAN AMOUNT</p>
          <p className="font-semibold text-yellow-400 text-2xl mb-4">{solAmount} SOL</p>

          <p className="text-white/40 text-xs mb-1">PURPOSE</p>
          <p className="font-semibold mb-4">{loan.purpose}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs mb-1">REPAYMENT PERIOD</p>
              <p className="font-semibold">{loan.repaymentWeeks} weeks</p>
            </div>
            <div>
              <p className="text-white/40 text-xs mb-1">DEADLINE</p>
              <p className="font-semibold text-sm">
                {new Date(daysInfo.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs mb-2">STATUS</p>
            {loanStatus === 'active' && (
              <span className="bg-yellow-400/20 text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-400/30">
                ● ACTIVE
              </span>
            )}
            {loanStatus === 'overdue' && (
              <span className="bg-red-400/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full border border-red-400/30">
                ⚠ OVERDUE
              </span>
            )}
            {loanStatus === 'repaid' && (
              <span className="bg-green-400/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-400/30">
                ✓ REPAID
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loanStatus !== 'repaid' && (
          <button
            onClick={handleRepay}
            disabled={status === 'repaying'}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            {status === 'repaying' ? (
              <><Loader2 size={18} className="animate-spin" /> Processing Repayment...</>
            ) : (
              'Repay Loan in Full →'
            )}
          </button>
        )}
      </div>
    </div>
  )
}