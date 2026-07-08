import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  ArrowLeft, Building2, Coins, Clock, TrendingUp,
  Loader2, AlertCircle, Sprout, CheckCircle2, PauseCircle,
  Wallet
} from 'lucide-react'
import idl from './idl/aim_program.json'

const PROGRAM_ID = new web3.PublicKey('AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB')

function LenderCard({ lender }) {
  const { account, publicKey } = lender
  const isActive = account.isActive

  // maxLoanLamports is the correct on-chain field name (renamed from maxLoanAmount in V2.3)
  const maxLoanSol = account.maxLoanLamports
    ? (Number(account.maxLoanLamports) / 1_000_000_000).toFixed(3)
    : '—'

  const apr = account.interestRateBps
    ? (account.interestRateBps / 100).toFixed(1)
    : '—'

  return (
    <div className={`relative bg-white/[0.04] border rounded-2xl p-6 flex flex-col gap-5 transition hover:bg-white/[0.06] ${
      isActive ? 'border-white/10' : 'border-white/[0.05] opacity-60'
    }`}>

      {/* Top accent line */}
      <div className={`absolute top-0 left-6 right-6 h-0.5 rounded-full ${
        isActive ? 'bg-gradient-to-r from-green-400/60 via-violet-400/40 to-transparent' : 'bg-white/10'
      }`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isActive ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.06] text-white/30'
          }`}>
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight">
              {account.name || account.orgName || 'Unknown Organisation'}
            </h3>
            <p className="text-white/30 text-xs font-mono mt-0.5">
              {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-6)}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-green-500/15 text-green-400 border-green-500/25 tracking-wider">
              <CheckCircle2 size={10} /> ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-white/[0.06] text-white/30 border-white/10 tracking-wider">
              <PauseCircle size={10} /> PAUSED
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {account.description && (
        <p className="text-white/50 text-sm leading-relaxed">
          {account.description}
        </p>
      )}

      {/* Terms grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-3 flex flex-col gap-1">
          <span className="text-white/30 text-[10px] uppercase tracking-widest flex items-center gap-1">
            <Coins size={9} /> Max Loan
          </span>
          <span className="text-sm font-semibold text-white/90">
            {maxLoanSol} SOL
          </span>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-3 flex flex-col gap-1">
          <span className="text-white/30 text-[10px] uppercase tracking-widest flex items-center gap-1">
            <TrendingUp size={9} /> Interest
          </span>
          <span className="text-sm font-semibold text-white/90">
            {apr}% APR
          </span>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-3 flex flex-col gap-1">
          <span className="text-white/30 text-[10px] uppercase tracking-widest flex items-center gap-1">
            <Clock size={9} /> Duration
          </span>
          <span className="text-sm font-semibold text-white/90">
            {account.maxDurationWeeks ? `${account.maxDurationWeeks}w` : '—'}
          </span>
        </div>
      </div>

    </div>
  )
}

export default function LoanMarketplace({ onBack }) {
  const { connection } = useConnection()
  const { connected } = useWallet()

  const [lenders, setLenders]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    const fetchLenders = async () => {
      setLoading(true)
      setError(null)
      try {
        const dummyWallet = {
          publicKey: null,
          signTransaction: async (tx) => tx,
          signAllTransactions: async (txs) => txs,
        }
        const provider = new AnchorProvider(connection, dummyWallet, {
          commitment: 'confirmed',
        })
        const program = new Program(idl, provider)

        if (program.account.lenderAccount) {
          const all = await program.account.lenderAccount.all()
          setLenders(all)
        } else {
          setLenders([])
        }
      } catch (e) {
        console.log('LenderAccount not available yet:', e.message)
        setLenders([])
      } finally {
        setLoading(false)
      }
    }

    fetchLenders()
  }, [connection])

  const activeLenders  = lenders.filter(l => l.account.isActive)
  const pausedLenders  = lenders.filter(l => !l.account.isActive)

  return (
    <div className="w-full max-w-3xl px-6 md:px-10 flex flex-col gap-8 py-10">

      <button onClick={onBack}
        className="text-white/40 hover:text-white/80 transition flex items-center gap-1.5 text-sm self-start">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">AIM Protocol</span>
          <span className="text-white/20 text-xs">•</span>
          <span className="text-[10px] text-green-400/70 uppercase tracking-widest">Live on Solana Devnet</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">Loan Marketplace</h1>
        <p className="text-white/40 text-sm mt-1">
          Browse approved lenders and their terms. All lenders are verified by AIM Protocol.
        </p>
      </div>

      {!loading && lenders.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Total Lenders</p>
            <p className="text-xl font-bold">{lenders.length}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Active</p>
            <p className="text-xl font-bold text-green-400">{activeLenders.length}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Paused</p>
            <p className="text-xl font-bold text-white/40">{pausedLenders.length}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/40">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Fetching lenders from Solana devnet...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {!loading && lenders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-white/[0.06] rounded-2xl bg-white/[0.02]">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center text-white/20">
            <Building2 size={28} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-white/50 text-sm font-medium">No lenders registered yet</p>
            <p className="text-white/25 text-xs max-w-xs">
              AIM Protocol is onboarding its first lenders. Check back soon — or reach out to
              register your organisation.
            </p>
          </div>
          <a href="mailto:aim@aadios.com"
            className="text-violet-400 hover:text-violet-300 text-xs transition underline underline-offset-2">
            Register your organisation as a lender →
          </a>
        </div>
      )}

      {!loading && lenders.length > 0 && (
        <div className="flex flex-col gap-4">
          {lenders.map((lender) => (
            <LenderCard key={lender.publicKey.toString()} lender={lender} />
          ))}
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] px-6 py-8 text-center flex flex-col items-center gap-4">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent" />
        <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-green-400">
          <Sprout size={18} />
        </div>
        {connected ? (
          <>
            <p className="text-white/60 text-sm">
              You're connected. Go to your dashboard to request a loan.
            </p>
            <button onClick={onBack}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition">
              Go to Dashboard →
            </button>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-white/80">Ready to apply for a loan?</p>
            <p className="text-white/40 text-xs max-w-xs">
              Connect your wallet to register as a farmer and apply to any active lender.
            </p>
            <WalletMultiButton />
          </>
        )}
      </div>

    </div>
  )
}