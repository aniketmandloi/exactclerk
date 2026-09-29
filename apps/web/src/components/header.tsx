"use client";
import { cn } from "@exactclerk/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="cn-font-heading font-bold text-base [font-stretch:125%]">
              ExactClerk
            </span>
            <span className="hidden font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-widest sm:inline">
              Texas
            </span>
          </Link>
          {session && (
            <nav className="flex gap-4 font-medium text-sm">
              <Link
                href="/dashboard"
                aria-current={pathname === "/dashboard" ? "page" : undefined}
                className={cn(
                  "text-muted-foreground transition-colors hover:text-foreground",
                  pathname === "/dashboard" && "text-foreground",
                )}
              >
                Dashboard
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
