import {
  Transaction,
  ComputeBudgetProgram,
  sendAndConfirmTransaction,
  PublicKey,
} from '@solana/web3.js';
import { getProgram, getAgentKeypair, getConnection, PDAs } from '../services/anchor';
import { ProposalInstructionData } from './proposal-builder';
import { withRetry } from '../utils';

const PRIORITY_FEE_MICROLAMPORTS = 100_000;

function addPriorityFee(tx: Transaction): Transaction {
  tx.instructions.unshift(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: PRIORITY_FEE_MICROLAMPORTS,
    })
  );
  return tx;
}

export interface SubmitResult {
  success: boolean;
  signature?: string;
  proposalPda?: string;
  error?: string;
}

export async function submitProposePayout(
  data: ProposalInstructionData,
  companyId: string
): Promise<SubmitResult> {
  return withRetry(async () => {
    const program = getProgram();
    const agentKeypair = getAgentKeypair();
    const connection = getConnection();

    const [treasuryPda] = PDAs.treasury(companyId);
    const [agentAuthorityPda] = PDAs.agentAuthority(treasuryPda);

    let nonce = Math.floor(Date.now() / 1000);
    try {
      const agentAccount = await (program.account as any).agentAuthority.fetch(agentAuthorityPda);
      nonce = (agentAccount as any).proposalNonce ?? nonce;
    } catch {
      // AgentAuthority not initialized yet — use timestamp nonce
    }

    const [proposalPda] = PDAs.proposal(treasuryPda, nonce);

    const tx = await program.methods
      .proposePayout(
        data.amountLamports,
        data.category,
        data.metadataUri,
        data.expiryTimestamp
      )
      .accounts({
        treasuryConfig: treasuryPda,
        deptAccount: data.deptPda,
        proposal: proposalPda,
        recipient: data.recipientAta,
        agentAuthority: agentAuthorityPda,
        proposer: agentKeypair.publicKey,
        systemProgram: PublicKey.default,
      })
      .transaction();

    addPriorityFee(tx);
    tx.feePayer = agentKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [agentKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`✅ propose_payout: ${signature.slice(0, 8)}...`);
    return { success: true, signature, proposalPda: proposalPda.toBase58() };

  }, 3, 2000).catch((err) => ({
    success: false,
    error: err instanceof Error ? err.message : String(err),
  }));
}

export async function submitTriggerYieldDeposit(
  deptPdaStr: string,
  companyId: string
): Promise<SubmitResult> {
  return withRetry(async () => {
    const program = getProgram();
    const agentKeypair = getAgentKeypair();
    const connection = getConnection();

    const [treasuryPda] = PDAs.treasury(companyId);
    const deptPda = new PublicKey(deptPdaStr);
    const [yieldPositionPda] = PDAs.yieldPosition(deptPda);
    const [agentAuthorityPda] = PDAs.agentAuthority(treasuryPda);

    const tx = await program.methods
      .depositYield()
      .accounts({
        treasuryConfig: treasuryPda,
        deptAccount: deptPda,
        yieldPosition: yieldPositionPda,
        agentAuthority: agentAuthorityPda,
        agent: agentKeypair.publicKey,
      })
      .transaction();

    addPriorityFee(tx);
    tx.feePayer = agentKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [agentKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`✅ deposit_yield: ${signature.slice(0, 8)}...`);
    return { success: true, signature };

  }, 3, 2000).catch((err) => ({
    success: false,
    error: err instanceof Error ? err.message : String(err),
  }));
}

export async function submitTriggerFiatConversion(
  companyId: string
): Promise<SubmitResult> {
  return withRetry(async () => {
    const program = getProgram();
    const agentKeypair = getAgentKeypair();
    const connection = getConnection();

    const [treasuryPda] = PDAs.treasury(companyId);
    const [oracleConfigPda] = PDAs.oracleConfig(treasuryPda);
    const [agentAuthorityPda] = PDAs.agentAuthority(treasuryPda);

    const tx = await program.methods
      .triggerFiatConversion()
      .accounts({
        treasuryConfig: treasuryPda,
        oracleConfig: oracleConfigPda,
        agentAuthority: agentAuthorityPda,
        agent: agentKeypair.publicKey,
      })
      .transaction();

    addPriorityFee(tx);
    tx.feePayer = agentKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [agentKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`✅ trigger_fiat_conversion: ${signature.slice(0, 8)}...`);
    return { success: true, signature };

  }, 3, 2000).catch((err) => ({
    success: false,
    error: err instanceof Error ? err.message : String(err),
  }));
}
export async function submitRegisterViewingKey(
  viewerPubkey: string,
  encryptedKey: string,
  companyId: string
): Promise<SubmitResult> {
  return withRetry(async () => {
    const program = getProgram();
    const agentKeypair = getAgentKeypair();
    const connection = getConnection();

    const [treasuryPda] = PDAs.treasury(companyId);
    const viewer = new PublicKey(viewerPubkey);
    const [viewingKeyPda] = PDAs.viewingKey(treasuryPda, viewer);

    const tx = await program.methods
      .registerViewingKey(encryptedKey)
      .accounts({
        treasuryConfig: treasuryPda,
        viewer,
        viewingKey: viewingKeyPda,
        systemProgram: PublicKey.default,
      })
      .transaction();

    addPriorityFee(tx);
    tx.feePayer = agentKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [agentKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`✅ register_viewing_key: ${signature.slice(0, 8)}...`);
    return { success: true, signature };

  }, 3, 2000).catch((err) => ({
    success: false,
    error: err instanceof Error ? err.message : String(err),
  }));
}

export async function submitRevokeViewingKey(
  viewerPubkey: string,
  companyId: string
): Promise<SubmitResult> {
  return withRetry(async () => {
    const program = getProgram();
    const agentKeypair = getAgentKeypair();
    const connection = getConnection();

    const [treasuryPda] = PDAs.treasury(companyId);
    const viewer = new PublicKey(viewerPubkey);
    const [viewingKeyPda] = PDAs.viewingKey(treasuryPda, viewer);

    const tx = await program.methods
      .revokeViewingKey()
      .accounts({
        treasuryConfig: treasuryPda,
        viewingKey: viewingKeyPda,
        authority: agentKeypair.publicKey,
      })
      .transaction();

    addPriorityFee(tx);
    tx.feePayer = agentKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [agentKeypair],
      { commitment: 'confirmed' }
    );

    console.log(`✅ revoke_viewing_key: ${signature.slice(0, 8)}...`);
    return { success: true, signature };

  }, 3, 2000).catch((err) => ({
    success: false,
    error: err instanceof Error ? err.message : String(err),
  }));
}