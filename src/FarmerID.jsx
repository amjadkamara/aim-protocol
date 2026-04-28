import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAimProgram } from './useAimProgram'

const CROPS = ['Rice', 'Cassava', 'Maize', 'Groundnut', 'Sweet Potato', 'Sorghum', 'Millet']
const DISTRICTS = ['Bo', 'Bombali', 'Bonthe', 'Falaba', 'Kailahun', 'Kambia', 'Karene', 'Kenema', 'Koinadugu', 'Kono', 'Moyamba', 'Port Loko', 'Pujehun', 'Tonkolili', 'Western Area Rural', 'Western Area Urban']

export default function FarmerID({ onBack, onSuccess }) {
  const { publicKey } = useWallet()
  const { createFarmerID } = useAimProgram()

  const [form, setForm] = useState({
    fullName: '',
    cropType: '',
    district: '',
    farmSize: '',
  })
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [txSignature, setTxSignature] = useState('')
  const [farmerPublicKey, setFarmerPublicKey] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const isValid = form.fullName && form.cropType && form.district && form.farmSize

  const handleSubmit = async () => {
    if (!publicKey || !isValid) return
    setStatus('loading')
    setError('')

    try {
      const result = await createFarmerID({
        fullName: form.fullName,
        cropType: form.cropType,
        district: form.district,
        farmSize: form.farmSize,
      })

      setTxSignature(result.signature)
      setFarmerPublicKey(result.farmerPublicKey)
      setStatus('success')
      if (onSuccess) onSuccess(result.farmerPublicKey)
    } catch (err) {
      setError(err.message || 'Transaction failed. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-4 text-center gap-6">
        <CheckCircle2 size={64} className="text-green-400" />
        <h2 className="text-3xl font-bold">Farmer ID Created!</h2>
        <p className="text-white/60 max-w-md">
          Your on-chain farmer identity has been registered on Solana devnet. Your wallet is now your farming credential.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-md w-full text-left">
          <p className="text-white/40 text-xs mb-1">FARMER NAME</p>
          <p className="font-semibold">{form.fullName}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">CROP TYPE</p>
          <p className="font-semibold">{form.cropType}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">DISTRICT</p>
          <p className="font-semibold">{form.district}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">FARM SIZE</p>
          <p className="font-semibold">{form.farmSize} acres</p>
        </div>
        
           <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-lg transition"
        >
          View on Solana Explorer ↗
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
          <ShieldCheck className="text-green-400" size={32} />
          <h2 className="text-2xl font-bold">Create Farmer ID</h2>
        </div>
        <p className="text-white/50 text-sm mb-8">
          Register your on-chain farming identity. This will be stored permanently on the Solana blockchain.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Mariama Koroma"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
            />
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">Primary Crop</label>
            <select
              name="cropType"
              value={form.cropType}
              onChange={handleChange}
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 transition"
            >
              <option value="">Select crop type</option>
              {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">District</label>
            <select
              name="district"
              value={form.district}
              onChange={handleChange}
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 transition"
            >
              <option value="">Select district</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">Farm Size (acres)</label>
            <input
              name="farmSize"
              value={form.farmSize}
              onChange={handleChange}
              type="number"
              min="0"
              placeholder="e.g. 2.5"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
            />
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
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition mt-2"
          >
            {status === 'loading' ? (
              <><Loader2 size={18} className="animate-spin" /> Registering on Solana...</>
            ) : (
              'Register Farmer ID →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}