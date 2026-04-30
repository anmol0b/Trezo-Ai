use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqkZxJotP7R9R3jJfG8h6Y2G");

const MAX_COMPANY_ID_LEN: usize = 32;
const MAX_DEPT_ID_LEN: usize = 32;
const MAX_DEPT_NAME_LEN: usize = 64;
const MAX_METADATA_URI_LEN: usize = 200;
const MAX_STATUS_LEN: usize = 16;
const MAX_VIEWING_KEY_LEN: usize = 256;
const STATUS_PENDING: &str = "pending";

#[program]
pub mod koshai_core {
    use super::*;

    pub fn initialize_treasury(
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
        treasury.bump = ctx.bumps.treasury_config;

        let agent_authority = &mut ctx.accounts.agent_authority;
        agent_authority.treasury_config = treasury.key();
        agent_authority.agent_pubkey = agent_pubkey;
        agent_authority.proposal_nonce = 0;
        agent_authority.last_action_at = now;
        agent_authority.bump = ctx.bumps.agent_authority;

        Ok(())
    }

    pub fn initialize_department(
        ctx: Context<InitializeDepartment>,
        dept_id: String,
        name: String,
        dept_vault_ata: Pubkey,
        idle_threshold: u64,
    ) -> Result<()> {
        assert_max_len(&dept_id, MAX_DEPT_ID_LEN)?;
        assert_max_len(&name, MAX_DEPT_NAME_LEN)?;

        let now = Clock::get()?.unix_timestamp;
        let treasury = &mut ctx.accounts.treasury_config;

        let dept = &mut ctx.accounts.dept_account;
        dept.treasury_config = treasury.key();
        dept.dept_id = dept_id;
        dept.name = name;
        dept.dept_vault_ata = dept_vault_ata;
        dept.idle_threshold = idle_threshold;
        dept.is_active = true;
        dept.created_at = now;
        dept.bump = ctx.bumps.dept_account;

        let yield_position = &mut ctx.accounts.yield_position;
        yield_position.treasury_config = treasury.key();
        yield_position.dept_pda = dept.key();
        yield_position.company_id = treasury.company_id.clone();
        yield_position.dept_vault_ata = dept_vault_ata;
        yield_position.idle_threshold = idle_threshold;
        yield_position.total_deposited = 0;
        yield_position.last_deposit_at = 0;
        yield_position.is_active = true;
        yield_position.bump = ctx.bumps.yield_position;

        treasury.department_count = treasury
            .department_count
            .checked_add(1)
            .ok_or(KoshaiError::MathOverflow)?;

        Ok(())
    }

    pub fn initialize_oracle(
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

    pub fn register_viewing_key(
        ctx: Context<RegisterViewingKey>,
        encrypted_key: String,
    ) -> Result<()> {
        assert_max_len(&encrypted_key, MAX_VIEWING_KEY_LEN)?;

        let now = Clock::get()?.unix_timestamp;
        let viewing_key = &mut ctx.accounts.viewing_key;
        viewing_key.treasury_config = ctx.accounts.treasury_config.key();
        viewing_key.viewer = ctx.accounts.viewer.key();
        viewing_key.encrypted_key = encrypted_key;
        viewing_key.created_at = now;
        viewing_key.bump = ctx.bumps.viewing_key;
        Ok(())
    }

    pub fn propose_payout(
        ctx: Context<ProposePayout>,
        amount_lamports: u64,
        category: u8,
        metadata_uri: String,
        expiry_timestamp: i64,
    ) -> Result<()> {
        require!(amount_lamports > 0, KoshaiError::InvalidAmount);
        require!(
            expiry_timestamp > Clock::get()?.unix_timestamp,
            KoshaiError::InvalidExpiry
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
        proposal.created_at = now;
        proposal.updated_at = now;
        proposal.bump = ctx.bumps.proposal;

        let treasury = &mut ctx.accounts.treasury_config;
        treasury.proposal_count = treasury
            .proposal_count
            .checked_add(1)
            .ok_or(KoshaiError::MathOverflow)?;

        let agent_authority = &mut ctx.accounts.agent_authority;
        agent_authority.proposal_nonce = agent_authority
            .proposal_nonce
            .checked_add(1)
            .ok_or(KoshaiError::MathOverflow)?;
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

    pub fn deposit_yield(ctx: Context<DepositYield>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let amount = ctx.accounts.dept_account.idle_threshold;

        let yield_position = &mut ctx.accounts.yield_position;
        require!(yield_position.is_active, KoshaiError::YieldInactive);
        yield_position.total_deposited = yield_position
            .total_deposited
            .checked_add(amount)
            .ok_or(KoshaiError::MathOverflow)?;
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

    pub fn trigger_fiat_conversion(ctx: Context<TriggerFiatConversion>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let oracle = &mut ctx.accounts.oracle_config;
        oracle.total_triggers = oracle
            .total_triggers
            .checked_add(1)
            .ok_or(KoshaiError::MathOverflow)?;
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
}

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
#[instruction(dept_id: String)]
pub struct InitializeDepartment<'info> {
    #[account(
        mut,
        constraint = treasury_config.admin == authority.key() @ KoshaiError::UnauthorizedAdmin
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + DepartmentAccount::SPACE,
        seeds = [b"department", treasury_config.key().as_ref(), dept_id.as_bytes()],
        bump
    )]
    pub dept_account: Account<'info, DepartmentAccount>,
    #[account(
        init,
        payer = authority,
        space = 8 + YieldPosition::SPACE,
        seeds = [b"yield", dept_account.key().as_ref()],
        bump
    )]
    pub yield_position: Account<'info, YieldPosition>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeOracle<'info> {
    #[account(
        constraint = treasury_config.admin == authority.key() @ KoshaiError::UnauthorizedAdmin
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
pub struct RegisterViewingKey<'info> {
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(mut)]
    pub viewer: Signer<'info>,
    #[account(
        init,
        payer = viewer,
        space = 8 + ViewingKey::SPACE,
        seeds = [b"viewing_key", treasury_config.key().as_ref(), viewer.key().as_ref()],
        bump
    )]
    pub viewing_key: Account<'info, ViewingKey>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProposePayout<'info> {
    #[account(mut)]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        mut,
        seeds = [b"department", treasury_config.key().as_ref(), dept_account.dept_id.as_bytes()],
        bump = dept_account.bump,
        constraint = dept_account.treasury_config == treasury_config.key() @ KoshaiError::TreasuryMismatch,
        constraint = dept_account.is_active @ KoshaiError::DepartmentInactive
    )]
    pub dept_account: Account<'info, DepartmentAccount>,
    #[account(
        mut,
        seeds = [b"agent", treasury_config.key().as_ref()],
        bump = agent_authority.bump,
        constraint = agent_authority.treasury_config == treasury_config.key() @ KoshaiError::TreasuryMismatch,
        constraint = agent_authority.agent_pubkey == proposer.key() @ KoshaiError::UnauthorizedAgent
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
    /// CHECK: recipient is only stored for later treasury execution.
    pub recipient: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositYield<'info> {
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        seeds = [b"department", treasury_config.key().as_ref(), dept_account.dept_id.as_bytes()],
        bump = dept_account.bump,
        constraint = dept_account.treasury_config == treasury_config.key() @ KoshaiError::TreasuryMismatch,
        constraint = dept_account.is_active @ KoshaiError::DepartmentInactive
    )]
    pub dept_account: Account<'info, DepartmentAccount>,
    #[account(
        mut,
        seeds = [b"yield", dept_account.key().as_ref()],
        bump = yield_position.bump,
        constraint = yield_position.treasury_config == treasury_config.key() @ KoshaiError::TreasuryMismatch,
        constraint = yield_position.dept_pda == dept_account.key() @ KoshaiError::DepartmentMismatch
    )]
    pub yield_position: Account<'info, YieldPosition>,
    #[account(
        mut,
        seeds = [b"agent", treasury_config.key().as_ref()],
        bump = agent_authority.bump,
        constraint = agent_authority.agent_pubkey == agent.key() @ KoshaiError::UnauthorizedAgent
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    pub agent: Signer<'info>,
}

#[derive(Accounts)]
pub struct TriggerFiatConversion<'info> {
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        mut,
        seeds = [b"oracle", treasury_config.key().as_ref()],
        bump = oracle_config.bump,
        constraint = oracle_config.treasury_config == treasury_config.key() @ KoshaiError::TreasuryMismatch
    )]
    pub oracle_config: Account<'info, OracleConfig>,
    #[account(
        mut,
        seeds = [b"agent", treasury_config.key().as_ref()],
        bump = agent_authority.bump,
        constraint = agent_authority.agent_pubkey == agent.key() @ KoshaiError::UnauthorizedAgent
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    pub agent: Signer<'info>,
}

#[account]
pub struct TreasuryConfig {
    pub company_id: String,
    pub admin: Pubkey,
    pub agent_pubkey: Pubkey,
    pub base_mint: Pubkey,
    pub department_count: u16,
    pub proposal_count: u64,
    pub created_at: i64,
    pub bump: u8,
}

impl TreasuryConfig {
    pub const SPACE: usize = string_space(MAX_COMPANY_ID_LEN) + 32 + 32 + 32 + 2 + 8 + 8 + 1;
}

#[account]
pub struct DepartmentAccount {
    pub treasury_config: Pubkey,
    pub dept_id: String,
    pub name: String,
    pub dept_vault_ata: Pubkey,
    pub idle_threshold: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl DepartmentAccount {
    pub const SPACE: usize =
        32 + string_space(MAX_DEPT_ID_LEN) + string_space(MAX_DEPT_NAME_LEN) + 32 + 8 + 1 + 8 + 1;
}

#[account]
pub struct PayoutProposal {
    pub treasury_config: Pubkey,
    pub dept_account: Pubkey,
    pub recipient: Pubkey,
    pub proposer: Pubkey,
    pub nonce: u64,
    pub amount_lamports: u64,
    pub category: u8,
    pub metadata_uri: String,
    pub expiry_timestamp: i64,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl PayoutProposal {
    pub const SPACE: usize = 32
        + 32
        + 32
        + 32
        + 8
        + 8
        + 1
        + string_space(MAX_METADATA_URI_LEN)
        + 8
        + string_space(MAX_STATUS_LEN)
        + 8
        + 8
        + 1;
}

#[account]
pub struct AgentAuthority {
    pub treasury_config: Pubkey,
    pub agent_pubkey: Pubkey,
    pub proposal_nonce: u64,
    pub last_action_at: i64,
    pub bump: u8,
}

impl AgentAuthority {
    pub const SPACE: usize = 32 + 32 + 8 + 8 + 1;
}

#[account]
pub struct YieldPosition {
    pub treasury_config: Pubkey,
    pub dept_pda: Pubkey,
    pub company_id: String,
    pub dept_vault_ata: Pubkey,
    pub idle_threshold: u64,
    pub total_deposited: u64,
    pub last_deposit_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

impl YieldPosition {
    pub const SPACE: usize = 32 + 32 + string_space(MAX_COMPANY_ID_LEN) + 32 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct OracleConfig {
    pub treasury_config: Pubkey,
    pub rate_trigger_micros: u64,
    pub last_observed_rate_micros: u64,
    pub last_trigger_at: i64,
    pub total_triggers: u64,
    pub bump: u8,
}

impl OracleConfig {
    pub const SPACE: usize = 32 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct ViewingKey {
    pub treasury_config: Pubkey,
    pub viewer: Pubkey,
    pub encrypted_key: String,
    pub created_at: i64,
    pub bump: u8,
}

impl ViewingKey {
    pub const SPACE: usize = 32 + 32 + string_space(MAX_VIEWING_KEY_LEN) + 8 + 1;
}

#[error_code]
pub enum KoshaiError {
    #[msg("The provided string is too long for the allocated account.")]
    StringTooLong,
    #[msg("Only the treasury admin can perform this action.")]
    UnauthorizedAdmin,
    #[msg("Only the configured agent can perform this action.")]
    UnauthorizedAgent,
    #[msg("The provided account does not belong to this treasury.")]
    TreasuryMismatch,
    #[msg("The provided department does not match the yield position.")]
    DepartmentMismatch,
    #[msg("This department is inactive.")]
    DepartmentInactive,
    #[msg("This yield position is inactive.")]
    YieldInactive,
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Proposal expiry must be in the future.")]
    InvalidExpiry,
    #[msg("Math overflow.")]
    MathOverflow,
}

fn assert_max_len(value: &str, max: usize) -> Result<()> {
    require!(value.len() <= max, KoshaiError::StringTooLong);
    Ok(())
}

const fn string_space(max_len: usize) -> usize {
    4 + max_len
}
