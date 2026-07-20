import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import GlobeLogo from "./GlobeLogo";
import { staggerContainer, fadeUp } from "@/lib/motion";

const LINKS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Panel",     to: "/panel"     },
  { label: "Plans",     to: "/pricing"   },
  { label: "Discord",   to: "/discord"   },
  { label: "Feedback",  to: "/feedback"  },
];

export default function SiteFooter() {
  return (
    <motion.footer
      className="relative z-10 border-t border-white/[0.06] bg-card/40 backdrop-blur-sm"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10"
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <GlobeLogo className="h-5 w-5 opacity-90" />
            </motion.div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold">Zorzer Stresser</span>
              <span className="inline-flex w-fit items-center rounded-md border border-border/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                L4 / L7
              </span>
            </div>
          </div>
          <motion.nav
            className="flex flex-wrap gap-2"
            aria-label="Footer"
            variants={staggerContainer(0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {LINKS.map((l) => (
              <motion.div key={l.to} variants={fadeUp}>
                <Link
                  to={l.to}
                  className="rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/[0.06] pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Zorzer Stresser. All rights reserved.</p>
          <p>Built for maximum power · Layer 4 &amp; Layer 7</p>
        </div>
      </div>
    </motion.footer>
  );
}
