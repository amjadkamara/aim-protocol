import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor'
import {
  Coins, Sprout, ArrowRight,
  UserCheck, LayoutDashboard, Search,
  MapPin, Loader2, Store, Building2, Copy, Check, ShieldCheck
} from 'lucide-react'
import Layout from './Layout'
import FarmerID from './FarmerID'
import Microloan from './Microloan'
import RepayLoan from './RepayLoan'
import Dashboard from './Dashboard'
import LoanHistory from './LoanHistory'
import AdminDashboard from './AdminDashboard'
import FarmerProfile from './FarmerProfile'
import LoanMarketplace from './LoanMarketplace'
import LenderRegistration from './LenderRegistration'
import { useAimProgram } from './useAimProgram'
import idl from './idl/aim_program.json'

// Must match ADMIN_PUBKEY in lib.rs and AdminDashboard.jsx
const ADMIN_WALLETS = ['Cz3GvsRaBsuAHoRiJd5sV6ZTAkE8TsFJAyuYWEtV7Qu2']
const PROGRAM_ID = 'AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB'

// Read-only Anchor provider — same dummy-wallet pattern already used in
// LoanMarketplace.jsx and FarmerProfile.jsx. Lets the Trust Strip show real
// on-chain counts to a visitor who hasn't connected a wallet yet, which is
// the whole point of it (a disconnected marketing page is exactly when this
// needs to work).
// Manually fetches + decodes accounts one at a time instead of using the
// simpler program.account.X.all() — matches the defensive pattern already
// established in fetchAllLenders/fetchAllFarmers (useAimProgram.js). Devnet
// has accounts from earlier schema versions that no longer match the current
// IDL; .all() aborts the entire batch if even one account fails to decode,
// so a single legacy account would take down the whole Trust Strip.
async function fetchAllAccountsSafe(program, connection, accountName) {
  const discriminator = program.coder.accounts.memcmp(accountName)
  const raw = await connection.getProgramAccounts(new web3.PublicKey(PROGRAM_ID), {
    filters: discriminator ? [{ memcmp: discriminator }] : [],
  })
  const results = []
  for (const { account } of raw) {
    try {
      results.push(program.coder.accounts.decode(accountName, account.data))
    } catch (err) {
      // Skip undecodable legacy account, same as fetchAllLenders/fetchAllFarmers
    }
  }
  return results
}

function useTrustStripStats() {
  const { connection } = useConnection()
  const [stats, setStats] = useState({ lenders: null, farmers: null, error: false })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const dummyWallet = {
          publicKey: null,
          signTransaction: async (tx) => tx,
          signAllTransactions: async (txs) => txs,
        }
        const provider = new AnchorProvider(connection, dummyWallet, { commitment: 'confirmed' })
        const program = new Program(idl, provider)
        const [lendersData, farmersData] = await Promise.all([
          fetchAllAccountsSafe(program, connection, 'lenderAccount'),
          fetchAllAccountsSafe(program, connection, 'farmerAccount'),
        ])
        if (!cancelled) {
          setStats({
            lenders: lendersData.filter(l => l.isActive).length,
            farmers: farmersData.length,
            error: false,
          })
        }
      } catch (e) {
        console.log('Trust strip stats fetch failed:', e.message)
        if (!cancelled) {
          setStats({ lenders: null, farmers: null, error: true })
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [connection])

  return stats
}

function TrustStrip() {
  const stats = useTrustStripStats()
  const [copied, setCopied] = useState(false)

  const copyProgramId = () => {
    navigator.clipboard.writeText(PROGRAM_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-wrap items-start justify-center gap-x-14 gap-y-6">
      <div className="text-center">
        <p className="text-white/35 text-[11px] mb-1.5">Network</p>
        <p className="text-white text-sm font-medium">Solana devnet</p>
      </div>
      <div className="text-center">
        <p className="text-white/35 text-[11px] mb-1.5">Program ID</p>
        <button onClick={copyProgramId} className="flex items-center justify-center gap-1.5 mx-auto">
          <span className="text-green-400 text-sm font-medium font-mono">AhHH...KqB</span>
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} className="text-white/35" />}
        </button>
      </div>
      <div className="text-center">
        <p className="text-white/35 text-[11px] mb-1.5">Lenders</p>
        <p className="text-white text-sm font-medium">
          {stats.error
            ? <span className="text-white/30 font-normal">Unavailable</span>
            : stats.lenders === null
              ? <span className="text-white/30 italic font-normal">Loading…</span>
              : `${stats.lenders} active`}
        </p>
      </div>
      <div className="text-center">
        <p className="text-white/35 text-[11px] mb-1.5">Farmers</p>
        <p className="text-white text-sm font-medium">
          {stats.error
            ? <span className="text-white/30 font-normal">Unavailable</span>
            : stats.farmers === null
              ? <span className="text-white/30 italic font-normal">Loading…</span>
              : `${stats.farmers} registered`}
        </p>
      </div>
    </div>
  )
}

function Home({ onNavigate }) {
  const { connected, publicKey } = useWallet()
  const { fetchFarmer, fetchLender } = useAimProgram()
  const [farmer, setFarmer] = useState(null)
  const [lender, setLender] = useState(null)
  const [loadingFarmer, setLoadingFarmer] = useState(connected)

  const isAdmin = connected && publicKey && ADMIN_WALLETS.includes(publicKey.toString())

  useEffect(() => {
    if (!connected || !publicKey) {
      setFarmer(null)
      setLender(null)
      return
    }
    // Admin wallet is blocked at contract level from both roles —
    // no need to fetch farmer/lender, it will always return null.
    if (ADMIN_WALLETS.includes(publicKey.toString())) {
      setFarmer(null)
      setLender(null)
      setLoadingFarmer(false)
      return
    }
    setLoadingFarmer(true)
    Promise.all([fetchLender(), fetchFarmer()]).then(([lenderData, farmerData]) => {
      // lender takes priority if somehow both exist (shouldn't happen given
      // on-chain mutual exclusivity, but resolve deterministically)
      if (lenderData) {
        setLender(lenderData)
        setFarmer(null)
      } else {
        setLender(null)
        setFarmer(farmerData)
      }
      setLoadingFarmer(false)
    })
  }, [connected, publicKey])

  const showRoleChoice = connected && !loadingFarmer && !isAdmin && !lender && !farmer

  return (
    <div className="w-full max-w-3xl px-6 md:px-10 flex flex-col gap-14">

      {/* ── HERO ── */}
      <section className="flex flex-col items-center text-center pt-14 pb-6 gap-5">

        {!connected && (
          <div className="flex items-center gap-1.5 text-white/50 text-xs px-3 py-1.5 rounded-full border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Live on Solana devnet
          </div>
        )}

        {connected ? (
          <div className="flex flex-col items-center gap-2">
            {loadingFarmer ? (
              <Loader2 size={22} className="animate-spin text-white/30" />
            ) : isAdmin ? (
              <>
                <div className="border border-white/15 text-white/60 text-xs px-3 py-1 rounded-full mb-1">
                  Protocol admin
                </div>
                <h1 className="text-[28px] md:text-[32px] font-medium leading-snug">
                  Welcome back, <span className="text-green-400">Admin</span>
                </h1>
                <p className="text-white/40 text-[14px] mt-1 max-w-md">
                  Manage farmers, lenders, and protocol activity from the admin dashboard.
                </p>
              </>
            ) : lender ? (
              <>
                <div className={`border text-xs px-3 py-1 rounded-full mb-1 ${
                  lender.isActive
                    ? 'border-green-400/30 text-green-400'
                    : 'border-amber-400/30 text-amber-400'
                }`}>
                  {lender.isActive ? 'Active lender' : 'Lender — pending approval'}
                </div>
                <h1 className="text-[28px] md:text-[32px] font-medium leading-snug">
                  Welcome back, <span className="text-green-400">{lender.name}</span>
                </h1>
                <p className="text-white/40 text-[14px] mt-1 max-w-md">
                  {lender.isActive
                    ? 'Your lending profile is live on the loan marketplace.'
                    : 'Your registration is awaiting admin approval before you can deploy capital.'}
                </p>
              </>
            ) : farmer ? (
              <>
                <div className="border border-green-400/30 text-green-400 text-xs px-3 py-1 rounded-full mb-1">
                  Verified farmer
                </div>
                <h1 className="text-[28px] md:text-[32px] font-medium leading-snug">
                  Welcome back, <span className="text-green-400">{farmer.fullName}</span>
                </h1>
                <div className="flex items-center gap-3 mt-1 text-white/40 text-[13px]">
                  <span className="flex items-center gap-1">
                    <Sprout size={12} className="text-green-400/60" />
                    {farmer.cropType}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-white/30" />
                    {farmer.district}
                  </span>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-[28px] md:text-[32px] font-medium leading-snug">
                  Welcome to <span className="text-green-400">AIM Protocol</span>
                </h1>
                <p className="text-white/40 text-[14px] mt-1 max-w-md">
                  You don't have a Farmer ID yet. Create one to get started, or register as a lender.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-[44px] md:text-[56px] font-medium leading-[1.05] tracking-tight max-w-2xl">
              Financial infrastructure for
              <br />
              <span className="text-green-400">African farmers</span>
            </h1>
            <p className="text-white/55 max-w-md text-[16px] leading-relaxed">
              On-chain identity and credit history power crop-backed lending —
              no bank account or paperwork required.
            </p>
            <p className="text-white/35 max-w-sm text-[12px] leading-relaxed">
              Devnet build. Loan records are on-chain and permanent — no real
              funds are held or transferred yet.
            </p>
          </>
        )}

        {/* Action buttons */}
        <div className="pt-1 w-full flex flex-col items-center gap-4">
          {connected ? (
            <>
              {isAdmin && (
                <div className="flex flex-wrap gap-2.5 justify-center">
                  <button onClick={() => onNavigate('admin')}
                    className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-1.5 transition">
                    <LayoutDashboard size={15} /> Admin dashboard
                  </button>
                  <button onClick={() => onNavigate('marketplace')}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-5 py-2 rounded-lg transition flex items-center gap-1.5">
                    <Store size={15} /> Marketplace
                  </button>
                  <button onClick={() => onNavigate('farmerprofile')}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-5 py-2 rounded-lg transition flex items-center gap-1.5">
                    <Search size={15} /> Lookup farmer
                  </button>
                </div>
              )}

              {lender && (
                <div className="flex flex-wrap gap-2.5 justify-center">
                  <button onClick={() => onNavigate('dashboard')}
                    className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-1.5 transition">
                    <LayoutDashboard size={15} /> My dashboard
                  </button>
                  <button onClick={() => onNavigate('marketplace')}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-5 py-2 rounded-lg transition flex items-center gap-1.5">
                    <Store size={15} /> Marketplace
                  </button>
                </div>
              )}

              {farmer && (
                <div className="flex flex-wrap gap-2.5 justify-center">
                  <button onClick={() => onNavigate('dashboard')}
                    className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-1.5 transition">
                    <LayoutDashboard size={15} /> My dashboard
                  </button>
                  <button onClick={() => onNavigate('microloan')}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-5 py-2 rounded-lg transition flex items-center gap-1.5">
                    <Coins size={15} /> Request loan
                  </button>
                  <button onClick={() => onNavigate('repayeloan')}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-5 py-2 rounded-lg transition flex items-center gap-1.5">
                    <ArrowRight size={15} /> Repay loan
                  </button>
                  <button onClick={() => onNavigate('marketplace')}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-5 py-2 rounded-lg transition flex items-center gap-1.5">
                    <Store size={15} /> Marketplace
                  </button>
                  <button onClick={() => onNavigate('farmerprofile')}
                    className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-5 py-2 rounded-lg transition flex items-center gap-1.5">
                    <Search size={15} /> Lookup farmer
                  </button>
                </div>
              )}

              {showRoleChoice && (
                <div className="w-full flex flex-col items-center gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    <button onClick={() => onNavigate('farmerid')}
                      className="text-left border border-white/10 hover:bg-white/[0.04] rounded-lg p-5 flex flex-col gap-2.5 transition">
                      <UserCheck size={18} className="text-white/40" />
                      <div>
                        <p className="text-[14px] font-medium mb-0.5">Create Farmer ID</p>
                        <p className="text-white/45 text-[13px] leading-relaxed">
                          Register your on-chain identity and request a crop-backed loan.
                        </p>
                      </div>
                    </button>
                    <button onClick={() => onNavigate('lenderregistration')}
                      className="text-left border border-white/10 hover:bg-white/[0.04] rounded-lg p-5 flex flex-col gap-2.5 transition">
                      <Building2 size={18} className="text-white/40" />
                      <div>
                        <p className="text-[14px] font-medium mb-0.5">Register as lender</p>
                        <p className="text-white/45 text-[13px] leading-relaxed">
                          Apply to deploy capital and issue loans, subject to admin approval.
                        </p>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-5 text-[13px]">
                    <button onClick={() => onNavigate('marketplace')}
                      className="text-white/40 hover:text-white/70 transition flex items-center gap-1.5">
                      <Store size={13} /> Marketplace
                    </button>
                    <button onClick={() => onNavigate('farmerprofile')}
                      className="text-white/40 hover:text-white/70 transition flex items-center gap-1.5">
                      <Search size={13} /> Lookup farmer
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                <div className="text-left border border-white/10 rounded-lg p-6">
                  <Sprout size={20} className="text-white/40" />
                  <p className="text-[16px] font-medium mt-3.5 mb-1.5">For farmers</p>
                  <p className="text-white/45 text-[13px] mb-4.5 leading-relaxed">
                    Open registration. Connect a wallet and request a loan in one session.
                  </p>
                  <button onClick={() => onNavigate('farmerid')}
                    className="w-full bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 rounded-lg transition">
                    Get started
                  </button>
                </div>
                <div className="text-left border border-white/10 rounded-lg p-6">
                  <Building2 size={20} className="text-white/40" />
                  <p className="text-[16px] font-medium mt-3.5 mb-1.5">For lenders</p>
                  <p className="text-white/45 text-[13px] mb-4.5 leading-relaxed">
                    Register terms and capital, subject to admin approval.
                  </p>
                  <button onClick={() => onNavigate('lenderregistration')}
                    className="w-full bg-transparent border border-white/20 hover:bg-white/[0.06] text-white text-sm font-medium py-2 rounded-lg transition">
                    Apply as a lender
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-5 text-[13px]">
                <button onClick={() => onNavigate('marketplace')}
                  className="text-white/40 hover:text-white/70 transition flex items-center gap-1.5">
                  <Store size={13} /> Browse marketplace
                </button>
                <button onClick={() => onNavigate('farmerprofile')}
                  className="text-white/40 hover:text-white/70 transition flex items-center gap-1.5">
                  <Search size={13} /> Lookup farmer
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST STRIP + SECURITY — hidden when connected ── */}
      {!connected && (
        <>
          <section className="pt-10 border-t border-white/[0.07]">
            <TrustStrip />
          </section>

          <section className="pt-10 border-t border-white/[0.07] flex flex-col items-center">
            <ShieldCheck size={20} className="text-white/40" />
            <p className="text-[14px] font-medium mt-3 mb-1.5">Pre-audit, source available</p>
            <p className="text-white/45 text-[12px] leading-relaxed max-w-md text-center">
              One wallet, one identity — enforced on-chain. Contract source{' '}
              <a href="https://github.com/amjadkamara/aim-program" target="_blank" rel="noreferrer"
                className="text-white/60 hover:text-green-400 underline transition">
                available on GitHub
              </a>.
            </p>
          </section>

          {/* How it works */}
{/* How it works */}
<section className="pt-10 pb-20 border-t border-white/[0.07]">
  <p className="text-white/35 text-xs text-center uppercase tracking-widest mb-2">How it works</p>
  <h2 className="text-xl md:text-[24px] font-medium text-center mb-12">From wallet to working capital</h2>
  <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-start gap-10 md:gap-0">
    {[
      { n: '01', title: 'Connect a wallet', desc: 'Your wallet is your identity. No signup, no password.' },
      { n: '02', title: 'Register your Farmer ID', desc: 'Crop, district, farm size — minted on-chain in one step.' },
      { n: '03', title: 'Request a loan', desc: 'Pick a lender, borrow within their terms, build credit as you repay.' },
    ].map((item, i, arr) => (
      <>
        <div key={item.n} className="flex-1 flex flex-col items-start gap-2.5">
          <span className="text-green-400/70 text-[13px] font-mono tracking-widest">{item.n}</span>
          <p className="text-[16px] font-medium">{item.title}</p>
          <p className="text-white/50 text-[14px] leading-relaxed">{item.desc}</p>
        </div>
        {i < arr.length - 1 && (
          <div className="hidden md:flex items-center justify-center px-3 pt-1.5 shrink-0">
            <ArrowRight size={15} strokeWidth={1.5} className="text-white/15" />
          </div>
        )}
      </>
    ))}
  </div>
</section>

{/* Closing CTA */}
<section className="pt-16 pb-24 border-t border-white/[0.07] flex flex-col items-center text-center gap-4">
  <h3 className="text-[20px] md:text-[22px] font-medium">Ready to get started?</h3>
  <p className="text-white/45 text-[14px] max-w-sm">
    Connect a wallet and register your Farmer ID — it takes under a minute.
  </p>
  <button onClick={() => onNavigate('farmerid')}
    className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition">
    Get started
  </button>
</section>
        </>
      )}

    </div>
  )
}

function App() {
  const [page, setPage] = useState('home')

  return (
    <Layout onNavigate={setPage}>
      {page === 'home' && <Home onNavigate={setPage} />}
      {page === 'farmerid' && (
        <FarmerID
          onBack={() => setPage('home')}
          onSuccess={() => setPage('dashboard')}
        />
      )}
      {page === 'microloan' && (
        <Microloan
          onBack={() => setPage('home')}
          onViewLoan={() => setPage('repayeloan')}
        />
      )}
      {page === 'repayeloan' && (
        <RepayLoan
          onBack={() => setPage('home')}
          onRepaid={() => setPage('dashboard')}
        />
      )}
      {page === 'dashboard' && (
        <Dashboard
          onBack={() => setPage('home')}
          onRequestLoan={() => setPage('microloan')}
          onRepayLoan={() => setPage('repayeloan')}
          onViewHistory={() => setPage('loanhistory')}
          onMarketplace={() => setPage('marketplace')}
        />
      )}
      {page === 'loanhistory' && (
        <LoanHistory onBack={() => setPage('dashboard')} />
      )}
      {page === 'farmerprofile' && (
        <FarmerProfile onBack={() => setPage('home')} />
      )}
      {page === 'marketplace' && (
        <LoanMarketplace onBack={() => setPage('home')} />
      )}
      {page === 'lenderregistration' && (
        <LenderRegistration onBack={() => setPage('home')} />
      )}
      {page === 'admin' && (
        <AdminDashboard onBack={() => setPage('home')} />
      )}
    </Layout>
  )
}

export default App
