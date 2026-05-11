/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/trezo_core.json`.
 */
export type TrezoCore = {
  "address": "47qSrNsBPRje72jF1qfeTvTzkpJz5PUuFw9JBDRsCzDn",
  "metadata": {
    "name": "trezoCore",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "trezo AI core treasury automation program"
  },
  "instructions": [
    {
      "name": "addMultisigMember",
      "discriminator": [
        110,
        222,
        159,
        186,
        6,
        20,
        0,
        211
      ],
      "accounts": [
        {
          "name": "treasuryConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newMember",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "addToAllowlist",
      "discriminator": [
        149,
        143,
        78,
        134,
        241,
        244,
        7,
        56
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "spendingRule",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "spending_rule.dept_pda",
                "account": "spendingRule"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "approvePayout",
      "discriminator": [
        188,
        233,
        111,
        145,
        229,
        102,
        28,
        145
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "approver",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "cancelProposal",
      "discriminator": [
        106,
        74,
        128,
        146,
        19,
        65,
        39,
        23
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createSpendingRule",
      "discriminator": [
        1,
        150,
        102,
        203,
        122,
        160,
        61,
        212
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "deptAccount"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "spendingRule",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "deptAccount"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxSinglePayout",
          "type": "u64"
        },
        {
          "name": "dailyLimit",
          "type": "u64"
        },
        {
          "name": "windowStart",
          "type": "u8"
        },
        {
          "name": "windowEnd",
          "type": "u8"
        }
      ]
    },
    {
      "name": "depositYield",
      "discriminator": [
        204,
        126,
        164,
        36,
        57,
        174,
        68,
        139
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "deptAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  112,
                  97,
                  114,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              },
              {
                "kind": "account",
                "path": "dept_account.dept_id",
                "account": "departmentAccount"
              }
            ]
          }
        },
        {
          "name": "yieldPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "deptAccount"
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              }
            ]
          }
        },
        {
          "name": "agent",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "executePayout",
      "discriminator": [
        12,
        35,
        52,
        7,
        95,
        19,
        169,
        21
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "executor",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeDepartment",
      "discriminator": [
        165,
        149,
        201,
        175,
        160,
        43,
        109,
        122
      ],
      "accounts": [
        {
          "name": "treasuryConfig",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "deptAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  112,
                  97,
                  114,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              },
              {
                "kind": "arg",
                "path": "deptId"
              }
            ]
          }
        },
        {
          "name": "yieldPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "deptAccount"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "deptId",
          "type": "string"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "deptVaultAta",
          "type": "pubkey"
        },
        {
          "name": "idleThreshold",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeOracle",
      "discriminator": [
        144,
        223,
        131,
        120,
        196,
        253,
        181,
        99
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "oracleConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "rateTriggerMicros",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeTreasury",
      "discriminator": [
        124,
        186,
        211,
        195,
        85,
        165,
        129,
        166
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasuryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "companyId"
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "companyId",
          "type": "string"
        },
        {
          "name": "agentPubkey",
          "type": "pubkey"
        },
        {
          "name": "baseMint",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "pauseTreasury",
      "discriminator": [
        51,
        151,
        231,
        204,
        3,
        101,
        24,
        107
      ],
      "accounts": [
        {
          "name": "treasuryConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "proposePayout",
      "discriminator": [
        200,
        59,
        138,
        55,
        239,
        125,
        31,
        165
      ],
      "accounts": [
        {
          "name": "treasuryConfig",
          "writable": true
        },
        {
          "name": "deptAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  112,
                  97,
                  114,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              },
              {
                "kind": "account",
                "path": "dept_account.dept_id",
                "account": "departmentAccount"
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              }
            ]
          }
        },
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              },
              {
                "kind": "account",
                "path": "agent_authority.proposal_nonce",
                "account": "agentAuthority"
              }
            ]
          }
        },
        {
          "name": "recipient"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amountLamports",
          "type": "u64"
        },
        {
          "name": "category",
          "type": "u8"
        },
        {
          "name": "metadataUri",
          "type": "string"
        },
        {
          "name": "expiryTimestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "registerViewingKey",
      "discriminator": [
        11,
        78,
        27,
        120,
        131,
        83,
        119,
        62
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "viewer",
          "writable": true,
          "signer": true
        },
        {
          "name": "viewingKey",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  105,
                  101,
                  119,
                  105,
                  110,
                  103,
                  95,
                  107,
                  101,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              },
              {
                "kind": "account",
                "path": "viewer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "encryptedKey",
          "type": "string"
        }
      ]
    },
    {
      "name": "removeFromAllowlist",
      "discriminator": [
        45,
        46,
        214,
        56,
        189,
        77,
        242,
        227
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "spendingRule",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "spending_rule.dept_pda",
                "account": "spendingRule"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "revokeViewingKey",
      "discriminator": [
        211,
        181,
        33,
        3,
        161,
        82,
        62,
        12
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "viewingKey",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "triggerFiatConversion",
      "discriminator": [
        241,
        253,
        19,
        210,
        31,
        185,
        50,
        163
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "oracleConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              }
            ]
          }
        },
        {
          "name": "agent",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "unpauseTreasury",
      "discriminator": [
        184,
        101,
        205,
        231,
        236,
        105,
        181,
        140
      ],
      "accounts": [
        {
          "name": "treasuryConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "updateSpendingRule",
      "discriminator": [
        27,
        153,
        218,
        90,
        58,
        133,
        211,
        164
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "spendingRule",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  117,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "spending_rule.dept_pda",
                "account": "spendingRule"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "maxSinglePayout",
          "type": "u64"
        },
        {
          "name": "dailyLimit",
          "type": "u64"
        },
        {
          "name": "windowStart",
          "type": "u8"
        },
        {
          "name": "windowEnd",
          "type": "u8"
        }
      ]
    },
    {
      "name": "withdrawYield",
      "discriminator": [
        62,
        9,
        132,
        32,
        96,
        57,
        101,
        82
      ],
      "accounts": [
        {
          "name": "treasuryConfig"
        },
        {
          "name": "deptAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  112,
                  97,
                  114,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              },
              {
                "kind": "account",
                "path": "dept_account.dept_id",
                "account": "departmentAccount"
              }
            ]
          }
        },
        {
          "name": "yieldPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  121,
                  105,
                  101,
                  108,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "deptAccount"
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "treasuryConfig"
              }
            ]
          }
        },
        {
          "name": "agent",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "agentAuthority",
      "discriminator": [
        161,
        225,
        83,
        39,
        179,
        98,
        31,
        118
      ]
    },
    {
      "name": "departmentAccount",
      "discriminator": [
        41,
        117,
        153,
        195,
        164,
        226,
        198,
        53
      ]
    },
    {
      "name": "oracleConfig",
      "discriminator": [
        133,
        196,
        152,
        50,
        27,
        21,
        145,
        254
      ]
    },
    {
      "name": "payoutProposal",
      "discriminator": [
        56,
        243,
        51,
        181,
        13,
        175,
        31,
        185
      ]
    },
    {
      "name": "spendingRule",
      "discriminator": [
        237,
        58,
        119,
        245,
        234,
        221,
        15,
        232
      ]
    },
    {
      "name": "treasuryConfig",
      "discriminator": [
        124,
        54,
        212,
        227,
        213,
        189,
        168,
        41
      ]
    },
    {
      "name": "viewingKey",
      "discriminator": [
        143,
        64,
        81,
        211,
        34,
        230,
        17,
        127
      ]
    },
    {
      "name": "yieldPosition",
      "discriminator": [
        77,
        217,
        160,
        86,
        158,
        186,
        248,
        193
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "stringTooLong",
      "msg": "The provided string is too long for the allocated account."
    },
    {
      "code": 6001,
      "name": "unauthorizedAdmin",
      "msg": "Only the treasury admin can perform this action."
    },
    {
      "code": 6002,
      "name": "unauthorizedAgent",
      "msg": "Only the configured agent can perform this action."
    },
    {
      "code": 6003,
      "name": "treasuryMismatch",
      "msg": "The provided account does not belong to this treasury."
    },
    {
      "code": 6004,
      "name": "departmentMismatch",
      "msg": "The provided department does not match the yield position."
    },
    {
      "code": 6005,
      "name": "departmentInactive",
      "msg": "This department is inactive."
    },
    {
      "code": 6006,
      "name": "yieldInactive",
      "msg": "This yield position is inactive."
    },
    {
      "code": 6007,
      "name": "invalidAmount",
      "msg": "Amount must be greater than zero."
    },
    {
      "code": 6008,
      "name": "invalidExpiry",
      "msg": "Proposal expiry must be in the future."
    },
    {
      "code": 6009,
      "name": "mathOverflow",
      "msg": "Math overflow."
    },
    {
      "code": 6010,
      "name": "treasuryPaused",
      "msg": "Treasury is currently paused."
    },
    {
      "code": 6011,
      "name": "proposalExpired",
      "msg": "Proposal has expired."
    },
    {
      "code": 6012,
      "name": "proposalNotPending",
      "msg": "Proposal is not in pending status."
    },
    {
      "code": 6013,
      "name": "insufficientApprovals",
      "msg": "Insufficient approvals to execute payout."
    },
    {
      "code": 6014,
      "name": "alreadyApproved",
      "msg": "This signer has already approved this proposal."
    },
    {
      "code": 6015,
      "name": "notAMember",
      "msg": "Signer is not a multisig member."
    },
    {
      "code": 6016,
      "name": "allowlistFull",
      "msg": "Allowlist is full — max 32 entries."
    },
    {
      "code": 6017,
      "name": "memberLimitReached",
      "msg": "Member limit reached — max 8 members."
    },
    {
      "code": 6018,
      "name": "insufficientFunds",
      "msg": "Insufficient funds in department vault."
    }
  ],
  "types": [
    {
      "name": "agentAuthority",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasuryConfig",
            "type": "pubkey"
          },
          {
            "name": "agentPubkey",
            "type": "pubkey"
          },
          {
            "name": "proposalNonce",
            "type": "u64"
          },
          {
            "name": "lastActionAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "departmentAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasuryConfig",
            "type": "pubkey"
          },
          {
            "name": "deptId",
            "type": "string"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "deptVaultAta",
            "type": "pubkey"
          },
          {
            "name": "idleThreshold",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "oracleConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasuryConfig",
            "type": "pubkey"
          },
          {
            "name": "rateTriggerMicros",
            "type": "u64"
          },
          {
            "name": "lastObservedRateMicros",
            "type": "u64"
          },
          {
            "name": "lastTriggerAt",
            "type": "i64"
          },
          {
            "name": "totalTriggers",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "payoutProposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasuryConfig",
            "type": "pubkey"
          },
          {
            "name": "deptAccount",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "amountLamports",
            "type": "u64"
          },
          {
            "name": "category",
            "type": "u8"
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "expiryTimestamp",
            "type": "i64"
          },
          {
            "name": "status",
            "type": "string"
          },
          {
            "name": "approvalBitmap",
            "type": "u64"
          },
          {
            "name": "approvalsCount",
            "type": "u8"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "spendingRule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasuryConfig",
            "type": "pubkey"
          },
          {
            "name": "deptPda",
            "type": "pubkey"
          },
          {
            "name": "maxSinglePayout",
            "type": "u64"
          },
          {
            "name": "dailyLimit",
            "type": "u64"
          },
          {
            "name": "allowlistEnabled",
            "type": "bool"
          },
          {
            "name": "allowlist",
            "type": {
              "vec": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "windowStart",
            "type": "u8"
          },
          {
            "name": "windowEnd",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "treasuryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "companyId",
            "type": "string"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "agentPubkey",
            "type": "pubkey"
          },
          {
            "name": "baseMint",
            "type": "pubkey"
          },
          {
            "name": "departmentCount",
            "type": "u16"
          },
          {
            "name": "proposalCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "multisigThreshold",
            "type": "u8"
          },
          {
            "name": "members",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "viewingKey",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasuryConfig",
            "type": "pubkey"
          },
          {
            "name": "viewer",
            "type": "pubkey"
          },
          {
            "name": "encryptedKey",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "yieldPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treasuryConfig",
            "type": "pubkey"
          },
          {
            "name": "deptPda",
            "type": "pubkey"
          },
          {
            "name": "companyId",
            "type": "string"
          },
          {
            "name": "deptVaultAta",
            "type": "pubkey"
          },
          {
            "name": "idleThreshold",
            "type": "u64"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          },
          {
            "name": "lastDepositAt",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
