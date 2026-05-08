import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("trezo-core", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TrezoCore as Program;
  const admin = provider.wallet as anchor.Wallet;

  // ─── Test data ──────────────────────────────────────────────────────────
  const companyId = "test-company-001";
  const agentKeypair = Keypair.generate();
  const baseMint = Keypair.generate().publicKey;
  const member2 = Keypair.generate();

  // ─── PDAs ───────────────────────────────────────────────────────────────
  let treasuryPda: PublicKey;
  let treasuryBump: number;
  let agentAuthorityPda: PublicKey;
  let deptPda: PublicKey;
  let yieldPositionPda: PublicKey;
  let oraclePda: PublicKey;
  let proposalPda: PublicKey;
  let viewingKeyPda: PublicKey;
  let spendingRulePda: PublicKey;

  before(async () => {
  [treasuryPda, treasuryBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), Buffer.from(companyId)],
    program.programId
  );

  [agentAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), treasuryPda.toBuffer()],
    program.programId
  );

  [oraclePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("oracle"), treasuryPda.toBuffer()],
    program.programId
  );

  [viewingKeyPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("viewing_key"),
      treasuryPda.toBuffer(),
      admin.publicKey.toBuffer(),
    ],
    program.programId
  );

  // Fund agent keypair so it can pay rent for proposals
  const airdropSig = await provider.connection.requestAirdrop(
    agentKeypair.publicKey,
    2 * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropSig);
  console.log("  💧 Agent funded:", agentKeypair.publicKey.toBase58());
});

  // ─── Treasury ─────────────────────────────────────────────────────────

  it("initializes treasury", async () => {
    await program.methods
      .initializeTreasury(companyId, agentKeypair.publicKey, baseMint)
      .accounts({
        authority: admin.publicKey,
        treasuryConfig: treasuryPda,
        agentAuthority: agentAuthorityPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const treasury = await program.account.treasuryConfig.fetch(treasuryPda);
    assert.equal(treasury.companyId, companyId);
    assert.equal(treasury.admin.toBase58(), admin.publicKey.toBase58());
    assert.equal(
      treasury.agentPubkey.toBase58(),
      agentKeypair.publicKey.toBase58()
    );
    assert.equal(treasury.isPaused, false);
    assert.equal(treasury.multisigThreshold, 1);
    assert.equal(treasury.members.length, 1);
    console.log("  ✅ Treasury initialized:", treasuryPda.toBase58());
  });

  it("adds a multisig member", async () => {
    await program.methods
      .addMultisigMember(member2.publicKey)
      .accounts({
        treasuryConfig: treasuryPda,
        authority: admin.publicKey,
      })
      .rpc();

    const treasury = await program.account.treasuryConfig.fetch(treasuryPda);
    assert.equal(treasury.members.length, 2);
    assert.isTrue(
      treasury.members.some(
        (m: PublicKey) => m.toBase58() === member2.publicKey.toBase58()
      )
    );
    console.log("  ✅ Member added:", member2.publicKey.toBase58());
  });

  it("pauses and unpauses treasury", async () => {
    await program.methods
      .pauseTreasury()
      .accounts({
        treasuryConfig: treasuryPda,
        authority: admin.publicKey,
      })
      .rpc();

    let treasury = await program.account.treasuryConfig.fetch(treasuryPda);
    assert.equal(treasury.isPaused, true);
    console.log("  ✅ Treasury paused");

    await program.methods
      .unpauseTreasury()
      .accounts({
        treasuryConfig: treasuryPda,
        authority: admin.publicKey,
      })
      .rpc();

    treasury = await program.account.treasuryConfig.fetch(treasuryPda);
    assert.equal(treasury.isPaused, false);
    console.log("  ✅ Treasury unpaused");
  });

  it("rejects pause from non-admin", async () => {
    const nonAdmin = Keypair.generate();
    try {
      await program.methods
        .pauseTreasury()
        .accounts({
          treasuryConfig: treasuryPda,
          authority: nonAdmin.publicKey,
        })
        .signers([nonAdmin])
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.include(err.message, "UnauthorizedAdmin");
      console.log("  ✅ Non-admin pause correctly rejected");
    }
  });

  // ─── Department ─────────────────────────────────────────────────────────

  it("initializes a department", async () => {
    const deptId = "engineering";
    const deptVaultAta = Keypair.generate().publicKey;

    [deptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("department"),
        treasuryPda.toBuffer(),
        Buffer.from(deptId),
      ],
      program.programId
    );

    [yieldPositionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("yield"), deptPda.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeDepartment(
        deptId,
        "Engineering",
        deptVaultAta,
        new anchor.BN(5_000_000_000)
      )
      .accounts({
        treasuryConfig: treasuryPda,
        authority: admin.publicKey,
        deptAccount: deptPda,
        yieldPosition: yieldPositionPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const dept = await program.account.departmentAccount.fetch(deptPda);
    assert.equal(dept.deptId, deptId);
    assert.equal(dept.name, "Engineering");
    assert.equal(dept.isActive, true);
    console.log("  ✅ Department initialized:", deptPda.toBase58());
  });

  // ─── Oracle ──────────────────────────────────────────────────────────────

  it("initializes oracle", async () => {
    await program.methods
      .initializeOracle(new anchor.BN(1_002_000))
      .accounts({
        treasuryConfig: treasuryPda,
        authority: admin.publicKey,
        oracleConfig: oraclePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const oracle = await program.account.oracleConfig.fetch(oraclePda);
    assert.equal(oracle.rateTriggerMicros.toNumber(), 1_002_000);
    assert.equal(oracle.totalTriggers.toNumber(), 0);
    console.log("  ✅ Oracle initialized");
  });

  it("triggers fiat conversion", async () => {
    await program.methods
      .triggerFiatConversion()
      .accounts({
        treasuryConfig: treasuryPda,
        oracleConfig: oraclePda,
        agentAuthority: agentAuthorityPda,
        agent: agentKeypair.publicKey,
      })
      .signers([agentKeypair])
      .rpc();

    const oracle = await program.account.oracleConfig.fetch(oraclePda);
    assert.equal(oracle.totalTriggers.toNumber(), 1);
    console.log("  ✅ Fiat conversion triggered");
  });

  // ─── Proposals ───────────────────────────────────────────────────────────

  it("creates a payout proposal", async () => {
    const nonceBuf = Buffer.alloc(8);
    nonceBuf.writeBigUInt64LE(BigInt(0));

    [proposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), treasuryPda.toBuffer(), nonceBuf],
      program.programId
    );

    const recipient = Keypair.generate().publicKey;
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400;

    await program.methods
      .proposePayout(
        new anchor.BN(1_000_000),
        1,
        "ipfs://test-metadata-uri",
        new anchor.BN(expiryTimestamp)
      )
      .accounts({
        treasuryConfig: treasuryPda,
        deptAccount: deptPda,
        agentAuthority: agentAuthorityPda,
        proposer: agentKeypair.publicKey,
        proposal: proposalPda,
        recipient: recipient,
        systemProgram: SystemProgram.programId,
      })
      .signers([agentKeypair])
      .rpc();

    const proposal = await program.account.payoutProposal.fetch(proposalPda);
    assert.equal(proposal.amountLamports.toNumber(), 1_000_000);
    assert.equal(proposal.status, "pending");
    assert.equal(proposal.approvalsCount, 0);
    assert.equal(proposal.approvalBitmap.toNumber(), 0);
    console.log("  ✅ Proposal created:", proposalPda.toBase58());
  });

  it("approves a payout proposal", async () => {
    await program.methods
      .approvePayout()
      .accounts({
        treasuryConfig: treasuryPda,
        proposal: proposalPda,
        approver: admin.publicKey,
      })
      .rpc();

    const proposal = await program.account.payoutProposal.fetch(proposalPda);
    assert.equal(proposal.approvalsCount, 1);
    assert.notEqual(proposal.approvalBitmap.toNumber(), 0);
    console.log("  ✅ Proposal approved");
  });

  it("executes a payout proposal", async () => {
    await program.methods
      .executePayout()
      .accounts({
        treasuryConfig: treasuryPda,
        proposal: proposalPda,
        executor: admin.publicKey,
      })
      .rpc();

    const proposal = await program.account.payoutProposal.fetch(proposalPda);
    assert.equal(proposal.status, "executed");
    console.log("  ✅ Proposal executed");
  });

  it("rejects execute when below threshold", async () => {
    // Create a new proposal with threshold of 2
    const treasury = await program.account.treasuryConfig.fetch(treasuryPda);

    const nonce = treasury.proposalCount.toNumber();
    const nonceBuf = Buffer.alloc(8);
    nonceBuf.writeBigUInt64LE(BigInt(nonce));

    const [newProposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), treasuryPda.toBuffer(), nonceBuf],
      program.programId
    );

    const recipient = Keypair.generate().publicKey;
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400;

    await program.methods
      .proposePayout(
        new anchor.BN(500_000),
        1,
        "ipfs://test-metadata-2",
        new anchor.BN(expiryTimestamp)
      )
      .accounts({
        treasuryConfig: treasuryPda,
        deptAccount: deptPda,
        agentAuthority: agentAuthorityPda,
        proposer: agentKeypair.publicKey,
        proposal: newProposalPda,
        recipient,
        systemProgram: SystemProgram.programId,
      })
      .signers([agentKeypair])
      .rpc();

    // Try to execute without any approvals — should fail
    try {
      await program.methods
        .executePayout()
        .accounts({
          treasuryConfig: treasuryPda,
          proposal: newProposalPda,
          executor: admin.publicKey,
        })
        .rpc();
      assert.fail("Should have thrown InsufficientApprovals");
    } catch (err: any) {
      assert.include(err.message, "InsufficientApprovals");
      console.log("  ✅ Execute correctly rejected — insufficient approvals");
    }
  });

  it("cancels a proposal", async () => {
    const treasury = await program.account.treasuryConfig.fetch(treasuryPda);
    const nonce = treasury.proposalCount.toNumber();
    const nonceBuf = Buffer.alloc(8);
    nonceBuf.writeBigUInt64LE(BigInt(nonce));

    const [cancelPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), treasuryPda.toBuffer(), nonceBuf],
      program.programId
    );

    const recipient = Keypair.generate().publicKey;
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400;

    await program.methods
      .proposePayout(
        new anchor.BN(200_000),
        1,
        "ipfs://cancel-test",
        new anchor.BN(expiryTimestamp)
      )
      .accounts({
        treasuryConfig: treasuryPda,
        deptAccount: deptPda,
        agentAuthority: agentAuthorityPda,
        proposer: agentKeypair.publicKey,
        proposal: cancelPda,
        recipient,
        systemProgram: SystemProgram.programId,
      })
      .signers([agentKeypair])
      .rpc();

    await program.methods
      .cancelProposal()
      .accounts({
        treasuryConfig: treasuryPda,
        proposal: cancelPda,
        authority: admin.publicKey,
      })
      .rpc();

    const proposal = await program.account.payoutProposal.fetch(cancelPda);
    assert.equal(proposal.status, "cancelled");
    console.log("  ✅ Proposal cancelled");
  });

  // ─── Yield ───────────────────────────────────────────────────────────────

  it("deposits yield", async () => {
    await program.methods
      .depositYield()
      .accounts({
        treasuryConfig: treasuryPda,
        deptAccount: deptPda,
        yieldPosition: yieldPositionPda,
        agentAuthority: agentAuthorityPda,
        agent: agentKeypair.publicKey,
      })
      .signers([agentKeypair])
      .rpc();

    const yp = await program.account.yieldPosition.fetch(yieldPositionPda);
    assert.isTrue(yp.totalDeposited.toNumber() > 0);
    console.log(
      "  ✅ Yield deposited:",
      yp.totalDeposited.toNumber()
    );
  });

  it("withdraws yield", async () => {
    const before = await program.account.yieldPosition.fetch(yieldPositionPda);

    await program.methods
      .withdrawYield(new anchor.BN(1_000_000))
      .accounts({
        treasuryConfig: treasuryPda,
        deptAccount: deptPda,
        yieldPosition: yieldPositionPda,
        agentAuthority: agentAuthorityPda,
        agent: agentKeypair.publicKey,
      })
      .signers([agentKeypair])
      .rpc();

    const after = await program.account.yieldPosition.fetch(yieldPositionPda);
    assert.isTrue(
      after.totalDeposited.toNumber() < before.totalDeposited.toNumber()
    );
    console.log("  ✅ Yield withdrawn");
  });

  // ─── Spending rules ───────────────────────────────────────────────────────

  it("creates a spending rule", async () => {
    [spendingRulePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("rule"), deptPda.toBuffer()],
      program.programId
    );

    await program.methods
      .createSpendingRule(
        new anchor.BN(10_000_000),
        new anchor.BN(50_000_000),
        8,
        20
      )
      .accounts({
        treasuryConfig: treasuryPda,
        deptAccount: deptPda,
        authority: admin.publicKey,
        spendingRule: spendingRulePda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const rule = await program.account.spendingRule.fetch(spendingRulePda);
    assert.equal(rule.maxSinglePayout.toNumber(), 10_000_000);
    assert.equal(rule.dailyLimit.toNumber(), 50_000_000);
    assert.equal(rule.windowStart, 8);
    assert.equal(rule.windowEnd, 20);
    assert.equal(rule.allowlistEnabled, false);
    console.log("  ✅ Spending rule created");
  });

  // ─── Privacy ─────────────────────────────────────────────────────────────

  it("registers a viewing key", async () => {
    await program.methods
      .registerViewingKey("encrypted-key-test-data-hex-string-here")
      .accounts({
        treasuryConfig: treasuryPda,
        viewer: admin.publicKey,
        viewingKey: viewingKeyPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vk = await program.account.viewingKey.fetch(viewingKeyPda);
    assert.equal(vk.encryptedKey, "encrypted-key-test-data-hex-string-here");
    assert.equal(vk.viewer.toBase58(), admin.publicKey.toBase58());
    console.log("  ✅ Viewing key registered");
  });

  it("revokes a viewing key", async () => {
    await program.methods
      .revokeViewingKey()
      .accounts({
        treasuryConfig: treasuryPda,
        viewingKey: viewingKeyPda,
        authority: admin.publicKey,
      })
      .rpc();

    try {
      await program.account.viewingKey.fetch(viewingKeyPda);
      assert.fail("Account should be closed");
    } catch {
      console.log("  ✅ Viewing key revoked and account closed");
    }
  });
});