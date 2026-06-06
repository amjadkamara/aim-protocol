import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  Building2, Loader2, CheckCircle2, AlertCircle,
  Clock, ShieldAlert, ArrowLeft, Globe, Mail,
  Coins, TrendingUp, CalendarClock, Info,
  Hash, MapPin, ChevronDown, ChevronUp, FileText
} from 'lucide-react'
import { useAimProgram } from './useAimProgram'

const ORG_TYPES = [
  'NGO (Non-Governmental Organisation)',
  'Cooperative / SACCO',
  'Microfinance Institution (MFI)',
  'Development Bank',
  'Impact Investment Fund',
  'Community Development Organisation',
  'Other',
]

const COUNTRIES = [
  'Sierra Leone', 'Ghana', 'Nigeria', 'Kenya', 'Uganda',
  'Tanzania', 'Rwanda', 'Senegal', 'Mali', 'Burkina Faso',
  'Ethiopia', 'Mozambique', 'Zambia', 'Zimbabwe', 'Other',
]

const CROP_FOCUS = [
  'Rice', 'Cassava', 'Maize', 'Groundnut', 'Sweet Potato',
  'Sorghum', 'Millet', 'Cocoa', 'Coffee', 'All Crops',
]

const STEPS = ['Organisation', 'Loan Terms', 'Review & Submit']

const AIM_TERMS = `AIM PROTOCOL — LENDER PARTICIPATION TERMS
Last updated: June 2026

1. ELIGIBILITY
Lenders must be registered legal entities (NGO, cooperative, MFI, development bank, or equivalent) operating in an African jurisdiction. Individual persons may not register as lenders. By submitting this registration, you confirm your organisation has the legal authority to deploy capital to third parties.

2. ADMIN APPROVAL
All lender registrations are subject to review and approval by Aadios Systems (SL) Ltd., operator of AIM Protocol. Approval is at the sole discretion of the operator. Submission does not guarantee activation. The operator reserves the right to reject, suspend, or revoke lender status at any time.

3. PROTOCOL FEE
AIM Protocol charges a protocol fee of 0.5–1% on each loan disbursed through the platform. This fee is deducted automatically at the smart contract level on loan issuance and transferred to the AIM Protocol treasury wallet. By registering, you acknowledge and accept this fee structure.

4. CAPITAL TRANSPARENCY
Lenders must accurately declare their available capital budget. Misrepresentation of capital availability is grounds for immediate suspension. Capital verification will be enforced on-chain via USDC escrow in a future protocol version.

5. LOAN TERMS
All loan terms (interest rate, maximum amount, duration) declared during registration are displayed publicly to farmers on the Loan Marketplace. Lenders may not charge fees or apply terms not disclosed in their registered profile. Interest rates must be fair, transparent, and compliant with applicable laws in the lender's jurisdiction.

6. FARMER PROTECTION
Lenders may not engage in predatory lending practices. The one-active-loan-per-farmer rule is enforced at the smart contract level and cannot be circumvented. Lenders may not contact farmers outside the AIM Protocol platform for collection purposes.

7. ON-CHAIN RECORDS
All loan disbursements and repayments are recorded permanently on the Solana blockchain. These records are publicly auditable. Lenders accept that their lending activity, repayment rates, and portfolio performance are visible on-chain.

8. DATA & REPORTING
AIM Protocol may use aggregated, anonymised lending data for impact reporting, grant applications, and research. Individual farmer data will not be sold or shared with third parties without consent.

9. SUSPENSION & TERMINATION
The operator may suspend or terminate a lender's account for: misrepresentation, predatory practices, non-compliance with these terms, or conduct harmful to farmers or the protocol's reputation. Suspended lenders will not appear in the Loan Marketplace.

10. GOVERNING LAW
These terms are governed by the laws of Sierra Leone. Disputes shall be resolved through good-faith negotiation before any formal proceedings.

By checking the acceptance box, your authorised representative confirms they have read, understood, and accept these terms on behalf of your organisation.`

const ICON_PADDING = { paddingLeft: '2.5rem' }

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                done   ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                active ? 'bg-violet-600 border-violet-500 text-white' :
                         'bg-white/[0.04] border-white/10 text-white/30'
              }`}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                active ? 'text-white' : done ? 'text-green-400' : 'text-white/30'
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px mx-1 ${done ? 'bg-green-500/40' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <label className="text-white/60 text-xs uppercase tracking-wide mb-1.5 block">
      {children}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

function InputHint({ children }) {
  return (
    <p className="text-white/30 text-xs mt-1.5 flex items-center gap-1">
      <Info size={10} /> {children}
    </p>
  )
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

function TermsBox({ accepted, onAccept }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-white/60 hover:text-white/80 transition"
        >
          <span className="flex items-center gap-2">
            <FileText size={14} className="text-violet-400" />
            AIM Protocol Lender Participation Terms
          </span>
          {expanded
            ? <ChevronUp size={14} className="text-white/30" />
            : <ChevronDown size={14} className="text-white/30" />
          }
        </button>
        {expanded && (
          <div className="px-4 pb-4 border-t border-white/[0.06]">
            <pre className="text-white/40 text-xs leading-relaxed whitespace-pre-wrap font-sans mt-3 max-h-64 overflow-y-auto pr-2">
              {AIM_TERMS}
            </pre>
          </div>
        )}
      </div>
      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          onClick={() => onAccept(!accepted)}
          className={`w-5 h-5 rounded border shrink-0 mt-0.5 flex items-center justify-center transition ${
            accepted
              ? 'bg-violet-600 border-violet-500'
              : 'bg-white/[0.04] border-white/20 group-hover:border-white/40'
          }`}
        >
          {accepted && <CheckCircle2 size={12} className="text-white" />}
        </div>
        <span className="text-sm text-white/60 leading-relaxed">
          I have read and accept the AIM Protocol Lender Participation Terms on behalf of my organisation.
        </span>
      </label>
    </div>
  )
}

export default function LenderRegistration({ onBack }) {
  const { publicKey, connected } = useWallet()
  const { program } = useAimProgram()

  const [step, setStep]         = useState(0)
  const [status, setStatus]     = useState('idle')
  const [error, setError]       = useState('')
  const [existing, setExisting] = useState(null)

  const [form, setForm] = useState({
    orgName:          '',
    orgType:          '',
    registrationNo:   '',
    country:          '',
    city:             '',
    website:          '',
    contactEmail:     '',
    description:      '',
    maxLoanSol:       '',
    interestRateApr:  '',
    maxDurationWeeks: '',
    minCreditScore:   '0',
    cropFocus:        [],
    capitalBudgetSol: '',
    acceptTerms:      false,
    confirmCapital:   false,
  })

  useEffect(() => {
    if (!program || !publicKey) return
    const checkExisting = async () => {
      try {
        if (program.account.lenderAccount) {
          const [pda] = await import('@coral-xyz/anchor')
            .then(({ web3 }) => [
              web3.PublicKey.findProgramAddressSync(
                [Buffer.from('lender'), publicKey.toBuffer()],
                program.programId
              )[0]
            ])
          const data = await program.account.lenderAccount.fetch(pda)
          setExisting(data)
          setStatus('already_registered')
        }
      } catch {
        // No existing account — good
      }
    }
    checkExisting()
  }, [program, publicKey])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleCrop = (crop) => {
    setForm(f => ({
      ...f,
      cropFocus: f.cropFocus.includes(crop)
        ? f.cropFocus.filter(c => c !== crop)
        : [...f.cropFocus, crop]
    }))
  }

  const step0Valid =
    form.orgName.trim() &&
    form.orgType &&
    form.country &&
    form.city.trim() &&
    form.contactEmail.trim() &&
    form.description.trim().length >= 20

  const step1Valid =
    form.maxLoanSol &&
    parseFloat(form.maxLoanSol) > 0 &&
    form.interestRateApr &&
    parseFloat(form.interestRateApr) >= 0 &&
    form.maxDurationWeeks &&
    parseInt(form.maxDurationWeeks) > 0 &&
    form.capitalBudgetSol &&
    parseFloat(form.capitalBudgetSol) > 0

  const step2Valid = form.acceptTerms && form.confirmCapital

  const handleSubmit = async () => {
    setStatus('loading')
    setError('')
    try {
      await new Promise(r => setTimeout(r, 1800))
      setStatus('pending')
    } catch (err) {
      setError('Transaction failed. Please check your wallet is on devnet and try again.')
      setStatus('idle')
    }
  }

  const baseInput = "w-full bg-white/5 border border-white/10 rounded-lg py-3 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 transition"
  const selectClass = "w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-400 transition"
  const plainInput = baseInput + " px-4"

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="w-full max-w-md px-6 flex flex-col items-center gap-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center">
          <ShieldAlert size={28} className="text-white/40" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
          <p className="text-white/50 text-sm max-w-xs">
            Connect the wallet your organisation will use to deploy capital.
            This wallet becomes your lender identity on-chain.
          </p>
        </div>
        <WalletMultiButton />
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    )
  }

  // ── Already registered ─────────────────────────────────────────────────────
  if (status === 'already_registered' && existing) {
    return (
      <div className="w-full max-w-md px-6 flex flex-col items-center gap-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Building2 size={28} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Already Registered</h2>
          <p className="text-white/50 text-sm">
            This wallet already has a Lender account on AIM Protocol.
          </p>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 w-full text-left flex flex-col gap-3">
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Organisation</p>
            <p className="font-semibold">{existing.name || existing.orgName || '—'}</p>
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Status</p>
            {existing.isActive
              ? <span className="text-green-400 text-sm font-medium">● Active</span>
              : <span className="text-yellow-400 text-sm font-medium">◌ Pending Approval</span>
            }
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Wallet</p>
            <p className="text-xs font-mono text-white/40 break-all">{publicKey.toString()}</p>
          </div>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition">
          <ArrowLeft size={14} /> Back to home
        </button>
      </div>
    )
  }

  // ── Pending approval ───────────────────────────────────────────────────────
  if (status === 'pending') {
    return (
      <div className="w-full max-w-md px-6 flex flex-col items-center gap-6 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Clock size={28} className="text-yellow-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Registration Submitted</h2>
          <p className="text-white/50 text-sm max-w-xs">
            Your lender registration is pending admin approval.
            You will be activated before you can deploy capital to farmers.
          </p>
        </div>
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 w-full text-left flex flex-col gap-4">
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Organisation</p>
            <p className="font-semibold">{form.orgName}</p>
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Registration No.</p>
            <p className="text-sm text-white/70">{form.registrationNo || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Location</p>
            <p className="text-sm text-white/70">{form.city}, {form.country}</p>
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Max Loan</p>
            <p className="text-sm text-white/70">{form.maxLoanSol} SOL at {form.interestRateApr}% APR</p>
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Lender Wallet</p>
            <p className="text-xs font-mono text-white/40 break-all">{publicKey.toString()}</p>
          </div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-300 text-xs text-left w-full">
          Share your wallet address with the AIM Protocol admin to expedite approval.
          Your listing will appear in the Loan Marketplace once activated.
        </div>
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition">
          <ArrowLeft size={14} /> Back to home
        </button>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-xl px-6 md:px-10 flex flex-col py-10">

      <button onClick={onBack}
        className="text-white/40 hover:text-white/80 transition flex items-center gap-1.5 text-sm self-start mb-8">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3 mb-2">
        <Building2 className="text-violet-400" size={28} />
        <h1 className="text-2xl font-bold">Register as a Lender</h1>
      </div>
      <p className="text-white/40 text-sm mb-8">
        Join AIM Protocol as an approved lender. Deploy capital directly to verified African farmers.
      </p>

      <StepIndicator current={step} />

      {/* ── STEP 0 ── */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <SectionHeader
            icon={<Building2 size={18} />}
            title="Organisation Details"
            subtitle="Tell us about your organisation. This information will appear on your lender profile."
          />

          <div>
            <FieldLabel required>Organisation Name</FieldLabel>
            <input
              value={form.orgName}
              onChange={e => set('orgName', e.target.value)}
              placeholder="e.g. Freetown Agricultural Cooperative"
              className={plainInput}
            />
          </div>

          <div>
            <FieldLabel required>Organisation Type</FieldLabel>
            <select
              value={form.orgType}
              onChange={e => set('orgType', e.target.value)}
              className={selectClass}
            >
              <option value="">Select organisation type</option>
              {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <FieldLabel>Registration Number</FieldLabel>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={form.registrationNo}
                onChange={e => set('registrationNo', e.target.value)}
                placeholder="Your official registration number"
                className={baseInput}
                style={ICON_PADDING}
              />
            </div>
            <InputHint>Government, business, or NGO registration number — verified by admin</InputHint>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Country</FieldLabel>
              <select
                value={form.country}
                onChange={e => set('country', e.target.value)}
                className={selectClass}
              >
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel required>City / Town</FieldLabel>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="e.g. Freetown"
                  className={baseInput}
                  style={ICON_PADDING}
                />
              </div>
            </div>
          </div>

          <div>
            <FieldLabel>Website</FieldLabel>
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={form.website}
                onChange={e => set('website', e.target.value)}
                placeholder="https://yourorganisation.org"
                className={baseInput}
                style={ICON_PADDING}
              />
            </div>
            <InputHint>Optional but increases farmer trust</InputHint>
          </div>

          <div>
            <FieldLabel required>Contact Email</FieldLabel>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={form.contactEmail}
                onChange={e => set('contactEmail', e.target.value)}
                placeholder="contact@yourorganisation.org"
                className={baseInput}
                style={ICON_PADDING}
              />
            </div>
            <InputHint>Used by AIM Protocol admin for approval communication only</InputHint>
          </div>

          <div>
            <FieldLabel required>Organisation Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe your organisation's mission and experience in agricultural lending..."
              rows={4}
              className={`${plainInput} resize-none`}
            />
            <div className="flex justify-between mt-1.5">
              <InputHint>Minimum 20 characters. Shown to farmers on the marketplace.</InputHint>
              <span className={`text-xs ${
                form.description.length < 20 ? 'text-red-400/60' : 'text-green-400/60'
              }`}>
                {form.description.length} chars
              </span>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!step0Valid}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition mt-2"
          >
            Continue to Loan Terms →
          </button>
        </div>
      )}

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <SectionHeader
            icon={<Coins size={18} />}
            title="Loan Terms & Capital"
            subtitle="Define the terms you offer to farmers. These will be visible in the Loan Marketplace."
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Max Loan Amount (SOL)</FieldLabel>
              <div className="relative">
                <Coins size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.maxLoanSol}
                  onChange={e => set('maxLoanSol', e.target.value)}
                  placeholder="2.0"
                  className={baseInput}
                  style={ICON_PADDING}
                />
              </div>
              <InputHint>Per-farmer loan ceiling</InputHint>
            </div>

            <div>
              <FieldLabel required>Interest Rate (% APR)</FieldLabel>
              <div className="relative">
                <TrendingUp size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.interestRateApr}
                  onChange={e => set('interestRateApr', e.target.value)}
                  placeholder="12.0"
                  className={baseInput}
                  style={ICON_PADDING}
                />
              </div>
              <InputHint>Annual rate — shown transparently to farmers</InputHint>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Max Duration (weeks)</FieldLabel>
              <div className="relative">
                <CalendarClock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={form.maxDurationWeeks}
                  onChange={e => set('maxDurationWeeks', e.target.value)}
                  placeholder="16"
                  className={baseInput}
                  style={ICON_PADDING}
                />
              </div>
              <InputHint>Aligned to farming seasons</InputHint>
            </div>

            <div>
              <FieldLabel>Min Credit Score</FieldLabel>
              <input
                type="number"
                min="0"
                max="100"
                value={form.minCreditScore}
                onChange={e => set('minCreditScore', e.target.value)}
                placeholder="0"
                className={plainInput}
              />
              <InputHint>0 = accept all farmers</InputHint>
            </div>
          </div>

          <div>
            <FieldLabel required>Capital Budget (SOL)</FieldLabel>
            <div className="relative">
              <Coins size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="number"
                min="0"
                step="1"
                value={form.capitalBudgetSol}
                onChange={e => set('capitalBudgetSol', e.target.value)}
                placeholder="500"
                className={baseInput}
                style={ICON_PADDING}
              />
            </div>
            <InputHint>Total SOL available for deployment. Self-declared — verified on-chain in V2.4.</InputHint>
          </div>

          <div>
            <FieldLabel>Crop Focus</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {CROP_FOCUS.map(crop => (
                <button
                  key={crop}
                  type="button"
                  onClick={() => toggleCrop(crop)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    form.cropFocus.includes(crop)
                      ? 'bg-green-500/20 border-green-500/40 text-green-400'
                      : 'bg-white/[0.04] border-white/10 text-white/40 hover:bg-white/[0.08]'
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
            <InputHint>Optional — helps farmers find lenders who fund their crop type</InputHint>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep(0)}
              className="w-full bg-white/[0.06] hover:bg-white/[0.10] text-white/60 font-semibold py-3 rounded-lg transition"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
            >
              Review & Submit →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <SectionHeader
            icon={<CheckCircle2 size={18} />}
            title="Review & Submit"
            subtitle="Confirm your details before submitting. Your registration requires admin approval before going live."
          />

          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4">

            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
              <Building2 size={14} className="text-violet-400" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Organisation</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Name</p>
                <p className="text-sm font-medium">{form.orgName}</p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Type</p>
                <p className="text-sm font-medium">{form.orgType}</p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm font-medium">{form.city}, {form.country}</p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Contact</p>
                <p className="text-sm font-medium text-white/70 break-all">{form.contactEmail}</p>
              </div>
              {form.registrationNo && (
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Reg. Number</p>
                  <p className="text-sm font-medium text-white/70">{form.registrationNo}</p>
                </div>
              )}
              {form.website && (
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Website</p>
                  <p className="text-sm text-violet-400 break-all">{form.website}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Description</p>
              <p className="text-sm text-white/60 leading-relaxed">{form.description}</p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
              <Coins size={14} className="text-violet-400" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Loan Terms</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Max Loan</p>
                <p className="text-sm font-medium">{form.maxLoanSol} SOL</p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Interest</p>
                <p className="text-sm font-medium">{form.interestRateApr}% APR</p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Duration</p>
                <p className="text-sm font-medium">Up to {form.maxDurationWeeks} weeks</p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Min Credit Score</p>
                <p className="text-sm font-medium">
                  {form.minCreditScore === '0' ? 'All farmers' : form.minCreditScore}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Capital Budget</p>
                <p className="text-sm font-medium text-green-400">{form.capitalBudgetSol} SOL</p>
              </div>
              {form.cropFocus.length > 0 && (
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Crop Focus</p>
                  <p className="text-sm font-medium">{form.cropFocus.join(', ')}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.06]">
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Lender Wallet</p>
              <p className="text-xs font-mono text-white/40 break-all">{publicKey?.toString()}</p>
            </div>
          </div>

          <TermsBox
            accepted={form.acceptTerms}
            onAccept={(val) => set('acceptTerms', val)}
          />

          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => set('confirmCapital', !form.confirmCapital)}
              className={`w-5 h-5 rounded border shrink-0 mt-0.5 flex items-center justify-center transition ${
                form.confirmCapital
                  ? 'bg-violet-600 border-violet-500'
                  : 'bg-white/[0.04] border-white/20 group-hover:border-white/40'
              }`}
            >
              {form.confirmCapital && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <span className="text-sm text-white/60 leading-relaxed">
              I confirm that the declared capital budget of{' '}
              <span className="text-white font-medium">{form.capitalBudgetSol} SOL</span> is
              available for disbursement to farmers upon approval.
            </span>
          </label>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-yellow-300 text-xs flex items-start gap-2">
            <Clock size={13} className="shrink-0 mt-0.5" />
            <span>
              Your registration will be reviewed by the AIM Protocol admin before activation.
              You will not appear in the Loan Marketplace until approved. A 0.5–1% protocol
              fee applies to each loan disbursed through the platform.
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              disabled={status === 'loading'}
              className="w-full bg-white/[0.06] hover:bg-white/[0.10] text-white/60 font-semibold py-3 rounded-lg transition disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!step2Valid || status === 'loading'}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {status === 'loading' ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              ) : (
                'Submit Registration →'
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}