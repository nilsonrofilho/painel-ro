"use client";

import * as React from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light" as const, label: "Claro", icon: Sun },
  { value: "dark" as const, label: "Escuro", icon: Moon },
  { value: "system" as const, label: "Sistema", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Alternar tema"
        title={`Tema: ${OPTIONS.find((o) => o.value === theme)?.label ?? "Sistema"}`}
      >
        <Icon className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border bg-popover shadow-lg">
          {OPTIONS.map((opt) => {
            const ItemIcon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted",
                  active && "bg-muted/60 font-medium",
                )}
              >
                <ItemIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left">{opt.label}</span>
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
