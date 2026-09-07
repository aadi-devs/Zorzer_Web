import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import GlobeLogo from "@/components/return/GlobeLogo";
import MeteorBackground from "@/components/return/MeteorBackground";
import { fadeUp, staggerContainer, scaleIn } from "@/lib/motion";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <MeteorBackground />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        <motion.div
          className="w-full max-w-md"
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div variants={fadeUp} className="mb-8 flex flex-col items-center text-center">
            <Link to="/dashboard" className="mb-6 inline-flex items-center gap-2.5">
              <motion.span
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10"
                whileHover={{ scale: 1.08, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <GlobeLogo className="h-5 w-5" />
              </motion.span>
              <span className="font-heading text-lg font-semibold tracking-tight">Zorzer Stresser</span>
            </Link>
            <motion.div
              variants={scaleIn}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10"
            >
              <Icon className="h-5 w-5 text-zinc-300" aria-hidden="true" />
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-4 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p variants={fadeUp} className="mt-2 text-sm text-muted-foreground">
                {subtitle}
              </motion.p>
            )}
          </motion.div>

          {/* Card */}
          <motion.div
            variants={scaleIn}
            className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm sm:p-8"
          >
            {children}
          </motion.div>

          {/* Footer */}
          {footer && (
            <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
