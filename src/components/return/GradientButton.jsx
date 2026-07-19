import { Link } from "react-router-dom";

export default function GradientButton({ to, children, variant = "primary", className = "" }) {
  const inner =
    variant === "primary"
      ? "bg-black text-white ring-1 ring-white/10"
      : "bg-zinc-900/95 text-zinc-200 ring-1 ring-white/[0.06]";
  return (
    <Link
      to={to}
      className={`group relative inline-flex max-w-full min-w-0 p-px focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black bg-gradient-to-b from-white/25 via-zinc-500/40 to-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[box-shadow,filter] duration-200 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_24px_rgba(255,255,255,0.08)] rounded-full ${className}`}
    >
      <span
        className={`relative z-10 flex min-h-0 min-w-0 flex-1 items-center gap-2 rounded-full font-medium px-4 py-2 text-xs w-full justify-center sm:w-auto ${inner}`}
      >
        {children}
      </span>
    </Link>
  );
}