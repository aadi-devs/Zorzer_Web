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
  LogOut,
} from "lucide-react";
import GlobeLogo from "./GlobeLogo";
import MeteorBackground from "./MeteorBackground";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/panel",     label: "Panel",     icon: Crosshair },
  { to: "/pricing",   label: "Plans",     icon: CreditCard },
  { to: "/profile",   label: "Profile",   icon: User },
  { to: "/activity",  label: "Activity",  icon: History },
  { to: "/settings",  label: "Settings",  icon: SettingsIcon },
  { to: "/feedback",  label: "Feedback",  icon: MessageSquare },
];

export default function AppShell() {
  const [open, setOpen]         = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout }        = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-white/[0.06] text-foreground ring-1 ring-white/10"
        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
    }`;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account";
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative min-h-dvh">
      <MeteorBackground />
      <div className="relative z-10 flex min-h-screen">

        {/* Sidebar — desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-card/40 backdrop-blur-sm lg:flex">
          <SidebarContent linkClass={linkClass} logout={logout} displayName={displayName} email={user?.email} />
        </aside>

        {/* Sidebar — mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/[0.06] bg-card p-4">
              <SidebarContent
                linkClass={linkClass}
                logout={logout}
                displayName={displayName}
                email={user?.email}
                onNavigate={() => setOpen(false)}
              />
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

              {/* Account dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium hover:bg-white/[0.06]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-white/25 via-zinc-500/40 to-white/15 text-[10px] font-semibold ring-1 ring-white/10">
                    {initials}
                  </span>
                  <span className="hidden max-w-[120px] truncate sm:block">{displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-xl">
                      <div className="border-b border-white/[0.06] px-4 py-3">
                        <p className="text-xs font-medium truncate">{displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          to="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                        >
                          <User className="h-3.5 w-3.5" /> Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                        >
                          <SettingsIcon className="h-3.5 w-3.5" /> Settings
                        </Link>
                        <div className="my-1 border-t border-white/[0.06]" />
                        <button
                          onClick={() => { setMenuOpen(false); logout(); }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          <LogOut className="h-3.5 w-3.5" /> Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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

function SidebarContent({ linkClass, logout, displayName, email, onNavigate }) {
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
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={onNavigate}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
          onClick={onNavigate}
        >
          <MessageCircle className="h-4 w-4" />
          Discord
        </a>
      </nav>

      {/* User info + logout at bottom */}
      <div className="space-y-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-xs font-medium truncate">{displayName}</p>
          <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          <Link
            to="/pricing"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black ring-1 ring-white/10 hover:bg-zinc-200"
            onClick={onNavigate}
          >
            Upgrade
          </Link>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
