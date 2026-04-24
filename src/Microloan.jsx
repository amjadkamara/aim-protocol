import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Coins, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAimProgram } from './useAimProgram'

const LOAN_PURPOSES = [
  'Seeds & Planting Materials',
  'Fertilizer & Soil Treatment',
  'Irrigation Equipment',
  'Farm Tools & Equipment',
  'Pest & Disease Control',
  'Harvest & Storage',
  'Transport to Market',
]

const LOAN_AMOUNTS = [
  { label: '0.01 SOL (~$1)', value: 0.01 },
  { label: '0.05 SOL (~$5)', value: 0.05 },
  { label: '0.1 SOL (~$10)', value: 0.1 },
  { label: '0.2 SOL (~$20)', value: 0.2 },
  { label: '0.5 SOL (~$50)', value: 0.5 },
]

export default function Microloan({ onBack, farmerName, cropType, farmerPublicKey }) {
  const { publicKey } = useWallet()
  const { requestLoan } = useAimProgram()

  const [form, setForm] = useState({
    purpose: '',
    amount: '',
    repaymentWeeks: '4',
  })
  const [status, setStatus] = useState('idle')
  const [txSignature, setTxSignature] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const isValid = form.purpose && form.amount && farmerPublicKey

  const handleSubmit = async () => {
    if (!publicKey || !isValid) return
    setStatus('loading')
    setError('')

    try {
      const lamports = parseFloat(form.amount) * 1000000000

      const result = await requestLoan({
        farmerPublicKey,
        amount: lamports,
        purpose: form.purpose,
        repaymentWeeks: parseInt(form.repaymentWeeks),
      })

      setTxSignature(result.signature)
      setStatus('success')
    } catch (err) {
      setError(err.message || 'Transaction failed. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    const selectedAmount = LOAN_AMOUNTS.find(l => l.value === parseFloat(form.amount))
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-4 text-center gap-6">
        <CheckCircle2 size={64} className="text-yellow-400" />
        <h2 className="text-3xl font-bold">Loan Approved!</h2>
        <p className="text-white/60 max-w-md">
          Your simulated crop-backed microloan has been disbursed on Solana devnet.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-md w-full text-left">
          {farmerName && (
            <>
              <p className="text-white/40 text-xs mb-1">FARMER</p>
              <p className="font-semibold mb-3">{farmerName}</p>
            </>
          )}
          <p className="text-white/40 text-xs mb-1">LOAN AMOUNT</p>
          <p className="font-semibold text-yellow-400 text-xl mb-3">{selectedAmount?.label}</p>
          <p className="text-white/40 text-xs mb-1">PURPOSE</p>
          <p className="font-semibold mb-3">{form.purpose}</p>
          <p className="text-white/40 text-xs mb-1">REPAYMENT PERIOD</p>
          <p className="font-semibold">{form.repaymentWeeks} weeks</p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs mb-1">STATUS</p>
            <span className="bg-green-400/20 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-400/30">
              ✓ DISBURSED ON-CHAIN
            </span>
          </div>
        </div>

        
          <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-3 rounded-lg transition"
        >
          View Loan Transaction ↗
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
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="text-white/40 hover:text-white text-sm mb-8 transition">
          ← Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Coins className="text-yellow-400" size={32} />
          <h2 className="text-2xl font-bold">Request Microloan</h2>
        </div>
        <p className="text-white/50 text-sm mb-8">
          Request a simulated crop-backed microloan disbursed directly to your wallet on Solana.
        </p>

        {!farmerPublicKey && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-4 py-3 mb-2">
            <AlertCircle size={16} />
            You must create a Farmer ID before requesting a loan. Please go back and register first.
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">Loan Purpose</label>
            <select
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition"
            >
              <option value="">Select purpose</option>
              {LOAN_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">Loan Amount</label>
            <select
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition"
            >
              <option value="">Select amount</option>
              {LOAN_AMOUNTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">Repayment Period (weeks)</label>
            <select
              name="repaymentWeeks"
              value={form.repaymentWeeks}
              onChange={handleChange}
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition"
            >
              <option value="2">2 weeks</option>
              <option value="4">4 weeks</option>
              <option value="8">8 weeks</option>
              <option value="12">12 weeks</option>
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
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition mt-2"
          >
            {status === 'loading' ? (
              <><Loader2 size={18} className="animate-spin" /> Processing Loan...</>
            ) : (
              'Request Loan →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}