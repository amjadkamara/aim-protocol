import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import {
  Coins, Sprout, ArrowRight, Wallet,
  UserCheck, CreditCard, LayoutDashboard, Search,
  MapPin, Loader2, Store, Building2
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

// Must match ADMIN_PUBKEY in lib.rs and AdminDashboard.jsx
const ADMIN_WALLETS = ['Cz3GvsRaBsuAHoRiJd5sV6ZTAkE8TsFJAyuYWEtV7Qu2']
const PROGRAM_ID = 'AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB'

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
      <section className="flex flex-col items-center text-center pt-14 pb-10 gap-5">

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
            <h1 className="text-[28px] md:text-[34px] font-medium leading-snug max-w-lg">
              Financial infrastructure for
              <br />
              <span className="text-green-400">African farmers</span>
            </h1>
            <p className="text-white/50 max-w-md text-[15px] leading-relaxed">
              On-chain identity and credit history power crop-backed lending —
              no bank account or paperwork required.
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
                      className="text-left border border-white/10 hover:bg-white/[0.04] rounded-xl p-5 flex flex-col gap-2.5 transition">
                      <UserCheck size={18} className="text-white/50" />
                      <div>
                        <p className="text-[14px] font-medium mb-0.5">Create Farmer ID</p>
                        <p className="text-white/45 text-[13px] leading-relaxed">
                          Register your on-chain identity and request a crop-backed loan.
                        </p>
                      </div>
                    </button>
                    <button onClick={() => onNavigate('lenderregistration')}
                      className="text-left border border-white/10 hover:bg-white/[0.04] rounded-xl p-5 flex flex-col gap-2.5 transition">
                      <Building2 size={18} className="text-white/50" />
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
            <div className="flex flex-wrap gap-2.5 justify-center">
              <button onClick={() => onNavigate('farmerid')}
                className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition">
                I'm a farmer
              </button>
              <button onClick={() => onNavigate('lenderregistration')}
                className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-5 py-2 rounded-lg transition">
                I'm a lender
              </button>
            </div>
          )}

          {!connected && (
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
          )}
        </div>
      </section>

      {/* ── MARKETING SECTIONS — hidden when connected ── */}
      {!connected && (
        <>
          {/* How it works */}
          <section className="pt-8 border-t border-white/[0.07]">
            <p className="text-white/35 text-xs text-center uppercase tracking-widest mb-1.5">How it works</p>
            <h2 className="text-xl md:text-[22px] font-medium text-center mb-7">Three steps, on-chain</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: <Wallet size={19} />,     title: "Connect wallet",   desc: "Your wallet becomes your on-chain identity." },
                { icon: <UserCheck size={19} />,  title: "Create Farmer ID", desc: "Mint a verifiable farmer profile on Solana." },
                { icon: <CreditCard size={19} />, title: "Access credit",    desc: "Request crop-backed microloans instantly." },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.03] rounded-xl p-5">
                  <div className="text-green-400 mb-3">{item.icon}</div>
                  <p className="text-[14px] font-medium mb-1">{item.title}</p>
                  <p className="text-white/45 text-[13px] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* For farmers / For lenders split */}
          <section className="pb-14">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-white/10 rounded-xl p-6">
                <Sprout size={20} className="text-white/50" />
                <p className="text-[15px] font-medium mt-3 mb-1.5">For farmers</p>
                <p className="text-white/45 text-[13px] mb-4 leading-relaxed">
                  Open, permissionless registration. Connect a wallet, register your identity, and
                  request a loan — no bank account or paperwork required.
                </p>
                <button onClick={() => onNavigate('farmerid')}
                  className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-4 py-1.5 rounded-lg transition">
                  Get started
                </button>
              </div>
              <div className="border border-white/10 rounded-xl p-6">
                <Building2 size={20} className="text-white/50" />
                <p className="text-[15px] font-medium mt-3 mb-1.5">For lenders</p>
                <p className="text-white/45 text-[13px] mb-4 leading-relaxed">
                  NGOs, cooperatives, and MFIs register terms and capital, subject to admin
                  approval before appearing on the marketplace.
                </p>
                <button onClick={() => onNavigate('lenderregistration')}
                  className="bg-white/[0.06] hover:bg-white/[0.10] text-sm px-4 py-1.5 rounded-lg transition">
                  Apply as a lender
                </button>
              </div>
            </div>
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
