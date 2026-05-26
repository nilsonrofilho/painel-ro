import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Caminho"
      className={cn(
        "flex items-center gap-1 overflow-x-auto text-sm text-muted-foreground scrollbar-thin",
        className,
      )}
    >
      <Link
        href="/"
        className="flex items-center hover:text-foreground"
        aria-label="Início"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1 whitespace-nowrap">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast && "font-medium text-foreground",
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
