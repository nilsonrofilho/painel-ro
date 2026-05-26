"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <DialogContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactElement;
  asChild?: boolean;
}) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("DialogTrigger must be inside Dialog");
  const childProps = (children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props;
  const onClick = (e: React.MouseEvent) => {
    childProps.onClick?.(e);
    ctx.onOpenChange(true);
  };
  if (asChild) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, { onClick });
  }
  return <button onClick={onClick}>{children}</button>;
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(DialogContext);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!ctx?.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctx.onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [ctx]);

  if (!ctx?.open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={() => ctx.onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => ctx.onOpenChange(false)}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mb-4 flex flex-col space-y-1.5", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none", className)}>
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}

export function DialogFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
