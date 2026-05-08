import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("trezo-hook", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TrezoHook as Program;
  const admin = provider.wallet as anchor.Wallet;

  const mint = Keypair.generate();
  let extraAccountMetaListPda: PublicKey;

  before(async () => {
    [extraAccountMetaListPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("extra-account-metas"), mint.publicKey.toBuffer()],
      program.programId
    );
  });

  it("initializes extra account meta list", async () => {
    await program.methods
      .initializeExtraAccountMetaList()
      .accounts({
        payer: admin.publicKey,
        extraAccountMetaList: extraAccountMetaListPda,
        mint: mint.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const accountInfo = await provider.connection.getAccountInfo(
      extraAccountMetaListPda
    );
    assert.isNotNull(accountInfo);
    assert.isTrue(accountInfo!.data.length > 0);
    console.log(
      "  ✅ ExtraAccountMetaList initialized:",
      extraAccountMetaListPda.toBase58()
    );
  });
});