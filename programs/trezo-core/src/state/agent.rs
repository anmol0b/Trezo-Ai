use anchor_lang::prelude::*;

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