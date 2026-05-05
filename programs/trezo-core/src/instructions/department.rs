use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::{TrezoError, assert_max_len};

const MAX_DEPT_ID_LEN: usize = 32;
const MAX_DEPT_NAME_LEN: usize = 64;

pub fn handle_initialize_department(
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
        .ok_or(TrezoError::MathOverflow)?;

    Ok(())
}

// ─── Account structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(dept_id: String)]
pub struct InitializeDepartment<'info> {
    #[account(
        mut,
        constraint = treasury_config.admin == authority.key() @ TrezoError::UnauthorizedAdmin
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