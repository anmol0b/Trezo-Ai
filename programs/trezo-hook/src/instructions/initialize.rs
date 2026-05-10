use anchor_lang::prelude::*;
// use anchor_spl::token_2022::spl_token_2022::extension::transfer_hook::TransferHookAccount;   
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta,
    seeds::Seed,
    state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

// Seeds for ExtraAccountMetaList PDA
// Required by Token-2022 — must use exactly this seed
pub const EXTRA_ACCOUNT_METAS_SEED: &[u8] = b"extra-account-metas";

pub fn handle_initialize_extra_account_meta_list(
    ctx: Context<InitializeExtraAccountMetaList>,
) -> Result<()> {
    let account_metas = vec![
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal { bytes: b"rule".to_vec() },
                Seed::AccountKey { index: 1 },
            ],
            false,
            false,
        )?,
    ];

    let account_size = ExtraAccountMetaList::size_of(account_metas.len())?;

    // Actually allocate the account before writing into it
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(account_size);
    anchor_lang::system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::CreateAccount {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.extra_account_meta_list.to_account_info(),
            },
            &[&[
                EXTRA_ACCOUNT_METAS_SEED,
                ctx.accounts.mint.key().as_ref(),
                &[ctx.bumps.extra_account_meta_list],
            ]],
        ),
        lamports,
        account_size as u64,
        ctx.program_id,
    )?;

    ExtraAccountMetaList::init::<ExecuteInstruction>(
        &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
        &account_metas,
    )?;

    msg!(
        "ExtraAccountMetaList initialized for mint: {}",
        ctx.accounts.mint.key()
    );
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: PDA storing extra account metas — allocated and written by this instruction
    #[account(
        mut,
        seeds = [EXTRA_ACCOUNT_METAS_SEED, mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,
    /// CHECK: Token-2022 mint this hook is attached to
    pub mint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}