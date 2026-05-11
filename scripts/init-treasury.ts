/**
 * scripts/init-treasury.ts
 * 
 * One-time script to initialize the Trezo treasury on devnet.
 * Run: tsx scripts/init-treasury.ts
 */

import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import {
  Transaction,
  ComputeBudgetProgram,
  sendAndConfirmTransaction,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import dotenv from 'dotenv';
import { join } from 'path';
import { BN } from '@coral-xyz/anchor';

dotenv.config({ path: join(__dirname, '../apps/backend/.env') });

import { getProgram, getAgentKeypair, getConnection, PDAs } from '../apps/backend/src/services/anchor';

// ─── Config ───────────────────────────────────────────────────────────────────

const COMPANY_ID = 'trezo-demo';

// Devnet USDC mint (Circle's official devnet USDC)
const DEVNET_USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

const PRIORITY_FEE = 100_000; // microlamports

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addPriorityFee(tx: Transaction): Transaction {
  tx.instructions.unshift(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: PRIORITY_FEE })
  );
  return tx;
}

async function sendTx(tx: Transaction): Promise<string> {
  const connection = getConnection();
  const agentKeypair = getAgentKeypair();

  addPriorityFee(tx);
  tx.feePayer = agentKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return sendAndConfirmTransaction(connection, tx, [agentKeypair], {
    commitment: 'confirmed',
  });
}

// ─── Steps ────────────────────────────────────────────────────────────────────

async function initTreasury(): Promise<void> {
  console.log('\n🏦 Initializing treasury...');
  const program = getProgram();
  const agentKeypair = getAgentKeypair();
  const [treasuryPda] = PDAs.treasury(COMPANY_ID);
  const [agentAuthorityPda] = PDAs.agentAuthority(treasuryPda);

  // Check if already initialized
  try {
    await (program.account as any).treasuryConfig.fetch(treasuryPda);
    console.log('  ⏭️  Treasury already initialized:', treasuryPda.toBase58());
    return;
  } catch {
    // Not initialized yet — proceed
  }

  const tx = await program.methods
    .initializeTreasury(
      COMPANY_ID,
      agentKeypair.publicKey,
      DEVNET_USDC_MINT
    )
    .accounts({
      authority: agentKeypair.publicKey,
      treasuryConfig: treasuryPda,
      agentAuthority: agentAuthorityPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  const sig = await sendTx(tx);
  console.log(`  ✅ Treasury initialized: ${sig.slice(0, 8)}...`);
  console.log(`     PDA: ${treasuryPda.toBase58()}`);
}

async function initDepartment(deptId: string, name: string): Promise<void> {
  console.log(`\n🏢 Initializing department: ${name}...`);
  const program = getProgram();
  const agentKeypair = getAgentKeypair();
  const [treasuryPda] = PDAs.treasury(COMPANY_ID);
  const [deptPda] = PDAs.department(treasuryPda, deptId);
  const [yieldPositionPda] = PDAs.yieldPosition(deptPda);

  // Check if already initialized
  try {
    await (program.account as any).departmentAccount.fetch(deptPda);
    console.log(`  ⏭️  Department already initialized: ${deptPda.toBase58()}`);
    return;
  } catch {
    // Not initialized yet — proceed
  }

  // Use agent pubkey as placeholder vault ATA (replace with real ATA later)
  const [deptVaultAuthPda] = PDAs.deptVaultAuthority(deptPda);
  const deptVaultAta = getAssociatedTokenAddressSync(
    DEVNET_USDC_MINT,
    deptVaultAuthPda,
    true // allowOwnerOffCurve — PDA is not on curve
    );
    console.log(`  🏦 Vault ATA: ${deptVaultAta.toBase58()}`);
  const idleThreshold = new BN(5_000_000_000); // 5000 USDC in lamports

  const tx = await program.methods
    .initializeDepartment(
      deptId,
      name,
      deptVaultAta,
      idleThreshold
    )
    .accounts({
      treasuryConfig: treasuryPda,
      authority: agentKeypair.publicKey,
      deptAccount: deptPda,
      yieldPosition: yieldPositionPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  const sig = await sendTx(tx);
  console.log(`  ✅ Department initialized: ${sig.slice(0, 8)}...`);
  console.log(`     PDA: ${deptPda.toBase58()}`);
}

async function initOracle(): Promise<void> {
  console.log('\n📡 Initializing oracle...');
  const program = getProgram();
  const agentKeypair = getAgentKeypair();
  const [treasuryPda] = PDAs.treasury(COMPANY_ID);
  const [oracleConfigPda] = PDAs.oracleConfig(treasuryPda);

  // Check if already initialized
  try {
    await (program.account as any).oracleConfig.fetch(oracleConfigPda);
    console.log('  ⏭️  Oracle already initialized:', oracleConfigPda.toBase58());
    return;
  } catch {
    // Not initialized yet — proceed
  }

  // 1.002 * 1_000_000 = 1_002_000 micros
  const rateTriggerMicros = new BN(1_002_000);

  const tx = await program.methods
    .initializeOracle(rateTriggerMicros)
    .accounts({
      treasuryConfig: treasuryPda,
      authority: agentKeypair.publicKey,
      oracleConfig: oracleConfigPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  const sig = await sendTx(tx);
  console.log(`  ✅ Oracle initialized: ${sig.slice(0, 8)}...`);
  console.log(`     PDA: ${oracleConfigPda.toBase58()}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀 Trezo AI — Treasury Initialization');
  console.log(`   Company ID: ${COMPANY_ID}`);
  console.log(`   Program:    ${process.env.PROGRAM_ID}`);
  console.log(`   RPC:        ${process.env.SOLANA_RPC_URL?.slice(0, 40)}...`);

  const agentKeypair = getAgentKeypair();
  console.log(`   Agent:      ${agentKeypair.publicKey.toBase58()}\n`);

  try {
    await initTreasury();
    await initDepartment('engineering', 'Engineering');
    await initDepartment('marketing', 'Marketing');
    await initDepartment('operations', 'Operations');
    await initOracle();

    console.log('\n✅ Treasury fully initialized and ready\n');
    console.log('PDAs:');
    const [treasuryPda] = PDAs.treasury(COMPANY_ID);
    console.log(`  Treasury:    ${treasuryPda.toBase58()}`);
    const [eng] = PDAs.department(treasuryPda, 'engineering');
    console.log(`  Engineering: ${eng.toBase58()}`);
    const [mkt] = PDAs.department(treasuryPda, 'marketing');
    console.log(`  Marketing:   ${mkt.toBase58()}`);
    const [ops] = PDAs.department(treasuryPda, 'operations');
    console.log(`  Operations:  ${ops.toBase58()}`);
    const [oracle] = PDAs.oracleConfig(treasuryPda);
    console.log(`  Oracle:      ${oracle.toBase58()}`);

  } catch (err) {
    console.error('\n❌ Initialization failed:', err);
    process.exit(1);
  }
}

main();