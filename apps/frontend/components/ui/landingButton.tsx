"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const landingButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-base font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        primary:
          "bg-[lab(84.429%_-36.4165_58.8105)] text-black shadow-lg shadow-[lab(84.429%_-36.4165_58.8105)]/25 hover:brightness-95",
        secondary:
          "theme-border theme-text border bg-transparent hover:bg-black/5",
      },
      size: {
        default: "px-7 py-3",
        sm: "px-5 py-2.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type LandingButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof landingButtonVariants> & {
    asChild?: boolean;
  };

export function LandingButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: LandingButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(landingButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

