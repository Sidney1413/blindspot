import { LegalPage } from "@/components/legal-page";

export default function TermsOfUsePage() {
  return (
    <LegalPage title="Terms of Use">
      <section>
        <h2 className="text-lg font-semibold text-slate-100">
          What Blindspot provides
        </h2>
        <p className="mt-2">
          Blindspot provides a founder partnership assessment to help identify
          topics to discuss about ownership, work, decisions, money, roles, and
          work created for the business. The score reflects signals in the
          answers; it is not the chance that a business will fail.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">
          Not professional advice
        </h2>
        <p className="mt-2">
          The assessment and AI analysis are for general information and
          discussion. They are not legal, tax, investment, or financial advice
          and do not replace advice from a qualified professional. AI analysis
          may be incomplete or mistaken; check important findings against your
          actual agreements and circumstances.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">
          Your decisions
        </h2>
        <p className="mt-2">
          Use the report as a starting point for discussion, not as a substitute
          for reviewing and documenting decisions with your co-founder and
          qualified advisers.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Contact</h2>
        <p className="mt-2">
          For questions about these terms, email{" "}
          <a
            href="mailto:blindspot.support@gmail.com"
            className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-200"
          >
            blindspot.support@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
