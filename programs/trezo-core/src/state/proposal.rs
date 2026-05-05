use anchor_lang::prelude::*;
use crate::error::string_space;

const MAX_METADATA_URI_LEN: usize = 200;
const MAX_STATUS_LEN: usize = 16;

#[account]
pub struct PayoutProposal {
    pub treasury_config: Pubkey,
    pub dept_account: Pubkey,
    pub recipient: Pubkey,
    pub proposer: Pubkey,
    pub nonce: u64,
    pub amount_lamports: u64,
    pub category: u8,
    pub metadata_uri: String,
    pub expiry_timestamp: i64,
    pub status: String,
    pub approval_bitmap: u64,
    pub approvals_count: u8,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl PayoutProposal {
    pub const SPACE: usize = 32  // treasury_config
        + 32   // dept_account
        + 32   // recipient
        + 32   // proposer
        + 8    // nonce
        + 8    // amount_lamports
        + 1    // category
        + string_space(MAX_METADATA_URI_LEN)
        + 8    // expiry_timestamp
        + string_space(MAX_STATUS_LEN)
        + 8    // approval_bitmap
        + 1    // approvals_count
        + 8    // created_at
        + 8    // updated_at
        + 1;   // bump
}