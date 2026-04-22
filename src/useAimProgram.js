import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import idl from './idl/aim_program.json'

const PROGRAM_ID = new web3.PublicKey('AhHHJTu5vodDYE2yLNet2bE6jad9F3xSfbLQdUmykKqB')

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

    const farmerKeypair = web3.Keypair.generate()
    
    const { blockhash } = await connection.getLatestBlockhash('confirmed')

    const tx = await program.methods
      .createFarmerId(
        fullName,
        cropType,
        district,
        parseFloat(farmSize)
      )
      .accounts({
        farmer: farmerKeypair.publicKey,
        owner: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([farmerKeypair])
      .rpc({
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        blockhash,
      })

    return {
      signature: tx,
      farmerPublicKey: farmerKeypair.publicKey.toString(),
    }
  }

  const requestLoan = async ({ farmerPublicKey, amount, purpose, repaymentWeeks }) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected')

    const loanKeypair = web3.Keypair.generate()
    const farmerPubkey = new web3.PublicKey(farmerPublicKey)

    const tx = await program.methods
      .requestLoan(
        new BN(amount),
        purpose,
        repaymentWeeks
      )
      .accounts({
        loan: loanKeypair.publicKey,
        farmer: farmerPubkey,
        owner: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([loanKeypair])
      .rpcAndKeys()

    return {
      signature: tx.signature,
      loanPublicKey: loanKeypair.publicKey.toString(),
    }
  }

  return { program, createFarmerID, requestLoan }
}