use anchor_lang::prelude::*;
use sha2::{Sha256, Digest};
use anchor_spl::token_2022::spl_token_2022::{
    extension::{
        transfer_hook::TransferHookAccount,
        BaseStateWithExtensions,
        StateWithExtensions,
    },
    state::Account as Token2022Account,
};

use crate::instructions::initialize::EXTRA_ACCOUNT_METAS_SEED;

// ─── SpendingRule mirror struct ───────────────────────────────────────────────
// Must match trezo-core's SpendingRule layout exactly.
// We deserialize manually to avoid a hard CPI dependency.
#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct SpendingRule {
    pub treasury_config: Pubkey,
    pub dept_pda:        Pubkey,
    pub max_single_payout: u64,
    pub daily_limit:     u64,
    pub allowlist_enabled: bool,
    pub allowlist:       Vec<[u8; 32]>,
    pub window_start:    u8,
    pub window_end:      u8,
    pub bump:            u8,
}

// ─── Errors ───────────────────────────────────────────────────────────────────
#[error_code]
pub enum HookError {
    #[msg("Transfer amount exceeds max single payout rule.")]
    ExceedsMaxPayout,
    #[msg("Transfer is outside the allowed time window.")]
    OutsideTimeWindow,
    #[msg("Recipient is not in the allowlist.")]
    RecipientNotAllowed,
    #[msg("Hook must be invoked by Token-2022 during an active transfer.")]
    NotTransferring,
    #[msg("SpendingRule account is invalid or owned by wrong program.")]
    InvalidSpendingRule,
}

// ─── Handler ──────────────────────────────────────────────────────────────────
pub fn handle_execute_hook(ctx: Context<ExecuteHook>, amount: u64) -> Result<()> {
    // ── Security: reject direct calls not coming from Token-2022 transfer ──
    {
        let data = ctx.accounts.source_token.try_borrow_data()?;
        let token_account = StateWithExtensions::<Token2022Account>::unpack(&data)
            .map_err(|_| error!(HookError::NotTransferring))?;
        let extension = token_account
            .get_extension::<TransferHookAccount>()
            .map_err(|_| error!(HookError::NotTransferring))?;
        require!(bool::from(extension.transferring), HookError::NotTransferring);
    }

    // ── Security: spending_rule must be owned by trezo-core ────────────────
    let spending_rule_info = &ctx.accounts.spending_rule;
    require_keys_eq!(
        *spending_rule_info.owner,
        trezo_core::ID,
        HookError::InvalidSpendingRule
    );

    // ── Deserialize — skip 8-byte Anchor discriminator ─────────────────────
    let data = spending_rule_info.try_borrow_data()?;
    if data.len() < 8 {
        // No rule configured yet — allow the transfer
        return Ok(());
    }
    let rule = SpendingRule::try_from_slice(&data[8..])
        .map_err(|_| error!(HookError::InvalidSpendingRule))?;

    // ── 1. Max single payout ───────────────────────────────────────────────
    if rule.max_single_payout > 0 {
        require!(
            amount <= rule.max_single_payout,
            HookError::ExceedsMaxPayout
        );
    }

    // ── 2. Time window (UTC hours, 0–23) ───────────────────────────────────
    // Skipped when both fields are 0 (rule not configured).
    // Note: overnight windows (e.g. 22–06) are not yet supported.
    if rule.window_start != 0 || rule.window_end != 0 {
        let clock = Clock::get()?;
        let hour = ((clock.unix_timestamp % 86400) / 3600) as u8;
        require!(
            hour >= rule.window_start && hour < rule.window_end,
            HookError::OutsideTimeWindow
        );
    }

    // ── 3. Allowlist (sha256 hashes of recipient pubkeys) ──────────────────
    if rule.allowlist_enabled && !rule.allowlist.is_empty() {
        let dest_key = ctx.accounts.destination_token.key();
        let mut hasher = Sha256::new();
        hasher.update(dest_key.as_ref());
        let hash_bytes: [u8; 32] = hasher.finalize().into();
        require!(
            rule.allowlist.contains(&hash_bytes),
            HookError::RecipientNotAllowed
        );
    }

    // ── 4. Daily limit ─────────────────────────────────────────────────────
    // Not enforced: SpendingRule needs `spent_today: u64` and
    // `last_reset_ts: i64` fields before this can be tracked on-chain.

    msg!(
        "HookExecuted: amount={} mint={} dept={}",
        amount,
        ctx.accounts.mint.key(),
        rule.dept_pda,
    );
    Ok(())
}

// ─── Account struct ───────────────────────────────────────────────────────────
// Token-2022 requires accounts in this exact order for execute CPI.
#[derive(Accounts)]
pub struct ExecuteHook<'info> {
    /// Source token account (index 0)
    /// CHECK: Validated by Token-2022; we read the transferring extension flag
    pub source_token: AccountInfo<'info>,

    /// Token-2022 mint (index 1)
    /// CHECK: Validated by Token-2022
    pub mint: AccountInfo<'info>,

    /// Destination token account (index 2)
    /// CHECK: Validated by Token-2022; we hash its key for allowlist check
    pub destination_token: AccountInfo<'info>,

    /// Source token account owner / dept_pda (index 3)
    /// CHECK: Validated by Token-2022; used to derive spending_rule PDA
    pub authority: AccountInfo<'info>,

    /// ExtraAccountMetaList PDA (index 4)
    /// CHECK: Validated by seeds
    #[account(
        seeds = [EXTRA_ACCOUNT_METAS_SEED, mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: AccountInfo<'info>,

    /// SpendingRule PDA from trezo-core (index 5 — the extra account)
    /// seeds: [b"rule", authority (dept_pda)]
    /// Owner check done in handler; deserialized manually.
    /// CHECK: Owner verified in handler; seeds match trezo-core layout
    #[account(
        seeds = [b"rule", authority.key().as_ref()],
        bump,
        seeds::program = trezo_core::ID,
    )]
    pub spending_rule: AccountInfo<'info>,
}

// Bump is resolved separately since we can't use Account<SpendingRule>
// across program boundaries without importing the full type.
// If you add trezo-core as a full dep, replace AccountInfo with Account<SpendingRule>
// and remove the manual deserialization block entirely.