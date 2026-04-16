import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import '@solana/wallet-adapter-react-ui/styles.css'
import { Sprout, ShieldCheck, Coins, ArrowRight } from 'lucide-react'

function App() {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sprout className="text-green-400" size={28} />
          <span className="text-xl font-bold tracking-tight">AIM Protocol</span>
        </div>
        <WalletMultiButton />
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 gap-6">
        <div className="bg-green-400/10 text-green-400 text-sm font-medium px-4 py-1 rounded-full border border-green-400/30">
          Built on Solana • Sierra Leone 🇸🇱
        </div>
        <h1 className="text-5xl font-bold leading-tight max-w-3xl">
          Financial Access for <span className="text-green-400">African Farmers</span>
        </h1>
        <p className="text-white/60 max-w-xl text-lg">
          Connect a wallet, mint a verifiable farmer ID, and receive a simulated crop-backed microloan. No bank. No paperwork. Just access.
        </p>
        {connected ? (
          <div className="flex gap-4 mt-4">
            <button className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition">
              Create Farmer ID <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <WalletMultiButton />
            <p className="text-white/40 text-sm mt-3">Connect your Phantom wallet to get started</p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-24 max-w-5xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-3">
          <ShieldCheck className="text-green-400" size={32} />
          <h3 className="font-semibold text-lg">On-Chain Identity</h3>
          <p className="text-white/50 text-sm">Mint a verifiable farmer ID stored permanently on the Solana blockchain.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-3">
          <Coins className="text-yellow-400" size={32} />
          <h3 className="font-semibold text-lg">Crop-Backed Microloans</h3>
          <p className="text-white/50 text-sm">Request financing against your declared crop type and expected harvest yield.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col gap-3">
          <Sprout className="text-blue-400" size={32} />
          <h3 className="font-semibold text-lg">No Bank Required</h3>
          <p className="text-white/50 text-sm">All you need is a Solana wallet. Built for farmers across Sierra Leone and Africa.</p>
        </div>
      </section>

    </div>
  )
}

export default App