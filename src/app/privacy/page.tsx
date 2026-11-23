import { LegalPage } from "@/components/legal-page";

export default function PrivacyNoticePage() {
  return (
    <LegalPage title="Privacy Notice">
      <p>
        Blindspot uses the answers you submit to calculate your score and
        prepare your report. As part of the assessment, those answers are sent
        to Groq for AI analysis.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Contact</h2>
        <p className="mt-2">
          <a
            href="mailto:blindspot.support@gmail.com"
            className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-200"
          >
            blindspot.support@gmail.com
          </a>
        </p>
      </section>
    </LegalPage>
  );
}
