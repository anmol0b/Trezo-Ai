use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::TrezoError;

// ─── Handlers ────────────────────────────────────────────────────────────────

pub fn handle_create_spending_rule(
    ctx: Context<CreateSpendingRule>,
    max_single_payout: u64,
    daily_limit: u64,
    window_start: u8,
    window_end: u8,
) -> Result<()> {
    let rule = &mut ctx.accounts.spending_rule;
    rule.treasury_config = ctx.accounts.treasury_config.key();
    rule.dept_pda = ctx.accounts.dept_account.key();
    rule.max_single_payout = max_single_payout;
    rule.daily_limit = daily_limit;
    rule.allowlist_enabled = false;
    rule.allowlist = vec![];
    rule.window_start = window_start;
    rule.window_end = window_end;
    rule.bump = ctx.bumps.spending_rule;

    msg!(
        "SpendingRuleCreated:{}:{}:{}",
        ctx.accounts.dept_account.key(),
        max_single_payout,
        daily_limit
    );

    Ok(())
}

pub fn handle_update_spending_rule(
    ctx: Context<UpdateSpendingRule>,
    max_single_payout: u64,
    daily_limit: u64,
    window_start: u8,
    window_end: u8,
) -> Result<()> {
    let rule = &mut ctx.accounts.spending_rule;
    rule.max_single_payout = max_single_payout;
    rule.daily_limit = daily_limit;
    rule.window_start = window_start;
    rule.window_end = window_end;

    msg!(
        "SpendingRuleUpdated:{}:{}:{}",
        rule.dept_pda,
        max_single_payout,
        daily_limit
    );

    Ok(())
}

pub fn handle_add_to_allowlist(
    ctx: Context<UpdateSpendingRule>,
    hash: [u8; 32],
) -> Result<()> {
    let rule = &mut ctx.accounts.spending_rule;
    require!(rule.allowlist.len() < 32, TrezoError::AllowlistFull);
    require!(!rule.allowlist.contains(&hash), TrezoError::AlreadyApproved);
    rule.allowlist.push(hash);
    rule.allowlist_enabled = true;

    msg!("AllowlistEntryAdded:{}", rule.dept_pda);

    Ok(())
}

pub fn handle_remove_from_allowlist(
    ctx: Context<UpdateSpendingRule>,
    hash: [u8; 32],
) -> Result<()> {
    let rule = &mut ctx.accounts.spending_rule;
    rule.allowlist.retain(|h| h != &hash);

    if rule.allowlist.is_empty() {
        rule.allowlist_enabled = false;
    }

    msg!("AllowlistEntryRemoved:{}", rule.dept_pda);

    Ok(())
}

// ─── Account structs ──────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct CreateSpendingRule<'info> {
    #[account(
        constraint = treasury_config.admin == authority.key() @ TrezoError::UnauthorizedAdmin
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        constraint = dept_account.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch,
        constraint = dept_account.is_active @ TrezoError::DepartmentInactive
    )]
    pub dept_account: Account<'info, DepartmentAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + SpendingRule::SPACE,
        seeds = [b"rule", dept_account.key().as_ref()],
        bump
    )]
    pub spending_rule: Account<'info, SpendingRule>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateSpendingRule<'info> {
    #[account(
        constraint = treasury_config.admin == authority.key() @ TrezoError::UnauthorizedAdmin
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        mut,
        seeds = [b"rule", spending_rule.dept_pda.as_ref()],
        bump = spending_rule.bump,
        constraint = spending_rule.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch
    )]
    pub spending_rule: Account<'info, SpendingRule>,
    pub authority: Signer<'info>,
}