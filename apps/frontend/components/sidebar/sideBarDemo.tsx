"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./sideBar";
import {
  IconBrandTabler,
  IconBuildingBank,
  IconFileInvoice,
  IconGavel,
  IconReportAnalytics,
  IconSettings,
  IconZoomMoney,
  IconPower,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import ThemeToggle from "../themeToggle";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";

export function SidebarDemo({ children }: { children: React.ReactNode }) {
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <IconBrandTabler className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Department",
      href: "/department",
      icon: <IconBuildingBank className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Invoices",
      href: "/invoices",
      icon: <IconFileInvoice className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Proposal",
      href: "/proposal",
      icon: <IconGavel className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Audit",
      href: "/audit",
      icon: <IconReportAnalytics className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Yield",
      href: "/yield",
      icon: <IconZoomMoney className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
    },
  ];

  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const wallet = useWallet();
  const canDisconnect = status === "authenticated" || wallet.connected;

  // Derive a display name: use wallet address (truncated) or session user name
  const walletAddress = wallet.publicKey?.toBase58();
  const displayName = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : session?.user?.name ?? "demo";

  const handleDisconnect = async () => {
    try {
      await signOut({ redirect: false });
    } finally {
      try {
        if (wallet.connected) await wallet.disconnect();
      } finally {
        router.push("/");
        router.refresh();
      }
    }
  };

  return (
    <div className="theme-bg flex h-screen w-full flex-1 flex-col overflow-hidden md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          {/* Top: logo + nav links */}
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-1">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Bottom: theme toggle + disconnect — no avatar image */}
          <div className="flex flex-col gap-2 px-2">
            <ThemeToggle
              className={cn(
                "theme-border theme-muted w-full rounded-lg border px-3 py-2 hover:theme-text transition-colors",
                !open && "justify-center px-0"
              )}
            />

            {/* Disconnect button — shows icon when collapsed, full text when open */}
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              disabled={!canDisconnect}
              title={!open ? "Disconnect wallet" : undefined}
              className={cn(
                "theme-border theme-muted flex items-center gap-3 rounded-lg border",
                "px-3 py-2 text-[13px] font-medium hover:theme-text transition-all duration-150",
                "disabled:cursor-not-allowed disabled:opacity-40",
                !open && "justify-center px-0"
              )}
            >
              <IconPower className="h-5 w-5 shrink-0" />
              <motion.span
                animate={{
                  display: open ? "block" : "none",
                  opacity: open ? 1 : 0,
                }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Disconnect wallet
              </motion.span>
            </button>

            {/* Wallet / user identity — text only, no image */}
            <div
              title={!open ? displayName : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                "theme-border border",
                !open && "justify-center px-0"
              )}
            >
              {/* Identicon-style monogram instead of a face */}
              <span className="shrink-0 h-6 w-6 rounded-full bg-slate-700 dark:bg-slate-500 flex items-center justify-center text-[11px] font-bold text-white uppercase">
                {displayName.slice(0, 1)}
              </span>
              <motion.span
                animate={{
                  display: open ? "block" : "none",
                  opacity: open ? 1 : 0,
                }}
                transition={{ duration: 0.15 }}
                className="theme-muted whitespace-nowrap text-[13px] overflow-hidden"
              >
                {displayName}
              </motion.span>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export const Logo = () => (
  <a
    href="#"
    className="relative z-20 flex w-full items-center justify-center gap-2 py-1 text-sm font-normal"
  >
    <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-slate-700 dark:bg-slate-500" />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="theme-text font-semibold whitespace-pre"
    >
      Trezo AI
    </motion.span>
  </a>
);

export const LogoIcon = () => (
  <a
    href="#"
    className="relative z-20 flex w-full items-center justify-center py-1"
  >
    <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-slate-700 dark:bg-slate-500" />
  </a>
);