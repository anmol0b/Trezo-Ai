use anchor_lang::prelude::*;
use crate::error::string_space;

const MAX_ACTION_LEN: usize = 32;

#[account]
pub struct AuditLog {
    pub treasury_config: Pubkey,
    pub actor: Pubkey,
    pub action: String,
    pub amount: u64,
    pub timestamp: i64,
    pub log_index: u64,
    pub bump: u8,
}

impl AuditLog {
    pub const SPACE: usize = 32
        + 32
        + string_space(MAX_ACTION_LEN)
        + 8    // amount
        + 8    // timestamp
        + 8    // log_index
        + 1;   // bump
}