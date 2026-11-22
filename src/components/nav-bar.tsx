import { RadarIcon } from "./icons";

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)] transition group-hover:border-cyan-300/60">
            <RadarIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-100">
            Blindspot
          </span>
        </a>
        <span className="max-w-[70%] truncate rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium tracking-wide text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.2)] sm:text-xs">
          Niche: Co-Founder Equity Diagnostics
        </span>
      </div>
    </header>
  );
}
