use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::TrezoError;

pub fn handle_deposit_yield(ctx: Context<DepositYield>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let amount = ctx.accounts.dept_account.idle_threshold;

    let yield_position = &mut ctx.accounts.yield_position;
    require!(yield_position.is_active, TrezoError::YieldInactive);

    yield_position.total_deposited = yield_position
        .total_deposited
        .checked_add(amount)
        .ok_or(TrezoError::MathOverflow)?;
    yield_position.last_deposit_at = now;

    ctx.accounts.agent_authority.last_action_at = now;

    msg!(
        "YieldDeposit:{}:{}:{}",
        ctx.accounts.dept_account.key(),
        yield_position.dept_vault_ata,
        amount
    );

    Ok(())
}

pub fn handle_withdraw_yield(ctx: Context<WithdrawYield>, amount: u64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let yield_position = &mut ctx.accounts.yield_position;

    require!(yield_position.is_active, TrezoError::YieldInactive);
    require!(
        yield_position.total_deposited >= amount,
        TrezoError::InsufficientFunds
    );

    yield_position.total_deposited = yield_position
        .total_deposited
        .checked_sub(amount)
        .ok_or(TrezoError::MathOverflow)?;

    ctx.accounts.agent_authority.last_action_at = now;

    msg!(
        "YieldWithdraw:{}:{}:{}",
        ctx.accounts.dept_account.key(),
        yield_position.dept_vault_ata,
        amount
    );

    Ok(())
}

// ─── Account structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct DepositYield<'info> {
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        seeds = [b"department", treasury_config.key().as_ref(), dept_account.dept_id.as_bytes()],
        bump = dept_account.bump,
        constraint = dept_account.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch,
        constraint = dept_account.is_active @ TrezoError::DepartmentInactive
    )]
    pub dept_account: Account<'info, DepartmentAccount>,
    #[account(
        mut,
        seeds = [b"yield", dept_account.key().as_ref()],
        bump = yield_position.bump,
        constraint = yield_position.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch,
        constraint = yield_position.dept_pda == dept_account.key() @ TrezoError::DepartmentMismatch
    )]
    pub yield_position: Account<'info, YieldPosition>,
    #[account(
        mut,
        seeds = [b"agent", treasury_config.key().as_ref()],
        bump = agent_authority.bump,
        constraint = agent_authority.agent_pubkey == agent.key() @ TrezoError::UnauthorizedAgent
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    pub agent: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawYield<'info> {
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        seeds = [b"department", treasury_config.key().as_ref(), dept_account.dept_id.as_bytes()],
        bump = dept_account.bump,
        constraint = dept_account.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch
    )]
    pub dept_account: Account<'info, DepartmentAccount>,
    #[account(
        mut,
        seeds = [b"yield", dept_account.key().as_ref()],
        bump = yield_position.bump,
        constraint = yield_position.dept_pda == dept_account.key() @ TrezoError::DepartmentMismatch
    )]
    pub yield_position: Account<'info, YieldPosition>,
    #[account(
        mut,
        seeds = [b"agent", treasury_config.key().as_ref()],
        bump = agent_authority.bump,
        constraint = agent_authority.agent_pubkey == agent.key() @ TrezoError::UnauthorizedAgent
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    pub agent: Signer<'info>,
}