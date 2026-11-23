import Link from "next/link";
import { RadarIcon } from "./icons";

const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/sample", label: "Illustrative report" },
];

export function NavBar({
  variant = "default",
}: {
  variant?: "default" | "home";
}) {
  const isHome = variant === "home";

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        isHome
          ? "border-brand-line bg-brand-cream/95"
          : "border-brand-line bg-background/95"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 px-4 sm:px-6 ${
          isHome ? "gap-y-1 py-2 sm:gap-y-3 sm:py-3" : "gap-y-3 py-3"
        }`}
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              isHome
                ? "border-brand-sage/40 bg-brand-sage-soft text-brand-forest-strong group-hover:border-brand-sage"
                : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 group-hover:border-cyan-300/60"
            }`}
          >
            <RadarIcon className="h-5 w-5" />
          </span>
          <span
            className={`text-lg font-semibold tracking-tight ${
              isHome ? "text-brand-forest" : "text-slate-100"
            }`}
          >
            Blindspot
          </span>
        </Link>

        <Link
          href="/assessment"
          className={`order-2 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:order-3 ${
            isHome
              ? "bg-brand-forest-strong text-white shadow-sm shadow-brand-forest/15 hover:bg-brand-forest-deep"
              : "bg-brand-forest-strong text-white hover:bg-brand-forest-deep"
          }`}
        >
          Start assessment
        </Link>

        <nav
          aria-label="Main navigation"
          className={`order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:order-2 sm:w-auto sm:flex-1 sm:justify-end ${
            isHome ? "justify-between text-brand-muted" : "text-slate-300"
          }`}
        >
          {navigationLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors ${
                isHome ? "hover:text-brand-forest-strong" : "hover:text-cyan-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
