import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive" | "accent" | "primary";
  trend?: { value: number; label?: string };
}

const variantStyles: Record<NonNullable<KPICardProps["variant"]>, string> = {
  default: "bg-card",
  success: "bg-success/5 border-success/30",
  warning: "bg-warning/5 border-warning/30",
  destructive: "bg-destructive/5 border-destructive/30",
  accent: "bg-accent/5 border-accent/30",
  primary: "bg-primary/5 border-primary/30",
};

const iconStyles: Record<NonNullable<KPICardProps["variant"]>, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  accent: "bg-accent/15 text-accent",
  primary: "bg-primary/15 text-primary",
};

export function KPICard({
  label,
  value,
  hint,
  icon,
  variant = "default",
  trend,
}: KPICardProps) {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", variantStyles[variant])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {value}
            </p>
            {hint && (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "mt-2 text-xs font-medium",
                  trend.value >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
                {trend.label && ` ${trend.label}`}
              </p>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                iconStyles[variant],
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
