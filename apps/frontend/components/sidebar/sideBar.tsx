"use client";
import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion, HTMLMotionProps } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

// SidebarBody only accepts children + className — never spreads into motion components
export const SidebarBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
};

// Omit all drag-related HTML event props that conflict with Framer Motion's types
type DesktopSidebarProps = {
  className?: string;
  children?: React.ReactNode;
};

export const DesktopSidebar = ({ className, children }: DesktopSidebarProps) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.div
      className={cn(
        "h-full py-4 hidden md:flex md:flex-col",
        "theme-surface theme-border border-r",
        "shrink-0 overflow-hidden",
        className
      )}
      animate={{
        width: animate ? (open ? "220px" : "56px") : "220px",
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex flex-col h-full w-full overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const { open, setOpen } = useSidebar();

  return (
    <div
      className={cn(
        "h-14 px-4 flex flex-row md:hidden items-center justify-between",
        "theme-surface theme-border border-b w-full"
      )}
    >
      <div className="flex justify-end z-20 w-full">
        <IconMenu2
          className="theme-muted hover:theme-text transition-colors cursor-pointer"
          onClick={() => setOpen(!open)}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={cn(
              "fixed inset-0 z-[100] flex h-full w-full flex-col justify-between",
              "theme-surface p-8",
              className
            )}
          >
            <div
              className="theme-muted absolute right-8 top-8 z-50 hover:theme-text transition-colors cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <IconX />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  const pathname = usePathname();
  const isActive =
    pathname === link.href ||
    (link.href !== "/" && pathname?.startsWith(link.href));

  return (
    <Link
      href={link.href}
      title={!open ? link.label : undefined}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 mx-2 rounded-lg",
        "transition-all duration-150 group/sidebar",
        isActive
          ? "bg-slate-200 text-slate-900 dark:bg-white/[0.08] dark:text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-white/40 dark:hover:bg-white/[0.05] dark:hover:text-white/80",
        className
      )}
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center">
        {link.icon}
      </span>

      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-slate-500 dark:bg-slate-300" />
      )}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
          x: animate ? (open ? 0 : -4) : 0,
        }}
        transition={{ duration: 0.15 }}
        className="whitespace-nowrap text-[13px] font-medium tracking-wide overflow-hidden"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};