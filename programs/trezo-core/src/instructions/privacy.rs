use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::{TrezoError, assert_max_len};

const MAX_VIEWING_KEY_LEN: usize = 256;

pub fn handle_register_viewing_key(
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

pub fn handle_revoke_viewing_key(ctx: Context<RevokeViewingKey>) -> Result<()> {
    // Closing the account returns rent to admin
    // Anchor handles this via close = authority constraint
    msg!("ViewingKeyRevoked:{}", ctx.accounts.viewing_key.viewer);
    Ok(())
}

// ─── Account structs ─────────────────────────────────────────────────────────

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
pub struct RevokeViewingKey<'info> {
    #[account(
        constraint = treasury_config.admin == authority.key() @ TrezoError::UnauthorizedAdmin
    )]
    pub treasury_config: Account<'info, TreasuryConfig>,
    #[account(
        mut,
        close = authority,
        constraint = viewing_key.treasury_config == treasury_config.key() @ TrezoError::TreasuryMismatch
    )]
    pub viewing_key: Account<'info, ViewingKey>,
    #[account(mut)]
    pub authority: Signer<'info>,
}