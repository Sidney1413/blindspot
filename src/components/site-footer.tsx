import Link from "next/link";

export function SiteFooter({
  variant = "default",
}: {
  variant?: "default" | "home" | "assessment";
}) {
  if (variant === "home") {
    return (
      <footer
        id="contact"
        className="relative border-t border-brand-line bg-brand-cream-muted"
      >
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
            <nav
              aria-label="Footer"
              className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-brand-muted"
            >
              <Link href="/privacy" className="hover:text-brand-forest-strong">
                Privacy Notice
              </Link>
              <Link href="/terms" className="hover:text-brand-forest-strong">
                Terms of Use
              </Link>
              <Link href="/#contact" className="hover:text-brand-forest-strong">
                Contact
              </Link>
            </nav>
            <a
              href="mailto:blindspot.support@gmail.com"
              className="text-xs text-brand-muted hover:text-brand-forest-strong"
            >
              blindspot.support@gmail.com
            </a>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-slate-500">
            Blindspot provides general information, not legal, tax, investment,
            or financial advice.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      id="contact"
      className="border-t border-brand-line bg-brand-cream-muted"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto_auto] md:items-start">
        <div>
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-brand-forest hover:text-brand-forest-strong"
          >
            Blindspot
          </Link>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
            A clearer view of your founder partnership before you commit.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-muted"
        >
          <Link href="/privacy" className="hover:text-brand-forest-strong">
            Privacy Notice
          </Link>
          <Link href="/terms" className="hover:text-brand-forest-strong">
            Terms of Use
          </Link>
          <Link href="/#contact" className="hover:text-brand-forest-strong">
            Contact
          </Link>
        </nav>

        <div>
          {variant !== "assessment" ? (
            <h2 className="text-sm font-semibold text-brand-forest">Contact</h2>
          ) : null}
          <p
            className={`text-sm text-brand-muted ${
              variant === "assessment" ? "" : "mt-2"
            }`}
          >
            <a
              href="mailto:blindspot.support@gmail.com"
              className="hover:text-brand-forest-strong"
            >
              blindspot.support@gmail.com
            </a>
          </p>
        </div>

        <p className="border-t border-brand-line pt-5 text-xs leading-5 text-slate-500 md:col-span-3">
          Blindspot provides general information, not legal, tax, investment, or
          financial advice.
        </p>
      </div>
    </footer>
  );
}
