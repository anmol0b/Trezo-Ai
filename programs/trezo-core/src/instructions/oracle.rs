use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::TrezoError;

pub fn handle_initialize_oracle(
    ctx: Context<InitializeOracle>,
    rate_trigger_micros: u64,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle_config;
    oracle.treasury_config = ctx.accounts.treasury_config.key();
    oracle.rate_trigger_micros = rate_trigger_micros;
    oracle.last_observed_rate_micros = 0;
    oracle.last_trigger_at = 0;
    oracle.total_triggers = 0;
    oracle.bump = ctx.bumps.oracle_config;
    Ok(())
}

pub fn handle_trigger_fiat_conversion(ctx: Context<TriggerFiatConversion>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let oracle = &mut ctx.accounts.oracle_config;

    oracle.total_triggers = oracle
        .total_triggers
        .checked_add(1)
        .ok_or(TrezoError::MathOverflow)?;
    oracle.last_trigger_at = now;
    oracle.last_observed_rate_micros = oracle.rate_trigger_micros;

    ctx.accounts.agent_authority.last_action_at = now;

    msg!(
        "FiatConversion:{}:{}:{}",
        ctx.accounts.treasury_config.key(),
        oracle.total_triggers,
        oracle.rate_trigger_micros
    );

    Ok(())
}

// ─── Account structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeOracle<'info> {
    #[account(
        constraint = treasury_config.admin == authority.key() @ TrezoError::UnauthorizedAdmin
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + OracleConfig::SPACE,
        seeds = [b"oracle", treasury_config.key().as_ref()],
        bump
    )]
    pub oracle_config: Account<'info, OracleConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TriggerFiatConversion<'info> {
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        mut,
        seeds = [b"oracle", treasury_config.key().as_ref()],
        bump = oracle_config.bump,
        constraint = oracle_config.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch
    )]
    pub oracle_config: Account<'info, OracleConfig>,
    #[account(
        mut,
        seeds = [b"agent", treasury_config.key().as_ref()],
        bump = agent_authority.bump,
        constraint = agent_authority.agent_pubkey == agent.key() @ TrezoError::UnauthorizedAgent
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    pub agent: Signer<'info>,
}