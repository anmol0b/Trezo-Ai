use anchor_lang::prelude::*;

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