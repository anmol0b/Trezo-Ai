import {
  AnchorProvider,
  Program,
  setProvider,
  Idl,
} from '@coral-xyz/anchor';
import {
  Connection,
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import { config } from '../config';

let idl: Idl | null = null;
try {
  idl = require('../idl/koshai-core.json');
} catch {
  console.warn('⚠️  IDL not found at src/idl/koshai-core.json');
  console.warn('   Run: anchor build && bash scripts/sync-idl.sh');
}

let _connection: Connection | null = null;
let _provider: AnchorProvider | null = null;
let _program: Program | null = null;
let _agentKeypair: Keypair | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(config.solana.rpcUrl, {
      commitment: 'confirmed',
    });
  }
  return _connection;
}

export function getAgentKeypair(): Keypair {
  if (!_agentKeypair) {
    try {
      const raw = JSON.parse(config.solana.agentKeypair);
      _agentKeypair = Keypair.fromSecretKey(Uint8Array.from(raw));
    } catch {
      throw new Error(
        'AGENT_KEYPAIR is not a valid JSON keypair array. ' +
        'Generate one with: solana-keygen new --outfile agent-keypair.json'
      );
    }
  }
  return _agentKeypair;
}

export function getProvider(): AnchorProvider {
  if (!_provider) {
    const connection = getConnection();
    const keypair = getAgentKeypair();

    const wallet = {
      publicKey: keypair.publicKey,
      signTransaction: async <T extends { partialSign: (kp: Keypair) => void }>(tx: T) => {
        tx.partialSign(keypair);
        return tx;
      },
      signAllTransactions: async <T extends { partialSign: (kp: Keypair) => void }>(txs: T[]) => {
        txs.forEach((tx) => tx.partialSign(keypair));
        return txs;
      },
    };

    _provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });

    setProvider(_provider);
  }
  return _provider;
}

export function getProgram(): Program {
  if (!_program) {
    if (!idl) {
      throw new Error(
        'IDL not loaded. Run: anchor build && bash scripts/sync-idl.sh'
      );
    }
    const provider = getProvider();
    const programId = new PublicKey(config.solana.programId);
    _program = new Program(idl, provider);
  }
  return _program;
}

export const PDAs = {
  treasury: (companyId: string) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('treasury'), Buffer.from(companyId)],
      new PublicKey(config.solana.programId)
    );
  },

  department: (treasuryPda: PublicKey, deptId: string) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('department'), treasuryPda.toBuffer(), Buffer.from(deptId)],
      new PublicKey(config.solana.programId)
    );
  },

  deptVaultAuthority: (deptPda: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault_auth'), deptPda.toBuffer()],
      new PublicKey(config.solana.programId)
    );
  },

  proposal: (treasuryPda: PublicKey, nonce: number) => {
    const nonceBuf = Buffer.alloc(8);
    nonceBuf.writeBigUInt64LE(BigInt(nonce));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('proposal'), treasuryPda.toBuffer(), nonceBuf],
      new PublicKey(config.solana.programId)
    );
  },

  agentAuthority: (treasuryPda: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), treasuryPda.toBuffer()],
      new PublicKey(config.solana.programId)
    );
  },

  yieldPosition: (deptPda: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('yield'), deptPda.toBuffer()],
      new PublicKey(config.solana.programId)
    );
  },

  oracleConfig: (treasuryPda: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('oracle'), treasuryPda.toBuffer()],
      new PublicKey(config.solana.programId)
    );
  },

  viewingKey: (treasuryPda: PublicKey, viewerPubkey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('viewing_key'), treasuryPda.toBuffer(), viewerPubkey.toBuffer()],
      new PublicKey(config.solana.programId)
    );
  },
};