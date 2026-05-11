//todo

// // lib/auth/wallet.ts
// import { SignJWT, jwtVerify } from "jose"

// // 1. Generate a nonce (store in Redis/DB)
// export async function generateNonce(walletAddress: string) {
//   const nonce = crypto.randomUUID()
//   await db.nonces.set(walletAddress, nonce, { ttl: 300 }) // 5 min
//   return nonce
// }

// // 2. After user signs, verify signature on server
// export async function verifyAndCreateSession(
//   walletAddress: string,
//   signature: string,
//   nonce: string
// ) {
//   // Verify signature (Solana example)
//   const message = `Sign in to Kosh-AI\nNonce: ${nonce}`
//   const isValid = nacl.sign.detached.verify(
//     new TextEncoder().encode(message),
//     bs58.decode(signature),
//     bs58.decode(walletAddress)
//   )
//   if (!isValid) throw new Error("Invalid signature")

//   // Create JWT with wallet address as the user identifier
//   const token = await new SignJWT({ wallet: walletAddress })
//     .setProtectedHeader({ alg: "HS256" })
//     .setExpirationTime("7d")
//     .sign(new TextEncoder().encode(process.env.JWT_SECRET))

//   return token
// }