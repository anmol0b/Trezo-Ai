use anchor_lang::prelude::*;

const MAX_ALLOWLIST_ENTRIES: usize = 32;

#[account]
pub struct SpendingRule {
    pub treasury_config: Pubkey,
    pub dept_pda: Pubkey,
    pub max_single_payout: u64,
    pub daily_limit: u64,
    pub allowlist_enabled: bool,
    pub allowlist: Vec<[u8; 32]>,
    pub window_start: u8,
    pub window_end: u8,
    pub bump: u8,
}

impl SpendingRule {
    pub const SPACE: usize = 32  // treasury_config
        + 32   // dept_pda
        + 8    // max_single_payout
        + 8    // daily_limit
        + 1    // allowlist_enabled
        + 4 + (32 * MAX_ALLOWLIST_ENTRIES)  // allowlist vec
        + 1    // window_start
        + 1    // window_end
        + 1;   // bump
}