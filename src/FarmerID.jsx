import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, Phone, Building2 } from 'lucide-react'
import { useAimProgram, getFarmerPDA, parseAnchorError } from './useAimProgram'

// Must match ADMIN_PUBKEY in lib.rs, App.jsx, and LenderRegistration.jsx
const ADMIN_WALLETS = ['Cz3GvsRaBsuAHoRiJd5sV6ZTAkE8TsFJAyuYWEtV7Qu2']

const CROPS = [
  // Staple food crops
  'Rice', 'Cassava', 'Maize', 'Yam', 'Millet', 'Sorghum', 'Sweet Potato', 'Plantain',
  // Export / cash crops
  'Cocoa', 'Coffee', 'Tea', 'Cotton', 'Groundnut', 'Cashew', 'Oil Palm', 'Sugarcane',
  // Horticulture
  'Pineapple', 'Banana', 'Mango', 'Vegetables',
  // Fallback
  'Other (specify)',
]

const COUNTRIES = ['Sierra Leone', 'Ghana', 'Nigeria', 'Kenya', 'Rwanda']

const PHONE_CODES = {
  'Sierra Leone': '+232',
  'Ghana': '+233',
  'Nigeria': '+234',
  'Kenya': '+254',
  'Rwanda': '+250',
}

const DISTRICTS_BY_COUNTRY = {
  'Sierra Leone': [
    'Bo', 'Bombali', 'Bonthe', 'Falaba', 'Kailahun', 'Kambia', 'Karene', 'Kenema',
    'Koinadugu', 'Kono', 'Moyamba', 'Port Loko', 'Pujehun', 'Tonkolili',
    'Western Area Rural', 'Western Area Urban',
  ],
  'Ghana': [
    'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
    'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West',
    'Volta', 'Western', 'Western North',
  ],
  'Rwanda': [
    'City of Kigali', 'Northern Province', 'Southern Province',
    'Eastern Province', 'Western Province',
  ],
  'Nigeria': [
    'Kaduna', 'Kano', 'Katsina', 'Niger', 'Kwara', 'Benue', 'Plateau',
    'Oyo', 'Ogun', 'Kebbi', 'Lagos', 'FCT Abuja', 'Other (specify)',
  ],
  'Kenya': [
    'Nakuru', 'Uasin Gishu', 'Kiambu', 'Meru', 'Kakamega', 'Bungoma',
    'Machakos', 'Kisii', 'Kericho', 'Trans-Nzoia', 'Nairobi', 'Mombasa',
    'Other (specify)',
  ],
}

export default function FarmerID({ onBack, onSuccess }) {
  const { publicKey } = useWallet()
  const { createFarmerID, fetchFarmer, fetchLender } = useAimProgram()

  const [form, setForm] = useState({
    fullName: '',
    cropType: '',
    cropOther: '',
    country: '',
    district: '',
    districtOther: '',
    phoneCode: '',
    phoneNumber: '',
    farmSize: '',
  })
  const [status, setStatus] = useState('idle') // idle | loading | success | error | already_registered | already_lender
  const [txSignature, setTxSignature] = useState('')
  const [error, setError] = useState('')
  const [existingFarmer, setExistingFarmer] = useState(null)
  const [existingLender, setExistingLender] = useState(null)
  const [roleChecking, setRoleChecking] = useState(true)

  // Admin wallet should never land on the Farmer registration form — whether
  // it was already connected when this page opened, or connects mid-flow via
  // the wallet-required gate below. Redirect home the moment we detect it.
  useEffect(() => {
    if (publicKey && ADMIN_WALLETS.includes(publicKey.toString())) {
      onBack()
    }
  }, [publicKey])

  // Check on load if this wallet already has a Farmer ID, or is registered as a Lender.
  // roleChecking stays true until this resolves, so the form never flashes before
  // we know whether this wallet is allowed to register as a Farmer.
  useEffect(() => {
    if (!publicKey) {
      setRoleChecking(false)
      return
    }
    if (ADMIN_WALLETS.includes(publicKey.toString())) {
      setRoleChecking(false)
      return
    }
    setRoleChecking(true)
    fetchLender().then((lender) => {
      if (lender) {
        setExistingLender(lender)
        setStatus('already_lender')
        setRoleChecking(false)
        return
      }
      fetchFarmer().then((farmer) => {
        if (farmer) {
          setExistingFarmer(farmer)
          setStatus('already_registered')
        }
        setRoleChecking(false)
      })
    })
  }, [publicKey])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Country change resets district and auto-fills phone code
    if (name === 'country') {
      setForm({
        ...form,
        country: value,
        district: '',
        districtOther: '',
        phoneCode: PHONE_CODES[value] || '',
      })
      return
    }

    // District change clears the "Other" free-text unless still on "Other (specify)"
    if (name === 'district' && value !== 'Other (specify)') {
      setForm({ ...form, district: value, districtOther: '' })
      return
    }

    // Crop change clears the "Other" free-text unless still on "Other (specify)"
    if (name === 'cropType' && value !== 'Other (specify)') {
      setForm({ ...form, cropType: value, cropOther: '' })
      return
    }

    setForm({ ...form, [name]: value })
  }

  const districtOptions = form.country ? DISTRICTS_BY_COUNTRY[form.country] || [] : []
  const isOtherDistrict = form.district === 'Other (specify)'
  const isOtherCrop = form.cropType === 'Other (specify)'

  // Resolve actual values to send on-chain
  const resolvedDistrict = isOtherDistrict ? form.districtOther.trim() : form.district
  const resolvedCrop = isOtherCrop ? form.cropOther.trim() : form.cropType

  const phoneDigitsValid =
    form.phoneNumber.replace(/\D/g, '').length >= 6 &&
    form.phoneNumber.replace(/\D/g, '').length <= 15

  const isValid =
    form.fullName.trim() &&
    form.cropType &&
    (!isOtherCrop || form.cropOther.trim()) &&
    form.country &&
    form.district &&
    (!isOtherDistrict || form.districtOther.trim()) &&
    form.phoneCode &&
    form.phoneNumber.trim() &&
    phoneDigitsValid &&
    form.farmSize

  const handleSubmit = async () => {
    if (!publicKey || !isValid) return
    setStatus('loading')
    setError('')

    try {
      const result = await createFarmerID({
        fullName: form.fullName,
        cropType: resolvedCrop,
        district: resolvedDistrict,
        country: form.country,
        phoneNumber: `${form.phoneCode} ${form.phoneNumber.trim()}`,
        farmSize: form.farmSize,
      })

      setTxSignature(result.signature)
      setStatus('success')
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(parseAnchorError(err))
      setStatus('error')
    }
  }

  // Still checking whether this wallet is a Farmer, a Lender, or neither —
  // don't render the form or any role screen until we know.
  if (roleChecking) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 gap-4">
        <Loader2 size={28} className="animate-spin text-white/30" />
        <p className="text-white/40 text-sm">Checking wallet status...</p>
      </div>
    )
  }

  // Admin wallet just connected — bounce home, don't render anything here
  if (publicKey && ADMIN_WALLETS.includes(publicKey.toString())) {
    return null
  }

  // No wallet connected yet — gate the form behind a connect screen, same
  // pattern as LenderRegistration.jsx, instead of letting someone fill out
  // the whole form only to find submit silently does nothing.
  if (!publicKey) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-4 text-center gap-6">
        <ShieldCheck size={48} className="text-white/30" />
        <h2 className="text-2xl font-semibold">Wallet required</h2>
        <p className="text-white/50 max-w-md text-sm leading-relaxed">
          Connect the wallet you'll use as your on-chain farming identity. This wallet becomes
          your permanent Farmer ID.
        </p>
        <WalletMultiButton />
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white text-sm transition"
        >
          ← Back to home
        </button>
      </div>
    )
  }

  // This wallet is already registered as a Lender — block Farmer registration entirely
  if (status === 'already_lender' && existingLender) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-4 text-center gap-6">
        <Building2 size={64} className="text-violet-400" />
        <h2 className="text-3xl font-bold">You're Registered as a Lender</h2>
        <p className="text-white/60 max-w-md">
          This wallet already has a Lender account on AIM Protocol. A wallet can only hold one
          role — Farmer or Lender, not both.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-md w-full text-left">
          <p className="text-white/40 text-xs mb-1">ORGANISATION</p>
          <p className="font-semibold">{existingLender.name}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">STATUS</p>
          <p className="font-semibold">
            {existingLender.isActive ? (
              <span className="text-green-400">● Active</span>
            ) : (
              <span className="text-yellow-400">◌ Pending Approval</span>
            )}
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white text-sm transition"
        >
          ← Back to home
        </button>
      </div>
    )
  }

  // Already registered — show their existing profile
  if (status === 'already_registered' && existingFarmer) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-4 text-center gap-6">
        <ShieldCheck size={64} className="text-green-400" />
        <h2 className="text-3xl font-bold">Already Registered</h2>
        <p className="text-white/60 max-w-md">
          This wallet already has a Farmer ID on-chain. One wallet = one farmer identity.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-md w-full text-left">
          <p className="text-white/40 text-xs mb-1">FARMER NAME</p>
          <p className="font-semibold">{existingFarmer.fullName}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">CROP TYPE</p>
          <p className="font-semibold">{existingFarmer.cropType}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">DISTRICT</p>
          <p className="font-semibold">{existingFarmer.district}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">COUNTRY</p>
          <p className="font-semibold">{existingFarmer.country}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">PHONE</p>
          <p className="font-semibold">{existingFarmer.phoneNumber}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">FARM SIZE</p>
          <p className="font-semibold">{existingFarmer.farmSize} acres</p>
          <p className="text-white/40 text-xs mt-3 mb-1">FARMER ID (PDA)</p>
          <p className="font-mono text-xs text-white/50 break-all">
            {getFarmerPDA(publicKey).toString()}
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white text-sm transition"
        >
          ← Back to home
        </button>
      </div>
    )
  }

  // Success screen after fresh registration
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
          <p className="font-semibold">{resolvedCrop}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">DISTRICT</p>
          <p className="font-semibold">{resolvedDistrict}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">COUNTRY</p>
          <p className="font-semibold">{form.country}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">PHONE</p>
          <p className="font-semibold">{form.phoneCode} {form.phoneNumber}</p>
          <p className="text-white/40 text-xs mt-3 mb-1">FARM SIZE</p>
          <p className="font-semibold">{form.farmSize} acres</p>
          <p className="text-white/40 text-xs mt-3 mb-1">FARMER ID (PDA)</p>
          <p className="font-mono text-xs text-white/50 break-all">
            {publicKey && getFarmerPDA(publicKey).toString()}
          </p>
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

            {isOtherCrop && (
              <input
                name="cropOther"
                value={form.cropOther}
                onChange={handleChange}
                placeholder="Type your crop"
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
              />
            )}
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">Country</label>
            <select
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 transition"
            >
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">
              {form.country === 'Rwanda' ? 'Province' : form.country === 'Ghana' ? 'Region' : 'District'}
            </label>
            <select
              name="district"
              value={form.district}
              onChange={handleChange}
              disabled={!form.country}
              className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">
                {form.country ? 'Select region' : 'Select country first'}
              </option>
              {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {isOtherDistrict && (
              <input
                name="districtOther"
                value={form.districtOther}
                onChange={handleChange}
                placeholder="Type your district / region"
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
              />
            )}
          </div>

          <div>
            <label className="text-white/60 text-xs uppercase tracking-wide mb-1 block">Phone Number</label>
            <div className="flex gap-2">
              <select
                name="phoneCode"
                value={form.phoneCode}
                onChange={handleChange}
                className="w-24 bg-[#0a0f1e] border border-white/10 rounded-lg px-2 py-3 text-white focus:outline-none focus:border-green-400 transition"
              >
                <option value="">Code</option>
                {Object.entries(PHONE_CODES).map(([country, code]) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="76 123456"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 text-white placeholder-white/30 focus:outline-none focus:border-green-400 transition"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            {form.phoneNumber && !phoneDigitsValid && (
              <p className="text-yellow-400/80 text-xs mt-1.5">
                Phone number should be between 6 and 15 digits.
              </p>
            )}
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
