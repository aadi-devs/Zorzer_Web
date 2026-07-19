import { useMemo } from "react";

export default function MeteorBackground({ count = 12 }) {
  const meteors = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        top: Math.floor(Math.random() * 100),
        left: Math.floor(Math.random() * 100),
        delay: (Math.random() * 6).toFixed(2),
        duration: (Math.random() * 8 + 4).toFixed(2),
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {meteors.map((m, i) => (
        <span
          key={i}
          className="animate-meteor absolute h-0.5 w-0.5 rounded-full bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        >
          <span className="absolute top-1/2 -translate-y-1/2 left-0 h-px w-16 bg-gradient-to-r from-white/70 to-transparent" />
        </span>
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_55%)]" />
    </div>
  );
}