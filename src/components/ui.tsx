"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

// Badge
export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        className
      )}
    >
      {children}
    </span>
  );
}

// Button
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-accent-green text-black hover:bg-accent-green/90": variant === "primary",
            "bg-white/10 text-text-primary hover:bg-white/15": variant === "secondary",
            "bg-accent-red/20 text-accent-red hover:bg-accent-red/30": variant === "danger",
            "text-text-secondary hover:text-text-primary hover:bg-white/5": variant === "ghost",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-sm": size === "md",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Input
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg bg-bg-tertiary border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Select
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full rounded-lg bg-bg-tertiary border border-white/10 px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";

// Textarea
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg bg-bg-tertiary border border-white/10 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50 focus:ring-1 focus:ring-accent-green/20 transition-colors resize-y min-h-[80px]",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// Card
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-bg-card border border-white/5 p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

// Modal
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary border border-white/10 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Label
export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-text-secondary mb-1.5">
      {children}
    </label>
  );
}

// Stat Card
export function StatCard({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <p className="text-text-muted text-sm">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
    </Card>
  );
}

// Empty state
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-12 h-12 text-text-muted mb-4" />
      <h3 className="text-lg font-medium text-text-secondary">{title}</h3>
      <p className="text-sm text-text-muted mt-1">{description}</p>
    </div>
  );
}
