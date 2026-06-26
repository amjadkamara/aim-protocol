import { Buffer } from 'buffer'
globalThis.Buffer = Buffer
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { clusterApiUrl } from '@solana/web3.js'
import './index.css'
import App from './App.jsx'

// Use a dedicated RPC provider (e.g. Helius) to avoid the public devnet
// endpoint's aggressive rate limiting, which causes 429 errors on
// getProgramAccounts calls (used by AdminDashboard to list all farmers/lenders).
// Falls back to the public endpoint if no env var is set, so local dev
// without a key doesn't crash — but expect 429s on Admin pages until set.
const endpoint = import.meta.env.VITE_RPC_ENDPOINT || clusterApiUrl('devnet')

const wallets = [new PhantomWalletAdapter()]
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>,
)