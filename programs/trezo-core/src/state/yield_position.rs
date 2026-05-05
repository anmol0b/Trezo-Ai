use anchor_lang::prelude::*;
use crate::error::string_space;

const MAX_COMPANY_ID_LEN: usize = 32;

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
    pub const SPACE: usize = 32
        + 32
        + string_space(MAX_COMPANY_ID_LEN)
        + 32   // dept_vault_ata
        + 8    // idle_threshold
        + 8    // total_deposited
        + 8    // last_deposit_at
        + 1    // is_active
        + 1;   // bump
}