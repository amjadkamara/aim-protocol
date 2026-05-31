import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import idl from './idl/aim_program.json'

const PROGRAM_ID = new web3.PublicKey('AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB')

export function getFarmerPDA(walletPublicKey) {
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('farmer'), walletPublicKey.toBuffer()],
    PROGRAM_ID
  )
  return pda
}

export function getLoanPDA(walletPublicKey) {
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('loan'), walletPublicKey.toBuffer()],
    PROGRAM_ID
  )
  return pda
}

export function useAimProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  const program = useMemo(() => {
    if (!wallet.publicKey) return null
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    })
    return new Program(idl, provider)
  }, [connection, wallet])

  const createFarmerID = async ({ fullName, cropType, district, farmSize }) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected')

    const farmerPDA = getFarmerPDA(wallet.publicKey)

    const tx = await program.methods
      .createFarmerId(
        fullName,
        cropType,
        district,
        parseFloat(farmSize)
      )
      .accounts({
        farmer: farmerPDA,
        owner: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc({
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

    return {
      signature: tx,
      farmerPublicKey: farmerPDA.toString(),
    }
  }

  const requestLoan = async ({ amount, purpose, repaymentWeeks }) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected')

    const farmerPDA = getFarmerPDA(wallet.publicKey)
    const loanPDA = getLoanPDA(wallet.publicKey)

    const tx = await program.methods
      .requestLoan(
        new BN(amount),
        purpose,
        repaymentWeeks
      )
      .accounts({
        loan: loanPDA,
        farmer: farmerPDA,
        owner: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc({
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

    return {
      signature: tx,
      loanPublicKey: loanPDA.toString(),
    }
  }

  const repayLoan = async () => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected')

    const farmerPDA = getFarmerPDA(wallet.publicKey)
    const loanPDA = getLoanPDA(wallet.publicKey)

    const tx = await program.methods
      .repayLoan()
      .accounts({
        loan: loanPDA,
        farmer: farmerPDA,
        owner: wallet.publicKey,
      })
      .rpc({
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

    return { signature: tx }
  }

  const fetchFarmer = async () => {
    if (!program || !wallet.publicKey) return null
    const farmerPDA = getFarmerPDA(wallet.publicKey)
    try {
      return await program.account.farmerAccount.fetch(farmerPDA)
    } catch {
      return null
    }
  }

  const closeLoan = async () => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected')
    const loanPDA = getLoanPDA(wallet.publicKey)
    const tx = await program.methods
      .closeLoan()
      .accounts({
        loan: loanPDA,
        owner: wallet.publicKey,
      })
      .rpc()
    return { signature: tx }
  }

  const fetchLoan = async () => {
    if (!program || !wallet.publicKey) return null
    const loanPDA = getLoanPDA(wallet.publicKey)
    try {
      return await program.account.loanAccount.fetch(loanPDA)
    } catch {
      return null
    }
  }

  return { program, createFarmerID, requestLoan, repayLoan, closeLoan, fetchFarmer, fetchLoan }
}

export function parseAnchorError(err) {
  const msg = err?.message || ''

  if (msg.includes('User rejected') || msg.includes('user rejected'))
    return 'Transaction cancelled. Please try again when ready.'

  if (msg.includes('insufficient funds') || msg.includes('Insufficient funds'))
    return 'Not enough SOL in your wallet to complete this transaction.'

  if (msg.includes('ActiveLoanExists') || msg.includes('0x1770'))
    return 'You already have an active loan. Repay it before requesting a new one.'

  if (msg.includes('LoanAlreadyRepaid') || msg.includes('0x1771'))
    return 'This loan has already been repaid.'

  if (msg.includes('AccountNotInitialized') || msg.includes('3012'))
    return 'Account not found. Please register your Farmer ID first.'

  if (msg.includes('already in use') || msg.includes('0x0'))
    return 'This account already exists on-chain.'

  if (msg.includes('blockhash') || msg.includes('BlockhashNotFound'))
    return 'Network timeout. Please try again.'

  if (msg.includes('simulation failed') || msg.includes('Simulation failed'))
    return 'Transaction simulation failed. Check your wallet is on devnet and has enough SOL.'

  return 'Transaction failed. Please try again.'
}