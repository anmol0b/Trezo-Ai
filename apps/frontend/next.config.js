/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        "@repo/ui",
        // Prevent SSR from externalizing ESM-only packages with extensionless imports.
        "@solana/wallet-adapter-wallets",
        "@ledgerhq/errors",
    ],
};

export default nextConfig;
