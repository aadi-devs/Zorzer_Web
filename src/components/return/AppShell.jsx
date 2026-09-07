import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Crosshair, CreditCard, Menu, X, ChevronDown,
  MessageCircle, User, History, Settings as SettingsIcon,
  MessageSquare, LogOut, Shield, Inbox,
} from "lucide-react";
import GlobeLogo from "./GlobeLogo";
import MeteorBackground from "./MeteorBackground";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/panel",     label: "Panel",     icon: Crosshair },
  { to: "/pricing",   label: "Plans",     icon: CreditCard },
  { to: "/profile",   label: "Profile",   icon: User },
  { to: "/settings",  label: "Settings",  icon: SettingsIcon },
  { to: "/feedback",  label: "Feedback",  icon: MessageSquare },
];

export default function AppShell() {
  const [open,     setOpen]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

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
        <motion.aside
          className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-card/40 backdrop-blur-sm lg:flex"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <SidebarContent
            linkClass={linkClass}
            logout={logout}
            isAdmin={isAdmin}
            displayName={displayName}
            email={user?.email}
          />
        </motion.aside>

        {/* Sidebar — mobile drawer */}
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
              <motion.aside
                className="absolute left-0 top-0 h-full w-72 border-r border-white/[0.06] bg-card p-4"
                initial={{ x: -288 }}
                animate={{ x: 0 }}
                exit={{ x: -288 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <SidebarContent
                  linkClass={linkClass}
                  logout={logout}
                  isAdmin={isAdmin}
                  displayName={displayName}
                  email={user?.email}
                  onNavigate={() => setOpen(false)}
                />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <motion.header
            className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-background/70 px-4 backdrop-blur-sm lg:px-6"
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3">
              <button
                className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground lg:hidden"
                onClick={() => setOpen(v => !v)}
                aria-label="Menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={open ? "x" : "menu"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </motion.span>
                </AnimatePresence>
              </button>
              <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
                <GlobeLogo className="h-5 w-5" />
                <span className="font-medium">Zorzer Stresser</span>
              </Link>
              <span className="hidden text-xs uppercase tracking-wider text-muted-foreground lg:block">
                Zorzer Stresser Console
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/10 sm:flex"
                >
                  <Shield className="h-3 w-3" /> Admin
                </Link>
              )}
              <span className="inline-flex items-center rounded-md border border-border/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                L4 / L7
              </span>

              {/* Account dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium hover:bg-white/[0.06]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-white/25 via-zinc-500/40 to-white/15 text-[10px] font-semibold ring-1 ring-white/10">
                    {initials}
                  </span>
                  <span className="hidden max-w-[120px] truncate sm:block">{displayName}</span>
                  <motion.span
                    animate={{ rotate: menuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <motion.div
                        className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-xl"
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="border-b border-white/[0.06] px-4 py-3">
                          <p className="truncate text-xs font-medium">{displayName}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
                          {isAdmin && (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-400">
                              <Shield className="h-2.5 w-2.5" /> Admin
                            </span>
                          )}
                        </div>
                        <div className="p-1">
                          {[
                            { to: "/profile",  icon: User,          label: "Profile",       className: "text-muted-foreground" },
                            { to: "/settings", icon: SettingsIcon,  label: "Settings",      className: "text-muted-foreground" },
                          ].map(({ to, icon: Icon, label, className }, i) => (
                            <motion.div
                              key={to}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                            >
                              <Link
                                to={to}
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-white/[0.06] hover:text-foreground ${className}`}
                              >
                                <Icon className="h-3.5 w-3.5" /> {label}
                              </Link>
                            </motion.div>
                          ))}
                          {isAdmin && (
                            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
                              <Link
                                to="/admin"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-amber-400 transition-colors hover:bg-amber-500/10"
                              >
                                <Shield className="h-3.5 w-3.5" /> Admin panel
                              </Link>
                            </motion.div>
                          )}
                          <div className="my-1 border-t border-white/[0.06]" />
                          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                            <button
                              onClick={() => { setMenuOpen(false); logout(); }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                            >
                              <LogOut className="h-3.5 w-3.5" /> Sign out
                            </button>
                          </motion.div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.header>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ linkClass, logout, isAdmin, displayName, email, onNavigate }) {
  const allLinks = [
    ...NAV,
    { to: "/discord", label: "Discord", icon: MessageCircle },
  ];

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/dashboard" className="flex items-center gap-2.5 px-2" onClick={onNavigate}>
        <motion.span
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10"
          whileHover={{ scale: 1.08, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <GlobeLogo className="h-5 w-5" />
        </motion.span>
        <div className="flex flex-col">
          <span className="font-semibold leading-tight">Zorzer Stresser</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Console</span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
        {allLinks.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 + 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <NavLink to={item.to} className={linkClass} onClick={onNavigate}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          </motion.div>
        ))}
        {isAdmin && (
          <>
            {[
              { to: "/admin",          icon: Shield, label: "Admin",          cls: "text-amber-400" },
              { to: "/admin/feedback", icon: Inbox,  label: "Feedback inbox", cls: "text-amber-400" },
              { to: "/activity",       icon: History, label: "Activity",      cls: "text-amber-400" },
            ].map((item, i) => (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (allLinks.length + i) * 0.04 + 0.1 }}
              >
                <NavLink to={item.to} className={linkClass} onClick={onNavigate}>
                  <item.icon className={`h-4 w-4 ${item.cls}`} />
                  <span className={item.cls}>{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </>
        )}
      </nav>

      <div className="space-y-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="truncate text-xs font-medium">{displayName}</p>
          <p className="truncate text-[10px] text-muted-foreground">{email}</p>
          <Link
            to="/pricing"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black ring-1 ring-white/10 hover:bg-zinc-200 transition-colors"
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
