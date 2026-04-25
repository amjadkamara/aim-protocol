import { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import '@solana/wallet-adapter-react-ui/styles.css'
import { ShieldCheck, Coins, Sprout, ArrowRight, ExternalLink } from 'lucide-react'
import FarmerID from './FarmerID'
import Microloan from './Microloan'

function App() {
  const { connected } = useWallet()
  const [page, setPage] = useState('home')
  const [farmerPublicKey, setFarmerPublicKey] = useState('')

  if (page === 'farmerid') return <FarmerID onBack={() => setPage('home')} onSuccess={(pubkey) => { setFarmerPublicKey(pubkey) }} />
  if (page === 'microloan') return <Microloan onBack={() => setPage('home')} farmerPublicKey={farmerPublicKey} />

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/aim-protocol-logo.png" alt="AIM Protocol" className="w-10 h-10 rounded-lg" />
          <span className="text-xl font-bold tracking-tight">AIM Protocol</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/amjadkamara/aim-protocol" target="_blank" rel="noopener noreferrer"
            className="text-white/40 hover:text-white transition">
            <ExternalLink size={20} />
          </a>
          <WalletMultiButton />
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 gap-6">
        <div className="bg-green-400/10 text-green-400 text-sm font-medium px-4 py-1 rounded-full border border-green-400/30">
          Built on Solana • Sierra Leone 🇸🇱
        </div>
        <h1 className="text-5xl font-bold leading-tight max-w-3xl">
          Financial Access for <span className="text-green-400">African Farmers</span>
        </h1>
        <p className="text-white/60 max-w-xl text-lg">
          Connect a wallet, mint a verifiable on-chain farmer ID, and receive a crop-backed microloan. No bank. No paperwork. Just access.
        </p>
        {connected ? (
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <button onClick={() => setPage('farmerid')}
              className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition">
              Create Farmer ID <ArrowRight size={18} />
            </button>
            <button onClick={() => setPage('microloan')}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition">
              Request Microloan <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mt-4">
            <WalletMultiButton />
            <p className="text-white/40 text-sm mb-8">Connect your Phantom wallet to get started</p>
          </div>
        )}
      </section>

      {/* Stats Bar */}
      <section className="flex flex-wrap justify-center gap-8 px-8 py-8 border-y border-white/10 bg-white/5 mt-6 mb-6">
        <div className="text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Network</p>
          <p className="text-green-400 font-semibold text-sm">Solana Devnet</p>
        </div>
        <div className="w-px bg-white/10 hidden md:block" />
        <div className="text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Smart Contract</p>
          <p className="text-white font-semibold text-sm">Anchor Framework</p>
        </div>
        <div className="w-px bg-white/10 hidden md:block" />
        <div className="text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Built In</p>
          <p className="text-white font-semibold text-sm">Sierra Leone 🇸🇱</p>
        </div>
        <div className="w-px bg-white/10 hidden md:block" />
        <div className="text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Hackathon</p>
          <p className="text-white font-semibold text-sm">Frontier 2026</p>
        </div>
      </section>

      {/* How it Works */}
      <section className="w-full py-20 px-8 flex flex-col items-center">
        <div className="max-w-4xl w-full flex flex-col items-center gap-12">
          <h2 className="text-3xl font-bold text-center">How It Works</h2>
          
          {/* Added justify-items-center to keep grid items centered */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full justify-items-center">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center gap-4 max-w-[280px]">
              <div className="w-14 h-14 rounded-full bg-green-400/20 border border-green-400/30 flex items-center justify-center text-green-400 font-bold text-xl shadow-lg shadow-green-400/10">1</div>
              <h3 className="font-bold text-lg">Connect Wallet</h3>
              <p className="text-white/50 text-sm leading-relaxed">Connect your Phantom wallet. Your wallet address becomes your identity on the blockchain.</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center gap-4 max-w-[280px]">
              <div className="w-14 h-14 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-bold text-xl shadow-lg shadow-yellow-400/10">2</div>
              <h3 className="font-bold text-lg">Register Farmer ID</h3>
              <p className="text-white/50 text-sm leading-relaxed">Mint a verifiable on-chain identity with your name, crop type, district and farm size.</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center gap-4 max-w-[280px]">
              <div className="w-14 h-14 rounded-full bg-blue-400/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold text-xl shadow-lg shadow-blue-400/10">3</div>
              <h3 className="font-bold text-lg">Get Microloan</h3>
              <p className="text-white/50 text-sm leading-relaxed">Request a crop-backed microloan disbursed directly on-chain. Verified on Solana Explorer.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Features - Fixed alignment here */}
      <section className="w-full px-8 py-16 pb-24 flex flex-col items-center">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Added items-center and text-center to these cards */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center gap-4 hover:bg-white/10 transition-colors">
            <ShieldCheck className="text-green-400" size={40} />
            <h3 className="font-bold text-xl">On-Chain Identity</h3>
            <p className="text-white/50 text-sm">Farmer ID stored permanently on Solana via Anchor smart contract. Your wallet is your credential.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center gap-4 hover:bg-white/10 transition-colors">
            <Coins className="text-yellow-400" size={40} />
            <h3 className="font-bold text-xl">Crop-Backed Microloans</h3>
            <p className="text-white/50 text-sm">Request financing against your declared crop type. Loan eligibility enforced on-chain — no ID, no loan.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center gap-4 hover:bg-white/10 transition-colors">
            <Sprout className="text-blue-400" size={40} />
            <h3 className="font-bold text-xl">No Bank Required</h3>
            <p className="text-white/50 text-sm">All you need is a Solana wallet. Built for farmers across Sierra Leone and Africa.</p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 px-8 py-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 items-center text-center">
          <div className="flex items-center gap-2 text-white/50">
            <img src="/aim-protocol-logo.png" alt="AIM Protocol" className="w-6 h-6 rounded" />
            <span className="text-sm font-medium">AIM Protocol — Agri • Identity • Microfinance</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-white/30 text-sm">
            <a href="https://github.com/amjadkamara/aim-protocol" target="_blank" rel="noopener noreferrer"
              className="hover:text-white transition flex items-center gap-1">
              <ExternalLink size={14} /> Frontend Repo
            </a>
            <a href="https://github.com/amjadkamara/aim-program" target="_blank" rel="noopener noreferrer"
              className="hover:text-white transition flex items-center gap-1">
              <ExternalLink size={14} /> Smart Contract Repo
            </a>
            <a href="https://explorer.solana.com/address/AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB?cluster=devnet" target="_blank" rel="noopener noreferrer"
              className="hover:text-white transition flex items-center gap-1">
              <ExternalLink size={14} /> Program ID on Explorer
            </a>
          </div>
          <p className="text-white/20 text-xs">Solana Frontier Hackathon 2026 • Built from Sierra Leone 🇸🇱</p>
        </div>
      </footer>

    </div>
  )
}

export default App