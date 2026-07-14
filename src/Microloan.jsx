import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Coins, Loader2, CheckCircle2, AlertCircle, Building2, TrendingUp, CalendarClock } from 'lucide-react'
import { useAimProgram, parseAnchorError } from './useAimProgram'

const LOAN_PURPOSES = [
  'Seeds & Planting Materials',
  'Fertilizer & Soil Treatment',
  'Irrigation Equipment',
  'Farm Tools & Equipment',
  'Pest & Disease Control',
  'Harvest & Storage',
  'Transport to Market',
]

const REPAYMENT_WEEKS = [2, 4, 8, 12]

// Trims trailing zeros so 1.2500 -> "1.25", 0.0025 -> "0.0025", 5.0000 -> "5"
function formatSol(amount) {
  return parseFloat(amount.toFixed(6)).toString()
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

export default function Microloan({ onBack, onViewLoan }) {
  const { publicKey } = useWallet()
  const { requestLoan, fetchFarmer, fetchLoan, fetchAllLenders } = useAimProgram()

  const [form, setForm] = useState({
    purpose: '',
    amount: '',
    repaymentWeeks: '4',
  })
  const [status, setStatus] = useState('idle')
  const [txSignature, setTxSignature] = useState('')
  const [error, setError] = useState('')
  const [hasFarmerID, setHasFarmerID] = useState(false)
  const [hasActiveLoan, setHasActiveLoan] = useState(false)
  const [checking, setChecking] = useState(true)
  const [lenders, setLenders] = useState([])
  const [selectedLender, setSelectedLender] = useState(null)

  useEffect(() => {
    if (!publicKey) return
    setChecking(true)
    Promise.all([fetchFarmer(), fetchLoan(), fetchAllLenders()]).then(([farmer, loan, allLenders]) => {
      setHasFarmerID(!!farmer)
      setHasActiveLoan(!!loan && !loan.isRepaid)
      setLenders(allLenders.filter(l => l.account.isActive))
      setChecking(false)
    })
  }, [publicKey])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Max loan this lender offers, in SOL — the single source of truth for
  // both the amount input's bounds and the quick-select shortcut buttons.
  const maxLoanSol = selectedLender
    ? selectedLender.account.maxLoanLamports.toNumber() / 1_000_000_000
    : 0

  const selectLender = (lender) => {
    setSelectedLender(lender)
    // Reset amount/duration if they no longer fit this lender's declared limits
    setForm(f => {
      const newMaxLoanSol = lender.account.maxLoanLamports.toNumber() / 1_000_000_000
      const stillValidAmount = f.amount && parseFloat(f.amount) > 0 && parseFloat(f.amount) <= newMaxLoanSol
      const stillValidWeeks = f.repaymentWeeks && parseInt(f.repaymentWeeks) <= lender.account.maxDurationWeeks
      return {
        ...f,
        amount: stillValidAmount ? f.amount : '',
        repaymentWeeks: stillValidWeeks ? f.repaymentWeeks : '4',
      }
    })
  }

  // Dynamic quick-select shortcuts scaled to this lender's actual max —
  // replaces the old hardcoded 0.01/0.05/0.1/0.2/0.5 preset list, which
  // was unreachable for any lender offering more than 0.5 SOL.
  const quickAmounts = selectedLender
    ? [0.25, 0.5, 1].map(fraction => formatSol(maxLoanSol * fraction))
    : []

  const availableWeeks = selectedLender
    ? REPAYMENT_WEEKS.filter(w => w <= selectedLender.account.maxDurationWeeks)
    : []

  const parsedAmount = parseFloat(form.amount)
  const isValidAmount = selectedLender && !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= maxLoanSol
  const isValid = selectedLender && form.purpose && isValidAmount && hasFarmerID && !hasActiveLoan

  const handleSubmit = async () => {
    if (!publicKey || !isValid) return
    setStatus('loading')
    setError('')

    try {
      const lamports = parseFloat(form.amount) * 1_000_000_000

      const result = await requestLoan({
        amount: lamports,
        purpose: form.purpose,
        repaymentWeeks: parseInt(form.repaymentWeeks),
        lenderPubkey: selectedLender.publicKey,
      })

      setTxSignature(result.signature)
      setStatus('success')
    } catch (err) {
      setError(parseAnchorError(err))
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center gap-6">
        <CheckCircle2 size={64} className="text-green-400" />
        <h2 className="text-3xl font-bold">Loan approved</h2>
        <p className="text-white/60 max-w-md">
          Your simulated crop-backed microloan has been disbursed on Solana devnet.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-md w-full text-left">
          <p className="text-white/40 text-xs mb-1">Lender</p>
          <p className="font-semibold mb-3">{selectedLender?.account.name}</p>
          <p className="text-white/40 text-xs mb-1">Loan amount</p>
          <p className="font-semibold text-xl mb-3">{formatSol(parseFloat(form.amount))} SOL</p>
          <p className="text-white/40 text-xs mb-1">Purpose</p>
          <p className="font-semibold mb-3">{form.purpose}</p>
          <p className="text-white/40 text-xs mb-1">Repayment period</p>
          <p className="font-semibold">{form.repaymentWeeks} weeks</p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs mb-1">Status</p>
            <StatusBadge color="green">Disbursed on-chain</StatusBadge>
          </div>
        </div>

        <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          View loan transaction ↗
        </a>
        <button
          onClick={onViewLoan}
          className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          View loan status & repay →
        </button>
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
          <Coins className="text-green-400" size={28} />
          <h2 className="text-2xl font-bold">Request microloan</h2>
        </div>
        <p className="text-white/50 text-sm mb-8">
          Request a simulated crop-backed microloan disbursed directly to your wallet on Solana.
        </p>

        {checking && (
          <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
            <Loader2 size={16} className="animate-spin" />
            Checking account status...
          </div>
        )}

        {!checking && !hasFarmerID && (
          <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-3 mb-4">
            <AlertCircle size={16} />
            You must create a Farmer ID before requesting a loan. Please go back and register first.
          </div>
        )}

        {!checking && hasFarmerID && hasActiveLoan && (
          <div className="flex flex-col gap-2 text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>You already have an active loan. Repay it before requesting a new one.</span>
            </div>
            <button
              onClick={onViewLoan}
              className="text-amber-400 underline text-xs text-left font-semibold"
            >
              View loan status & repay →
            </button>
          </div>
        )}

        {!checking && hasFarmerID && !hasActiveLoan && (
          <div className="flex flex-col gap-4">

            {/* ── Lender selection ── */}
            <div>
              <label className="text-white/60 text-xs mb-2 block">Select a lender</label>

              {lenders.length === 0 ? (
                <div className="border border-white/10 rounded-lg px-4 py-3 text-white/40 text-sm">
                  No active lenders available right now. Check back soon, or browse the marketplace for details.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {lenders.map((l) => {
                    const isSelected = selectedLender?.publicKey.toString() === l.publicKey.toString()
                    const lMaxLoanSol = (l.account.maxLoanLamports.toNumber() / 1_000_000_000).toFixed(2)
                    const apr = (l.account.interestRateBps / 100).toFixed(1)
                    return (
                      <button
                        key={l.publicKey.toString()}
                        type="button"
                        onClick={() => selectLender(l)}
                        className={`text-left rounded-lg p-4 border transition ${
                          isSelected
                            ? 'border-green-400/40 bg-green-400/[0.06]'
                            : 'border-white/10 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 size={14} className="text-white/40" />
                          <span className="font-semibold text-sm">{l.account.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-white/40 text-xs">
                          <span className="flex items-center gap-1">
                            <Coins size={11} /> Up to {lMaxLoanSol} SOL
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={11} /> {apr}% APR
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarClock size={11} /> Up to {l.account.maxDurationWeeks}w
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1 block">Loan purpose</label>
              <select
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                disabled={!selectedLender}
                className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">Select purpose</option>
                {LOAN_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* ── Loan amount — free-form, bounded to the selected lender's
                 actual max_loan_lamports, with dynamic quick-select shortcuts.
                 Replaces the old fixed 0.01–0.5 SOL preset list, which was
                 unreachable for any lender offering more than 0.5 SOL. ── */}
            <div>
              <label className="text-white/60 text-xs mb-1 block">
                Loan amount (SOL) {selectedLender && <span className="text-white/30">— up to {formatSol(maxLoanSol)} SOL</span>}
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                disabled={!selectedLender}
                min="0"
                max={maxLoanSol || undefined}
                step="0.01"
                placeholder={selectedLender ? `0.01 – ${formatSol(maxLoanSol)}` : 'Select a lender first'}
                className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-green-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
              />

              {selectedLender && (
                <div className="flex gap-2 mt-2">
                  {quickAmounts.map((amt, i) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, amount: amt }))}
                      className="flex-1 text-xs font-medium py-1.5 rounded-md border border-white/10 text-white/50 hover:border-green-400/40 hover:text-green-400 transition"
                    >
                      {i === 2 ? 'Max' : `${[25, 50][i]}%`} · {amt} SOL
                    </button>
                  ))}
                </div>
              )}

              {form.amount && !isValidAmount && (
                <p className="text-red-400/80 text-xs mt-1.5">
                  {parsedAmount <= 0
                    ? 'Enter an amount greater than 0.'
                    : `This lender's max loan is ${formatSol(maxLoanSol)} SOL.`}
                </p>
              )}
            </div>

            <div>
              <label className="text-white/60 text-xs mb-1 block">Repayment period (weeks)</label>
              <select
                name="repaymentWeeks"
                value={form.repaymentWeeks}
                onChange={handleChange}
                disabled={!selectedLender}
                className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {availableWeeks.map(w => <option key={w} value={w}>{w} weeks</option>)}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!isValid || status === 'loading'}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition mt-2"
            >
              {status === 'loading' ? (
                <><Loader2 size={18} className="animate-spin" /> Processing loan...</>
              ) : (
                'Request loan →'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}