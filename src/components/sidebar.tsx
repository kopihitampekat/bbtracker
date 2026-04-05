"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Bug,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/search";
import { UserButton } from "@clerk/nextjs";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/targets", label: "Targets", icon: Target },
  { href: "/findings", label: "Findings", icon: Bug },
  { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-bg-secondary border-r border-white/5 flex flex-col">
      <div className="p-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-accent-green" />
          <span className="text-lg font-bold tracking-tight">BB Tracker</span>
        </Link>
      </div>
      <div className="px-3 pt-3">
        <SearchBar />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-accent-green/10 text-accent-green"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              <Icon className="w-4.5 h-4.5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-text-muted">BB Tracker v0.1</span>
        <UserButton />
      </div>
    </aside>
  );
}
