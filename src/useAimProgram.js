import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMemo, useCallback } from 'react'
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

export function getLenderPDA(walletPublicKey) {
  const [pda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('lender'), walletPublicKey.toBuffer()],
    PROGRAM_ID
  )
  return pda
}

export function useAimProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const walletPublicKey = wallet.publicKey

  const program = useMemo(() => {
    if (!walletPublicKey) return null
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    })
    return new Program(idl, provider)
  }, [connection, wallet, walletPublicKey])

  const createFarmerID = useCallback(async ({ fullName, cropType, district, country, phoneNumber, farmSize }) => {
    if (!program || !walletPublicKey) throw new Error('Wallet not connected')

    const farmerPDA = getFarmerPDA(walletPublicKey)
    const lenderCheckPDA = getLenderPDA(walletPublicKey)

    const tx = await program.methods
      .createFarmerId(
        fullName,
        cropType,
        district,
        country,
        phoneNumber,
        parseFloat(farmSize)
      )
      .accounts({
        farmer: farmerPDA,
        lenderCheck: lenderCheckPDA,
        owner: walletPublicKey,
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
  }, [program, walletPublicKey])

  const registerLender = useCallback(async ({
    name, orgType, country, city, email,
    maxLoanSol, interestRateBps, maxDurationWeeks, minCreditScore, capitalBudgetSol,
  }) => {
    if (!program || !walletPublicKey) throw new Error('Wallet not connected')

    if (!Number.isFinite(maxLoanSol) || maxLoanSol <= 0) {
      throw new Error('Max loan amount is missing or invalid.')
    }
    if (!Number.isFinite(capitalBudgetSol) || capitalBudgetSol <= 0) {
      throw new Error('Capital budget is missing or invalid.')
    }

    const lenderPDA = getLenderPDA(walletPublicKey)
    const farmerCheckPDA = getFarmerPDA(walletPublicKey)

    const maxLoanLamports = Math.round(maxLoanSol * 1_000_000_000)
    const capitalBudgetLamports = Math.round(capitalBudgetSol * 1_000_000_000)

    const methodBuilder = program.methods
      .registerLender(
        name,
        orgType,
        country,
        city,
        email,
        new BN(maxLoanLamports),
        interestRateBps,
        maxDurationWeeks,
        new BN(minCreditScore),
        new BN(capitalBudgetLamports)
      )
      .accounts({
        lender: lenderPDA,
        farmerCheck: farmerCheckPDA,
        owner: walletPublicKey,
        systemProgram: web3.SystemProgram.programId,
      })

    const tx = await methodBuilder.rpc({
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    })

    return {
      signature: tx,
      lenderPublicKey: lenderPDA.toString(),
    }
  }, [program, walletPublicKey])

  // Admin-only: flips a lender's is_active flag to true.
  const approveLender = useCallback(async (lenderPublicKey) => {
    if (!program || !walletPublicKey) throw new Error('Wallet not connected')

    const lenderPubkey = typeof lenderPublicKey === 'string'
      ? new web3.PublicKey(lenderPublicKey)
      : lenderPublicKey

    const tx = await program.methods
      .approveLender()
      .accounts({
        lender: lenderPubkey,
        admin: walletPublicKey,
      })
      .rpc({
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

    return { signature: tx }
  }, [program, walletPublicKey])

  const fetchLender = useCallback(async () => {
    if (!program || !walletPublicKey) return null
    const lenderPDA = getLenderPDA(walletPublicKey)
    try {
      return await program.account.lenderAccount.fetch(lenderPDA)
    } catch {
      return null
    }
  }, [program, walletPublicKey])

  // Fetches every LenderAccount on-chain, decoding each one individually so a
  // single legacy/malformed account doesn't crash the whole list.
  // IMPORTANT: program.coder.accounts.memcmp(name) returns a raw { offset, bytes }
  // object — Solana's RPC requires this wrapped as { memcmp: { offset, bytes } }.
  const fetchAllLenders = useCallback(async () => {
    if (!program) return []
    const discriminator = program.coder.accounts.memcmp('lenderAccount')
    const raw = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: discriminator ? [{ memcmp: discriminator }] : [],
    })

    const results = []
    for (const { pubkey, account } of raw) {
      try {
        const decoded = program.coder.accounts.decode('lenderAccount', account.data)
        results.push({ publicKey: pubkey, account: decoded, decodeError: null })
      } catch (err) {
        console.warn('fetchAllLenders — skipped undecodable account:', pubkey.toString(), err.message)
      }
    }
    return results
  }, [program, connection])

  const fetchAllFarmers = useCallback(async () => {
    if (!program) return []
    const discriminator = program.coder.accounts.memcmp('farmerAccount')
    const raw = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: discriminator ? [{ memcmp: discriminator }] : [],
    })

    const results = []
    for (const { pubkey, account } of raw) {
      try {
        const decoded = program.coder.accounts.decode('farmerAccount', account.data)
        results.push({ publicKey: pubkey, account: decoded, decodeError: null })
      } catch (err) {
        console.warn('fetchAllFarmers — skipped undecodable account:', pubkey.toString(), err.message)
      }
    }
    return results
  }, [program, connection])

  const fetchAllLoans = useCallback(async () => {
    if (!program) return []
    const discriminator = program.coder.accounts.memcmp('loanAccount')
    const raw = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: discriminator ? [{ memcmp: discriminator }] : [],
    })

    const results = []
    for (const { pubkey, account } of raw) {
      try {
        const decoded = program.coder.accounts.decode('loanAccount', account.data)
        results.push({ publicKey: pubkey, account: decoded, decodeError: null })
      } catch (err) {
        console.warn('fetchAllLoans — skipped undecodable account:', pubkey.toString(), err.message)
      }
    }
    return results
  }, [program, connection])

  const requestLoan = useCallback(async ({ amount, purpose, repaymentWeeks, lenderPubkey }) => {
    if (!program || !walletPublicKey) throw new Error('Wallet not connected')

    const farmerPDA = getFarmerPDA(walletPublicKey)
    const loanPDA = getLoanPDA(walletPublicKey)

    const tx = await program.methods
      .requestLoan(
        new BN(amount),
        purpose,
        repaymentWeeks
      )
      .accounts({
        loan: loanPDA,
        farmer: farmerPDA,
        lender: lenderPubkey,
        owner: walletPublicKey,
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
  }, [program, walletPublicKey])

  // repay_loan now restores capital to the issuing lender on-chain, so the
  // lender account must be passed in. Read it off the loan itself —
  // LoanAccount.lender already stores the LenderAccount PDA the loan was
  // drawn from (set in request_loan) — one extra fetch, no new param needed
  // from callers.
  const repayLoan = useCallback(async () => {
    if (!program || !walletPublicKey) throw new Error('Wallet not connected')

    const farmerPDA = getFarmerPDA(walletPublicKey)
    const loanPDA = getLoanPDA(walletPublicKey)

    const loanAccount = await program.account.loanAccount.fetch(loanPDA)

    const tx = await program.methods
      .repayLoan()
      .accounts({
        loan: loanPDA,
        farmer: farmerPDA,
        lender: loanAccount.lender,
        owner: walletPublicKey,
      })
      .rpc({
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

    return { signature: tx }
  }, [program, walletPublicKey])

  const fetchFarmer = useCallback(async () => {
    if (!program || !walletPublicKey) return null
    const farmerPDA = getFarmerPDA(walletPublicKey)
    try {
      return await program.account.farmerAccount.fetch(farmerPDA)
    } catch {
      return null
    }
  }, [program, walletPublicKey])

  const closeLoan = useCallback(async () => {
    if (!program || !walletPublicKey) throw new Error('Wallet not connected')
    const loanPDA = getLoanPDA(walletPublicKey)
    const tx = await program.methods
      .closeLoan()
      .accounts({
        loan: loanPDA,
        owner: walletPublicKey,
      })
      .rpc()
    return { signature: tx }
  }, [program, walletPublicKey])

  const fetchLoan = useCallback(async () => {
    if (!program || !walletPublicKey) return null
    const loanPDA = getLoanPDA(walletPublicKey)
    try {
      return await program.account.loanAccount.fetch(loanPDA)
    } catch {
      return null
    }
  }, [program, walletPublicKey])

  return {
    program, createFarmerID, registerLender, approveLender,
    fetchLender, fetchAllLenders, fetchAllFarmers, fetchAllLoans,
    requestLoan, repayLoan, closeLoan, fetchFarmer, fetchLoan,
  }
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

  if (msg.includes('AdminCannotRegister'))
    return 'The admin wallet cannot register as a Farmer or Lender.'

  if (msg.includes('WalletAlreadyHasRole'))
    return 'This wallet is already registered with a different role on the protocol.'

  if (msg.includes('LenderNotActive'))
    return 'This lender has not yet been approved by the admin.'

  if (msg.includes('Unauthorized'))
    return 'Only the AIM Protocol admin wallet can perform this action.'

  if (msg.includes('InsufficientCapitalBudget'))
    return "This loan amount exceeds the lender's remaining capital budget."

  if (msg.includes('LenderMismatch'))
    return 'Lender account mismatch. Please refresh and try again.'

  return 'Transaction failed. Please try again.'
}