/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/trezo_hook.json`.
 */
export type TrezoHook = {
  "address": "AkVudTF3DrGYYHeEC3ACL8LRB77GQF7G8N63ZMTX6kYe",
  "metadata": {
    "name": "trezoHook",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "execute",
      "docs": [
        "Called automatically by Token-2022 on every transfer.",
        "Enforces spending rules from trezo-core SpendingRule PDA."
      ],
      "discriminator": [
        130,
        221,
        242,
        154,
        13,
        193,
        189,
        29
      ],
      "accounts": [
        {
          "name": "sourceToken",
          "docs": [
            "Source token account (index 0)"
          ]
        },
        {
          "name": "mint",
          "docs": [
            "Token-2022 mint (index 1)"
          ]
        },
        {
          "name": "destinationToken",
          "docs": [
            "Destination token account (index 2)"
          ]
        },
        {
          "name": "authority",
          "docs": [
            "Source token account owner / dept_pda (index 3)"
          ]
        },
        {
          "name": "extraAccountMetaList",
          "docs": [
            "ExtraAccountMetaList PDA (index 4)"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "spendingRule",
          "docs": [
            "SpendingRule PDA from trezo-core (index 5 — the extra account)",
            "seeds: [b\"rule\", authority (dept_pda)]",
            "Owner check done in handler; deserialized manually."
          ],
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
                "path": "authority"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                46,
                83,
                82,
                200,
                185,
                112,
                223,
                176,
                29,
                9,
                186,
                166,
                120,
                117,
                125,
                250,
                228,
                179,
                1,
                108,
                47,
                192,
                248,
                201,
                12,
                149,
                6,
                201,
                219,
                77,
                224,
                193
              ]
            }
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeExtraAccountMetaList",
      "docs": [
        "Called once when setting up the mint with transfer hook extension.",
        "Registers the extra accounts the hook needs on every transfer."
      ],
      "discriminator": [
        92,
        197,
        174,
        197,
        41,
        124,
        19,
        3
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "extraAccountMetaList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "exceedsMaxPayout",
      "msg": "Transfer amount exceeds max single payout rule."
    },
    {
      "code": 6001,
      "name": "outsideTimeWindow",
      "msg": "Transfer is outside the allowed time window."
    },
    {
      "code": 6002,
      "name": "recipientNotAllowed",
      "msg": "Recipient is not in the allowlist."
    },
    {
      "code": 6003,
      "name": "notTransferring",
      "msg": "Hook must be invoked by Token-2022 during an active transfer."
    },
    {
      "code": 6004,
      "name": "invalidSpendingRule",
      "msg": "SpendingRule account is invalid or owned by wrong program."
    }
  ]
};
