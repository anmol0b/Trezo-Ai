use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::{TrezoError, assert_max_len};

const MAX_COMPANY_ID_LEN: usize = 32;

pub fn handle_initialize_treasury(
    ctx: Context<InitializeTreasury>,
    company_id: String,
    agent_pubkey: Pubkey,
    base_mint: Pubkey,
) -> Result<()> {
    assert_max_len(&company_id, MAX_COMPANY_ID_LEN)?;

    let now = Clock::get()?.unix_timestamp;
    let treasury = &mut ctx.accounts.treasury_config;
    treasury.company_id = company_id;
    treasury.admin = ctx.accounts.authority.key();
    treasury.agent_pubkey = agent_pubkey;
    treasury.base_mint = base_mint;
    treasury.department_count = 0;
    treasury.proposal_count = 0;
    treasury.created_at = now;
    treasury.is_paused = false;
    treasury.multisig_threshold = 1;
    treasury.members = vec![ctx.accounts.authority.key()];
    treasury.bump = ctx.bumps.treasury_config;

    let agent_authority = &mut ctx.accounts.agent_authority;
    agent_authority.treasury_config = treasury.key();
    agent_authority.agent_pubkey = agent_pubkey;
    agent_authority.proposal_nonce = 0;
    agent_authority.last_action_at = now;
    agent_authority.bump = ctx.bumps.agent_authority;

    Ok(())
}

pub fn handle_pause_treasury(ctx: Context<PauseTreasury>) -> Result<()> {
    ctx.accounts.treasury_config.is_paused = true;
    msg!("Treasury paused by {}", ctx.accounts.authority.key());
    Ok(())
}

pub fn handle_unpause_treasury(ctx: Context<UnpauseTreasury>) -> Result<()> {
    ctx.accounts.treasury_config.is_paused = false;
    msg!("Treasury unpaused by {}", ctx.accounts.authority.key());
    Ok(())
}

pub fn handle_add_multisig_member(
    ctx: Context<AddMultisigMember>,
    new_member: Pubkey,
) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury_config;
    require!(treasury.members.len() < 8, TrezoError::MemberLimitReached);
    require!(!treasury.members.contains(&new_member), TrezoError::AlreadyApproved);
    treasury.members.push(new_member);
    msg!("Added multisig member: {}", new_member);
    Ok(())
}

// ─── Account structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(company_id: String)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + TreasuryConfig::SPACE,
        seeds = [b"treasury", company_id.as_bytes()],
        bump
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        init,
        payer = authority,
        space = 8 + AgentAuthority::SPACE,
        seeds = [b"agent", treasury_config.key().as_ref()],
        bump
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PauseTreasury<'info> {
    #[account(
        mut,
        constraint = treasury_config.admin == authority.key() @ TrezoError::UnauthorizedAdmin
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UnpauseTreasury<'info> {
    #[account(
        mut,
        constraint = treasury_config.admin == authority.key() @ TrezoError::UnauthorizedAdmin
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddMultisigMember<'info> {
    #[account(
        mut,
        constraint = treasury_config.admin == authority.key() @ TrezoError::UnauthorizedAdmin
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    pub authority: Signer<'info>,
}