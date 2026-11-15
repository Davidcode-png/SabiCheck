import type { Metadata } from "next";

import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The principles behind using SabiCheck to check product codes and report concerns.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p className="font-medium text-land-ink">
        Our full Terms of Use are being finalised.
      </p>
      <p>
        SabiCheck helps consumers check product codes and report concerns. A
        verification response reflects the records a manufacturer has shared.
        It is not by itself a guarantee that a product is genuine.
      </p>
      <p>
        Always inspect the product and packaging, and report anything that looks
        wrong. Questions? Email{" "}
        <a
          href="mailto:hello@sabicheck.com"
          className="font-medium text-land-green underline underline-offset-2"
        >
          hello@sabicheck.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
