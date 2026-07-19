import { Link } from "react-router-dom";
import GlobeLogo from "./GlobeLogo";

const LINKS = [
{ label: "Features", to: "/dashboard" },
{ label: "Platform", to: "/panel" },
{ label: "Plans", to: "/pricing" },
{ label: "Resolver", to: "/dashboard" },
{ label: "API", to: "/dashboard" },
{ label: "FAQ", to: "/dashboard" },
{ label: "Terms", to: "/dashboard" }];


export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-card/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
              <GlobeLogo className="h-5 w-5 opacity-90" />
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold">Zorzer Stresser</span>
              <span className="inline-flex w-fit items-center rounded-md border border-border/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                L4 / L7
              </span>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Footer">
            {LINKS.map((l) => null







            )}
          </nav>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Zorzer Stresser. All rights reserved.</p>
          <p>Built for maximum power · Layer 4 &amp; Layer 7</p>
        </div>
      </div>
    </footer>);

}