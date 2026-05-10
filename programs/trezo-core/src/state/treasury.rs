use anchor_lang::prelude::*;
use crate::error::string_space;

const MAX_COMPANY_ID_LEN: usize = 32;
const MAX_MEMBERS: usize = 8;

#[account]
pub struct TreasuryConfig {
    pub company_id: String,
    pub admin: Pubkey,
    pub agent_pubkey: Pubkey,
    pub base_mint: Pubkey,
    pub department_count: u16,
    pub proposal_count: u64,
    pub created_at: i64,
    pub is_paused: bool,
    pub multisig_threshold: u8,
    pub members: Vec<Pubkey>,
    pub bump: u8,
}

impl TreasuryConfig {
    pub const SPACE: usize = string_space(MAX_COMPANY_ID_LEN)
        + 32   // admin
        + 32   // agent_pubkey
        + 32   // base_mint
        + 2    // department_count
        + 8    // proposal_count
        + 8    // created_at
        + 1    // is_paused
        + 1    // multisig_threshold
        + 4 + (32 * MAX_MEMBERS)  // members vec
        + 1;   // bump
}