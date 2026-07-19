import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Crosshair,
  CreditCard,
  Menu,
  X,
  ChevronDown,
  MessageCircle,
  User,
  History,
  Settings as SettingsIcon,
  MessageSquare,
} from "lucide-react";
import GlobeLogo from "./GlobeLogo";
import MeteorBackground from "./MeteorBackground";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, route: true },
  { to: "/panel", label: "Panel", icon: Crosshair, route: true },
  { to: "/pricing", label: "Plans", icon: CreditCard, route: true },
  { to: "/profile", label: "Profile", icon: User, route: true },
  { to: "/activity", label: "Activity", icon: History, route: true },
  { to: "/settings", label: "Settings", icon: SettingsIcon, route: true },
  { to: "/feedback", label: "Feedback", icon: MessageSquare, route: true },
];

export default function AppShell() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-white/[0.06] text-foreground ring-1 ring-white/10"
        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
    }`;

  return (
    <div className="relative min-h-dvh">
      <MeteorBackground />
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar - desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-card/40 backdrop-blur-sm lg:flex">
          <SidebarContent linkClass={linkClass} />
        </aside>

        {/* Sidebar - mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/[0.06] bg-card p-4">
              <SidebarContent linkClass={linkClass} onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-background/70 px-4 backdrop-blur-sm lg:px-6">
            <div className="flex items-center gap-3">
              <button
                className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground lg:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-label="Menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
                <GlobeLogo className="h-5 w-5" />
                <span className="font-medium">ReturnStress</span>
              </Link>
              <span className="hidden text-xs uppercase tracking-wider text-muted-foreground lg:block">
                ReturnStress Console
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-border/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                L4 / L7
              </span>
              <button className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium hover:bg-white/[0.06]">
                <span className="h-6 w-6 rounded-full bg-gradient-to-b from-white/25 via-zinc-500/40 to-white/15 ring-1 ring-white/10" />
                Account
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ linkClass, onNavigate }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/dashboard" className="flex items-center gap-2.5 px-2" onClick={onNavigate}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
          <GlobeLogo className="h-5 w-5" />
        </span>
        <div className="flex flex-col">
          <span className="font-semibold leading-tight">ReturnStress</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Console</span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
        {NAV.map((item) =>
          item.route ? (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={onNavigate}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ) : (
            <a
              key={item.label}
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
              onClick={onNavigate}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          )
        )}
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          onClick={onNavigate}
        >
          <MessageCircle className="h-4 w-4" />
          Discord
        </a>
      </nav>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="text-xs font-medium">Plan snapshot</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Basic plan · 600s · 1 concurrent</p>
        <Link
          to="/pricing"
          className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black ring-1 ring-white/10 hover:bg-zinc-200"
          onClick={onNavigate}
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
}