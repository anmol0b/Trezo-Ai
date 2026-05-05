use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::{TrezoError, assert_max_len};

const MAX_METADATA_URI_LEN: usize = 200;
const STATUS_PENDING: &str = "pending";
const STATUS_EXECUTED: &str = "executed";
const STATUS_CANCELLED: &str = "cancelled";

pub fn handle_propose_payout(
    ctx: Context<ProposePayout>,
    amount_lamports: u64,
    category: u8,
    metadata_uri: String,
    expiry_timestamp: i64,
) -> Result<()> {
    require!(amount_lamports > 0, TrezoError::InvalidAmount);
    require!(
        expiry_timestamp > Clock::get()?.unix_timestamp,
        TrezoError::InvalidExpiry
    );
    assert_max_len(&metadata_uri, MAX_METADATA_URI_LEN)?;

    let now = Clock::get()?.unix_timestamp;
    let nonce = ctx.accounts.agent_authority.proposal_nonce;

    let proposal = &mut ctx.accounts.proposal;
    proposal.treasury_config = ctx.accounts.treasury_config.key();
    proposal.dept_account = ctx.accounts.dept_account.key();
    proposal.recipient = ctx.accounts.recipient.key();
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.nonce = nonce;
    proposal.amount_lamports = amount_lamports;
    proposal.category = category;
    proposal.metadata_uri = metadata_uri;
    proposal.expiry_timestamp = expiry_timestamp;
    proposal.status = STATUS_PENDING.to_string();
    proposal.approval_bitmap = 0;
    proposal.approvals_count = 0;
    proposal.created_at = now;
    proposal.updated_at = now;
    proposal.bump = ctx.bumps.proposal;

    let treasury = &mut ctx.accounts.treasury_config;
    treasury.proposal_count = treasury
        .proposal_count
        .checked_add(1)
        .ok_or(TrezoError::MathOverflow)?;

    let agent_authority = &mut ctx.accounts.agent_authority;
    agent_authority.proposal_nonce = agent_authority
        .proposal_nonce
        .checked_add(1)
        .ok_or(TrezoError::MathOverflow)?;
    agent_authority.last_action_at = now;

    msg!(
        "PayoutProposal:{}:{}:{}:{}",
        proposal.key(),
        proposal.recipient,
        amount_lamports,
        category
    );

    Ok(())
}

pub fn handle_approve_payout(ctx: Context<ApprovePayout>) -> Result<()> {
    let treasury = &ctx.accounts.treasury_config;
    let proposal = &mut ctx.accounts.proposal;
    let approver = ctx.accounts.approver.key();

    require!(!treasury.is_paused, TrezoError::TreasuryPaused);
    require!(proposal.status == STATUS_PENDING, TrezoError::ProposalNotPending);
    require!(
        Clock::get()?.unix_timestamp < proposal.expiry_timestamp,
        TrezoError::ProposalExpired
    );

    // Find approver index in members list
    let member_index = treasury
        .members
        .iter()
        .position(|m| m == &approver)
        .ok_or(TrezoError::NotAMember)?;

    // Check not already approved using bitmap
    let bit = 1u64 << member_index;
    require!(proposal.approval_bitmap & bit == 0, TrezoError::AlreadyApproved);

    // Set bit and increment count
    proposal.approval_bitmap |= bit;
    proposal.approvals_count = proposal
        .approvals_count
        .checked_add(1)
        .ok_or(TrezoError::MathOverflow)?;
    proposal.updated_at = Clock::get()?.unix_timestamp;

    msg!(
        "ProposalApproved:{}:{}:{}/{}",
        proposal.key(),
        approver,
        proposal.approvals_count,
        treasury.multisig_threshold
    );

    Ok(())
}

pub fn handle_execute_payout(ctx: Context<ExecutePayout>) -> Result<()> {
    let treasury = &ctx.accounts.treasury_config;
    let proposal = &mut ctx.accounts.proposal;

    require!(!treasury.is_paused, TrezoError::TreasuryPaused);
    require!(proposal.status == STATUS_PENDING, TrezoError::ProposalNotPending);
    require!(
        Clock::get()?.unix_timestamp < proposal.expiry_timestamp,
        TrezoError::ProposalExpired
    );
    require!(
        proposal.approvals_count >= treasury.multisig_threshold,
        TrezoError::InsufficientApprovals
    );

    proposal.status = STATUS_EXECUTED.to_string();
    proposal.updated_at = Clock::get()?.unix_timestamp;

    msg!(
        "PayoutExecuted:{}:{}:{}",
        proposal.key(),
        proposal.recipient,
        proposal.amount_lamports
    );

    Ok(())
}

pub fn handle_cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    require!(proposal.status == STATUS_PENDING, TrezoError::ProposalNotPending);
    proposal.status = STATUS_CANCELLED.to_string();
    proposal.updated_at = Clock::get()?.unix_timestamp;
    msg!("ProposalCancelled:{}", proposal.key());
    Ok(())
}

// ─── Account structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct ProposePayout<'info> {
    #[account(mut)]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        mut,
        seeds = [b"department", treasury_config.key().as_ref(), dept_account.dept_id.as_bytes()],
        bump = dept_account.bump,
        constraint = dept_account.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch,
        constraint = dept_account.is_active @ TrezoError::DepartmentInactive
    )]
    pub dept_account: Account<'info, DepartmentAccount>,
    #[account(
        mut,
        seeds = [b"agent", treasury_config.key().as_ref()],
        bump = agent_authority.bump,
        constraint = agent_authority.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch,
        constraint = agent_authority.agent_pubkey == proposer.key() @ TrezoError::UnauthorizedAgent
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    #[account(
        init,
        payer = proposer,
        space = 8 + PayoutProposal::SPACE,
        seeds = [
            b"proposal",
            treasury_config.key().as_ref(),
            &agent_authority.proposal_nonce.to_le_bytes(),
        ],
        bump
    )]
    pub proposal: Account<'info, PayoutProposal>,
    /// CHECK: recipient is only stored for later treasury execution
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApprovePayout<'info> {
    #[account(
        constraint = !treasury_config.is_paused @ TrezoError::TreasuryPaused
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        mut,
        constraint = proposal.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch
    )]
    pub proposal: Account<'info, PayoutProposal>,
    pub approver: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecutePayout<'info> {
    #[account(
        constraint = !treasury_config.is_paused @ TrezoError::TreasuryPaused
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        mut,
        constraint = proposal.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch
    )]
    pub proposal: Account<'info, PayoutProposal>,
    pub executor: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        constraint = treasury_config.admin == authority.key() @ TrezoError::UnauthorizedAdmin
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        mut,
        constraint = proposal.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch
    )]
    pub proposal: Account<'info, PayoutProposal>,
    pub authority: Signer<'info>,
}