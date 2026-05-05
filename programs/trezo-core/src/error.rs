use anchor_lang::prelude::*;

#[error_code]
pub enum TrezoError {
    #[msg("The provided string is too long for the allocated account.")]
    StringTooLong,
    #[msg("Only the treasury admin can perform this action.")]
    UnauthorizedAdmin,
    #[msg("Only the configured agent can perform this action.")]
    UnauthorizedAgent,
    #[msg("The provided account does not belong to this treasury.")]
    TreasuryMismatch,
    #[msg("The provided department does not match the yield position.")]
    DepartmentMismatch,
    #[msg("This department is inactive.")]
    DepartmentInactive,
    #[msg("This yield position is inactive.")]
    YieldInactive,
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Proposal expiry must be in the future.")]
    InvalidExpiry,
    #[msg("Math overflow.")]
    MathOverflow,
    // New — added for missing instructions
    #[msg("Treasury is currently paused.")]
    TreasuryPaused,
    #[msg("Proposal has expired.")]
    ProposalExpired,
    #[msg("Proposal is not in pending status.")]
    ProposalNotPending,
    #[msg("Insufficient approvals to execute payout.")]
    InsufficientApprovals,
    #[msg("This signer has already approved this proposal.")]
    AlreadyApproved,
    #[msg("Signer is not a multisig member.")]
    NotAMember,
    #[msg("Allowlist is full — max 32 entries.")]
    AllowlistFull,
    #[msg("Member limit reached — max 8 members.")]
    MemberLimitReached,
    #[msg("Insufficient funds in department vault.")]
    InsufficientFunds,
}

pub fn assert_max_len(value: &str, max: usize) -> Result<()> {
    require!(value.len() <= max, TrezoError::StringTooLong);
    Ok(())
}

pub const fn string_space(max_len: usize) -> usize {
    4 + max_len
}