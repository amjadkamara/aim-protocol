import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import WalletStatus from './WalletStatus'

export default function Layout({ children, onNavigate = () => {} }) {
  return (
    <div className="min-h-screen text-white flex flex-col bg-[#0a0f1e]">
      {/* Wallet-adapter ships its own button styling (defaults to violet) —
          override here so it matches the single green accent used everywhere
          else, instead of leaving a second, inconsistent brand color. */}
      <style>{`
        .wallet-adapter-button {
          background-color: #16a34a !important;
          color: #0a0f1e !important;
          border-radius: 6px !important;
          font-weight: 500 !important;
        }
        .wallet-adapter-button:not([disabled]):hover {
          background-color: #22c55e !important;
        }
        .wallet-adapter-button-trigger {
          background-color: #16a34a !important;
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/[0.08] sticky top-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-3">
          <img src="/aim-protocol-logo.png" className="w-8 h-8 rounded-lg" alt="AIM Protocol" />
          <span className="text-base font-semibold tracking-tight">AIM Protocol</span>
        </button>

        <div className="hidden md:flex items-center gap-7">
          <button onClick={() => onNavigate('home')}
            className="text-[13px] text-white/50 hover:text-white/80 transition">
            Protocol
          </button>
          <button onClick={() => onNavigate('farmerid')}
            className="text-[13px] text-white/50 hover:text-white/80 transition">
            For farmers
          </button>
          <button onClick={() => onNavigate('lenderregistration')}
            className="text-[13px] text-white/50 hover:text-white/80 transition">
            For lenders
          </button>
          <a href="https://github.com/amjadkamara/aim-protocol#readme"
            target="_blank" rel="noreferrer"
            className="text-[13px] text-white/50 hover:text-white/80 transition">
            Docs
          </a>
        </div>

        <div className="flex items-center gap-3">
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
            <span>AIM Protocol — Aadios Systems (SL) Ltd, Freetown</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/amjadkamara/aim-protocol#readme" target="_blank" rel="noreferrer"
              className="hover:text-white/60 transition">
              Docs
            </a>
            <a href="https://explorer.solana.com/address/AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB?cluster=devnet" target="_blank" rel="noreferrer"
              className="hover:text-white/60 transition">
              Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
