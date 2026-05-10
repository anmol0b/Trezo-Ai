use anchor_lang::prelude::*;
use crate::error::string_space;

const MAX_DEPT_ID_LEN: usize = 32;
const MAX_DEPT_NAME_LEN: usize = 64;

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
    pub const SPACE: usize = 32
        + string_space(MAX_DEPT_ID_LEN)
        + string_space(MAX_DEPT_NAME_LEN)
        + 32   // dept_vault_ata
        + 8    // idle_threshold
        + 1    // is_active
        + 8    // created_at
        + 1;   // bump
}