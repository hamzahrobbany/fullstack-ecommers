"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed",
      secondary: "bg-neutral-200 text-neutral-900 hover:bg-neutral-300",
      outline:
        "border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-semibold transition",
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
