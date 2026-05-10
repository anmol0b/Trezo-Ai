use anchor_lang::prelude::*;

pub mod error;
pub mod state;
pub mod instructions;


use instructions::*;

declare_id!("47qSrNsBPRje72jF1qfeTvTzkpJz5PUuFw9JBDRsCzDn");

#[program]
pub mod trezo_core {
    use super::*;

    // ─── Treasury ─────────────────────────────────────────────────────────────

    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        company_id: String,
        agent_pubkey: Pubkey,
        base_mint: Pubkey,
    ) -> Result<()> {
        instructions::treasury::handle_initialize_treasury(ctx, company_id, agent_pubkey, base_mint)
    }

    pub fn pause_treasury(ctx: Context<PauseTreasury>) -> Result<()> {
        instructions::treasury::handle_pause_treasury(ctx)
    }

    pub fn unpause_treasury(ctx: Context<UnpauseTreasury>) -> Result<()> {
        instructions::treasury::handle_unpause_treasury(ctx)
    }

    pub fn add_multisig_member(
        ctx: Context<AddMultisigMember>,
        new_member: Pubkey,
    ) -> Result<()> {
        instructions::treasury::handle_add_multisig_member(ctx, new_member)
    }

    // ─── Department ───────────────────────────────────────────────────────────

    pub fn initialize_department(
        ctx: Context<InitializeDepartment>,
        dept_id: String,
        name: String,
        dept_vault_ata: Pubkey,
        idle_threshold: u64,
    ) -> Result<()> {
        instructions::department::handle_initialize_department(
            ctx, dept_id, name, dept_vault_ata, idle_threshold,
        )
    }

    // ─── Proposals ────────────────────────────────────────────────────────────

    pub fn propose_payout(
        ctx: Context<ProposePayout>,
        amount_lamports: u64,
        category: u8,
        metadata_uri: String,
        expiry_timestamp: i64,
    ) -> Result<()> {
        instructions::proposal::handle_propose_payout(
            ctx, amount_lamports, category, metadata_uri, expiry_timestamp,
        )
    }

    pub fn approve_payout(ctx: Context<ApprovePayout>) -> Result<()> {
        instructions::proposal::handle_approve_payout(ctx)
    }

    pub fn execute_payout(ctx: Context<ExecutePayout>) -> Result<()> {
        instructions::proposal::handle_execute_payout(ctx)
    }

    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        instructions::proposal::handle_cancel_proposal(ctx)
    }

    // ─── Spending rules ───────────────────────────────────────────────────────

    pub fn create_spending_rule(
        ctx: Context<CreateSpendingRule>,
        max_single_payout: u64,
        daily_limit: u64,
        window_start: u8,
        window_end: u8,
    ) -> Result<()> {
        instructions::spending_rule::handle_create_spending_rule(
            ctx, max_single_payout, daily_limit, window_start, window_end,
        )
    }

    pub fn update_spending_rule(
        ctx: Context<UpdateSpendingRule>,
        max_single_payout: u64,
        daily_limit: u64,
        window_start: u8,
        window_end: u8,
    ) -> Result<()> {
        instructions::spending_rule::handle_update_spending_rule(
            ctx, max_single_payout, daily_limit, window_start, window_end,
        )
    }

    pub fn add_to_allowlist(
        ctx: Context<UpdateSpendingRule>,
        hash: [u8; 32],
    ) -> Result<()> {
        instructions::spending_rule::handle_add_to_allowlist(ctx, hash)
    }

    pub fn remove_from_allowlist(
        ctx: Context<UpdateSpendingRule>,
        hash: [u8; 32],
    ) -> Result<()> {
        instructions::spending_rule::handle_remove_from_allowlist(ctx, hash)
    }

    // ─── Yield ────────────────────────────────────────────────────────────────

    pub fn deposit_yield(ctx: Context<DepositYield>) -> Result<()> {
        instructions::yield_mgmt::handle_deposit_yield(ctx)
    }

    pub fn withdraw_yield(ctx: Context<WithdrawYield>, amount: u64) -> Result<()> {
        instructions::yield_mgmt::handle_withdraw_yield(ctx, amount)
    }

    // ─── Oracle ───────────────────────────────────────────────────────────────

    pub fn initialize_oracle(
        ctx: Context<InitializeOracle>,
        rate_trigger_micros: u64,
    ) -> Result<()> {
        instructions::oracle::handle_initialize_oracle(ctx, rate_trigger_micros)
    }

    pub fn trigger_fiat_conversion(ctx: Context<TriggerFiatConversion>) -> Result<()> {
        instructions::oracle::handle_trigger_fiat_conversion(ctx)
    }

    // ─── Privacy ──────────────────────────────────────────────────────────────

    pub fn register_viewing_key(
        ctx: Context<RegisterViewingKey>,
        encrypted_key: String,
    ) -> Result<()> {
        instructions::privacy::handle_register_viewing_key(ctx, encrypted_key)
    }

    pub fn revoke_viewing_key(ctx: Context<RevokeViewingKey>) -> Result<()> {
        instructions::privacy::handle_revoke_viewing_key(ctx)
    }
}