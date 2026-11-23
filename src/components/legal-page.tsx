import type { ReactNode } from "react";
import { NavBar } from "./nav-bar";
import { SiteFooter } from "./site-footer";

type LegalPageProps = {
  title: string;
  children: ReactNode;
};

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <NavBar />
      <main className="mx-auto min-h-[65vh] max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="mt-3 font-serif text-4xl tracking-tight text-slate-50 sm:text-5xl">
          {title}
        </h1>
        <div className="mt-8 space-y-8 text-sm leading-7 text-slate-300">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
