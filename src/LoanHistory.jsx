import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useAimProgram, getLoanPDA } from './useAimProgram'
import { Coins, Loader2, AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

const PROGRAM_ID = 'AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB'

function StatusBadge({ status }) {
  if (status === 'repaid') return (
    <span className="bg-green-400/20 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-400/30">
      ✓ REPAID
    </span>
  )
  if (status === 'overdue') return (
    <span className="bg-red-400/20 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-400/30">
      ⚠ OVERDUE
    </span>
  )
  return (
    <span className="bg-yellow-400/20 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-yellow-400/30">
      ● ACTIVE
    </span>
  )
}

export default function LoanHistory({ onBack }) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const { fetchLoan } = useAimProgram()

  const [history, setHistory] = useState([])
  const [activeLoan, setActiveLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!publicKey) return
    loadHistory()
  }, [publicKey])

  const loadHistory = async () => {
    setLoading(true)
    setError('')

    try {
      // Get current active loan if any
      const current = await fetchLoan()
      if (current && !current.isRepaid) setActiveLoan(current)

      // Get loan PDA address
      const loanPDA = getLoanPDA(publicKey)

      // Fetch all signatures for the loan PDA
      const signatures = await connection.getSignaturesForAddress(loanPDA, {
        limit: 50,
      })

      if (signatures.length === 0) {
        setHistory([])
        setLoading(false)
        return
      }

      // Fetch transaction details
      const txs = await Promise.all(
        signatures.map(sig =>
          connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed',
          }).catch(() => null)
        )
      )

      // Parse transactions into loan records
      const records = []

      for (let i = 0; i < txs.length; i++) {
        const tx = txs[i]
        const sig = signatures[i]
        if (!tx) continue

        const logs = tx.meta?.logMessages || []
        const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000) : null

        // Detect instruction type from logs
        const isRequest = logs.some(l => l.includes('Instruction: RequestLoan'))
        const isRepay = logs.some(l => l.includes('Instruction: RepayLoan'))

        if (isRequest) {
          // Extract amount from account changes
          const preBalances = tx.meta?.preBalances || []
          const postBalances = tx.meta?.postBalances || []
          const accountKeys = tx.transaction?.message?.accountKeys || []

          // Find loan PDA index
          const loanIndex = accountKeys.findIndex(
            k => k.pubkey?.toString() === loanPDA.toString()
          )

          const lamports = loanIndex >= 0
            ? Math.abs(postBalances[loanIndex] - preBalances[loanIndex])
            : 0

          records.push({
            type: 'request',
            signature: sig.signature,
            timestamp,
            lamports,
            logs,
          })
        }

        if (isRepay) {
          records.push({
            type: 'repay',
            signature: sig.signature,
            timestamp,
          })
        }
      }

      // Pair requests with repayments to build loan history
      const loans = []
      let repayIndex = 0

      const requests = records.filter(r => r.type === 'request').reverse()
      const repays = records.filter(r => r.type === 'repay').reverse()

      requests.forEach((req, i) => {
        const matchedRepay = repays[i] || null
        const solAmount = (req.lamports / 1_000_000_000).toFixed(3)

        let status = 'active'
        if (matchedRepay) status = 'repaid'

        loans.push({
          id: i + 1,
          requestSignature: req.signature,
          repaySignature: matchedRepay?.signature || null,
          requestDate: req.timestamp,
          repayDate: matchedRepay?.timestamp || null,
          solAmount,
          status,
        })
      })

      setHistory(loans.reverse())
    } catch (err) {
      setError('Could not load loan history. RPC rate limit may have been reached — try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  const totalBorrowed = history.reduce((sum, l) => sum + parseFloat(l.solAmount), 0)
  const totalRepaid = history.filter(l => l.status === 'repaid').length
  const totalLoans = history.length

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        <button onClick={onBack} className="text-white/40 hover:text-white text-sm mb-8 transition">
          ← Back
        </button>

        <div className="flex items-center gap-3 mb-1">
          <Coins className="text-yellow-400" size={28} />
          <h2 className="text-2xl font-bold">Loan History</h2>
        </div>
        <p className="text-white/40 text-sm mb-8">
          Your complete on-chain borrowing record.
        </p>

        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 size={32} className="animate-spin text-white/40" />
            <p className="text-white/40 text-sm">Fetching on-chain history...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-6">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats */}
            {totalLoans > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-white/40 text-xs mb-1">TOTAL LOANS</p>
                  <p className="text-xl font-bold">{totalLoans}</p>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-white/40 text-xs mb-1">REPAID</p>
                  <p className="text-xl font-bold text-green-400">{totalRepaid}</p>
                </div>
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-white/40 text-xs mb-1">BORROWED</p>
                  <p className="text-xl font-bold text-yellow-400">{totalBorrowed.toFixed(2)}</p>
                  <p className="text-white/30 text-xs">SOL</p>
                </div>
              </div>
            )}

            {/* No history */}
            {totalLoans === 0 && (
              <div className="flex flex-col items-center text-center py-12 gap-4">
                <Coins size={48} className="text-white/10" />
                <p className="text-white/40">No loan history found.</p>
                <p className="text-white/20 text-sm">Your borrowing record will appear here after your first loan.</p>
              </div>
            )}

            {/* Loan list */}
            <div className="flex flex-col gap-4">
              {history.map((loan) => (
                <div key={loan.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/40 text-xs">LOAN #{loan.id}</span>
                    <StatusBadge status={loan.status} />
                  </div>

                  <p className="text-yellow-400 text-2xl font-bold mb-3">
                    {loan.solAmount} SOL
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-white/40 text-xs mb-1">REQUESTED</p>
                      <p className="font-medium">
                        {loan.requestDate
                          ? loan.requestDate.toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                    {loan.repayDate && (
                      <div>
                        <p className="text-white/40 text-xs mb-1">REPAID</p>
                        <p className="font-medium text-green-400">
                          {loan.repayDate.toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1">
                    
                     <a href={`https://explorer.solana.com/tx/${loan.requestSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-white/60 text-xs transition"
                    >
                      View request tx ↗
                    </a>
                    {loan.repaySignature && (
                      
                       <a href={`https://explorer.solana.com/tx/${loan.repaySignature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/30 hover:text-white/60 text-xs transition"
                      >
                        View repayment tx ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}