use anchor_lang::prelude::*;
pub mod instructions;
pub use instructions::*;

declare_id!("8h1qfZ42zcZpTTmYLLG8TrcPurgnGHCD2NHn3nRcZyXH");

#[program]
pub mod trezo_hook {
    use super::*;

    /// Called once when setting up the mint with transfer hook extension.
    /// Registers the extra accounts the hook needs on every transfer.
    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        instructions::initialize::handle_initialize_extra_account_meta_list(ctx)
    }
    /// Called automatically by Token-2022 on every transfer.
    /// Enforces spending rules from trezo-core SpendingRule PDA.
    pub fn execute(
        ctx: Context<ExecuteHook>,
        amount: u64,
    ) -> Result<()> {
        instructions::execute::handle_execute_hook(ctx, amount)
    }
}