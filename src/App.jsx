import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import { ShieldCheck, Coins, Sprout, ArrowRight, Wallet, UserCheck, CreditCard, LayoutDashboard } from 'lucide-react'
import Layout from './Layout'
import FarmerID from './FarmerID'
import Microloan from './Microloan'
import RepayLoan from './RepayLoan'
import Dashboard from './Dashboard'

function Home({ onNavigate }) {
  const { connected } = useWallet()

  return (
    <div className="w-full max-w-4xl px-6 md:px-10 flex flex-col gap-16">

      {/* HERO */}
      <section className="flex flex-col items-center text-center py-16 gap-6 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-violet-500/20 via-violet-500/5 to-transparent rounded-3xl pointer-events-none" />
        <div className="bg-green-400/10 text-green-400 text-xs md:text-sm px-4 py-1.5 rounded-full border border-green-400/30 tracking-wide">
          Built on Solana • Sierra Leone 🇸🇱
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-3xl">
          Financial Access for
          <br />
          <span className="text-green-400">African Farmers</span>
        </h1>
        <p className="text-white/60 max-w-lg text-base md:text-lg leading-relaxed">
          Connect a wallet, mint a verifiable on-chain farmer ID, and receive a crop-backed microloan.
        </p>
        <div className="pt-2">
          {connected ? (
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap justify-center">
              <button onClick={() => onNavigate('dashboard')}
                className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition">
                <LayoutDashboard size={16} /> My Dashboard
              </button>
              <button onClick={() => onNavigate('farmerid')}
                className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl transition flex items-center justify-center gap-2">
                <ShieldCheck size={16} /> Create Farmer ID
              </button>
              <button onClick={() => onNavigate('microloan')}
                className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl transition">
                Request Loan
              </button>
              <button onClick={() => onNavigate('repayeloan')}
                className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl transition">
                Repay Loan
              </button>
            </div>
          ) : (
            <WalletMultiButton />
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 w-full border border-white/[0.08] rounded-2xl bg-white/[0.03] px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'NETWORK',        value: 'Solana Devnet',    color: 'text-green-400' },
            { label: 'SMART CONTRACT', value: 'Anchor Framework', color: 'text-white/60' },
            { label: 'BUILT IN',       value: 'Sierra Leone 🇸🇱', color: 'text-white/60' },
            { label: 'HACKATHON',      value: 'Frontier 2026',    color: 'text-yellow-400' },
          ].map((tag, i) => (
            <div key={i} className="flex flex-col items-center gap-1 text-center">
              <span className="text-white/30 text-[10px] uppercase tracking-widest">{tag.label}</span>
              <span className={`text-sm font-medium ${tag.color}`}>{tag.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{paddingTop: '30px', paddingBottom: '15px', borderTop: '1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex flex-col items-center text-center" style={{marginBottom: '32px'}}>
          <h2 className="text-2xl md:text-3xl font-semibold">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", color: "green",  icon: <Wallet size={20} />,    title: "Connect Wallet",   desc: "Your wallet becomes your on-chain identity." },
            { step: "2", color: "blue",   icon: <UserCheck size={20} />, title: "Create Farmer ID", desc: "Mint a verifiable farmer profile on Solana." },
            { step: "3", color: "violet", icon: <CreditCard size={20} />,title: "Access Credit",    desc: "Request crop-backed microloans instantly." },
          ].map((item, i) => {
            const c = {
              green:  { ring: 'border-green-400',  numBg: 'bg-green-500/20',  text: 'text-green-400' },
              blue:   { ring: 'border-blue-400',   numBg: 'bg-blue-500/20',   text: 'text-blue-400' },
              violet: { ring: 'border-violet-400', numBg: 'bg-violet-500/20', text: 'text-violet-400' },
            }[item.color]
            return (
              <div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex items-start gap-4 hover:bg-white/[0.07] transition">
                <div className={`shrink-0 w-12 h-12 rounded-full ${c.numBg} border ${c.ring} flex items-center justify-center text-lg font-bold ${c.text}`}>
                  {item.step}
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{paddingTop: '30px', paddingBottom: '0px', borderTop: '1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex flex-col items-center text-center" style={{marginBottom: '32px'}}>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Why AIM Protocol</p>
          <h2 className="text-2xl md:text-3xl font-semibold">Built for the field</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <ShieldCheck size={22} />, accent: 'green',  title: "On-Chain Identity",    desc: "Permanent farmer identity secured on Solana. Yours forever." },
            { icon: <Coins size={22} />,       accent: 'yellow', title: "Crop-Backed Loans",    desc: "Access capital backed by your agricultural output, no credit history needed." },
            { icon: <Sprout size={22} />,      accent: 'blue',   title: "No Banks",             desc: "Fully decentralized. Just a wallet is enough to participate." },
          ].map((item, i) => {
            const a = {
              green:  { icon: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/20',  top: 'from-green-500' },
              yellow: { icon: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/20', top: 'from-yellow-500' },
              blue:   { icon: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/20',   top: 'from-blue-500' },
            }[item.accent]
            return (
              <div key={i} className={`relative bg-white/[0.04] border ${a.border} rounded-2xl p-6 flex items-start gap-4 hover:bg-white/[0.07] transition`}>
                <div className={`absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r ${a.top} to-transparent opacity-50`} />
                <div className={`shrink-0 w-12 h-12 rounded-xl ${a.bg} flex items-center justify-center ${a.icon}`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{paddingBottom: '96px'}}>
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-white/[0.04] px-8 md:px-14 py-14 text-center">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-500/10 via-transparent to-violet-500/10 pointer-events-none" />
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-green-400/40 to-transparent" />
          <div className="mb-2 text-green-400 flex justify-center">
            <Sprout size={28} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Start building your financial identity today
          </h2>
          <p className="text-white/50 text-sm md:text-base mb-8 w-full text-center leading-relaxed">
            Join the next generation of decentralized agriculture finance.
          </p>
          {connected ? (
            <button onClick={() => onNavigate('dashboard')}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-10 py-3.5 rounded-xl transition">
              Go to Dashboard →
            </button>
          ) : (
            <WalletMultiButton />
          )}
        </div>
      </section>

    </div>
  )
}

function App() {
  const [page, setPage] = useState('home')

  return (
    <Layout>
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
        />
      )}
    </Layout>
  )
}

export default App