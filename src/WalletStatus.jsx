import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AlertTriangle, Droplets, X } from 'lucide-react'

const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'
const LOW_SOL_THRESHOLD = 0.05

export default function WalletStatus() {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()

  const [isDevnet, setIsDevnet] = useState(true)
  const [balance, setBalance] = useState(null)
  const [dismissed, setDismissed] = useState({})

  useEffect(() => {
    if (!connected) return

    // Check network by verifying genesis block hash
    connection.getGenesisHash().then((hash) => {
      setIsDevnet(hash === DEVNET_GENESIS)
    }).catch(() => setIsDevnet(true))

    // Check SOL balance
    if (publicKey) {
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / 1_000_000_000)
      }).catch(() => setBalance(null))
    }
  }, [connected, publicKey, connection])

  if (!connected) return null

  const wrongNetwork = !isDevnet
  const lowBalance = balance !== null && balance < LOW_SOL_THRESHOLD

  if (!wrongNetwork && !lowBalance) return null

  return (
    <div className="w-full flex flex-col gap-1 px-4 pt-2">

      {/* Wrong network warning */}
      {wrongNetwork && !dismissed.network && (
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="flex-1">
            Your wallet is on the wrong network. Switch to <strong>Devnet</strong> in Phantom:
            Settings → Developer Settings → Change Network → Devnet.
          </span>
          <button
            onClick={() => setDismissed(d => ({ ...d, network: true }))}
            className="shrink-0 hover:text-red-300 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Low balance warning */}
      {!wrongNetwork && lowBalance && !dismissed.balance && (
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-400">
          <Droplets size={16} className="shrink-0" />
          <span className="flex-1">
            Low SOL balance ({balance.toFixed(4)} SOL). You need devnet SOL to use AIM Protocol.{' '}
            
              <a href="https://faucet.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-yellow-300 transition"
            >
              Get free devnet SOL →
            </a>
          </span>
          <button
            onClick={() => setDismissed(d => ({ ...d, balance: true }))}
            className="shrink-0 hover:text-yellow-300 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  )
}