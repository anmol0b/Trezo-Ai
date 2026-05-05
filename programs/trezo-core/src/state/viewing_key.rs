use anchor_lang::prelude::*;
use crate::error::string_space;

const MAX_VIEWING_KEY_LEN: usize = 256;

#[account]
pub struct ViewingKey {
    pub treasury_config: Pubkey,
    pub viewer: Pubkey,
    pub encrypted_key: String,
    pub created_at: i64,
    pub bump: u8,
}

impl ViewingKey {
    pub const SPACE: usize = 32
        + 32
        + string_space(MAX_VIEWING_KEY_LEN)
        + 8    // created_at
        + 1;   // bump
}