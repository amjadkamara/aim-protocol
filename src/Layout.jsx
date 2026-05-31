import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ExternalLink } from 'lucide-react'
import WalletStatus from './WalletStatus'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen text-white flex flex-col relative bg-[#0a0f1e]">
      {/* BACKGROUND MESH */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[160px] top-[-300px] left-[-200px]" />
        <div className="absolute w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[160px] bottom-[-200px] right-[-100px]" />
      </div>

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/[0.08] sticky top-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src="/aim-protocol-logo.png" className="w-8 h-8 rounded-lg" alt="AIM Protocol" />
          <span className="text-base font-semibold tracking-tight">AIM Protocol</span>
        </div>
        <div className="flex items-center gap-3">
          
           <a href="https://github.com/amjadkamara/aim-protocol"
            target="_blank"
            rel="noreferrer"
            className="text-white/30 hover:text-white/70 transition p-1.5"
          >
            <ExternalLink size={17} />
          </a>
          <WalletMultiButton />
        </div>
      </nav>

      {/* WALLET STATUS BANNER */}
      <WalletStatus />

      {/* CONTENT */}
      <main className="flex-1 w-full flex flex-col items-center">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.07] px-6 md:px-10 py-8">
        <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4 text-white/30 text-xs">
          <div className="flex items-center gap-2">
            <img src="/aim-protocol-logo.png" className="w-5 h-5 rounded opacity-50" alt="" />
            <span>AIM Protocol — Agri · Identity · Microfinance</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/amjadkamara/aim-protocol" target="_blank" rel="noreferrer"
              className="hover:text-white/60 transition flex items-center gap-1">
              <ExternalLink size={12} /> Frontend Repo
            </a>
            <a href="https://github.com/amjadkamara/aim-program" target="_blank" rel="noreferrer"
              className="hover:text-white/60 transition flex items-center gap-1">
              <ExternalLink size={12} /> Smart Contract Repo
            </a>
            <a href="https://explorer.solana.com/address/AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB?cluster=devnet" target="_blank" rel="noreferrer"
              className="hover:text-white/60 transition flex items-center gap-1">
              <ExternalLink size={12} /> Program ID
            </a>
          </div>
          <div className="text-white/20">
            Solana Frontier Hackathon 2026 · Built from Sierra Leone 🇸🇱
          </div>
        </div>
      </footer>
    </div>
  )
}