import type { Metadata } from "next";

import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SabiCheck handles the details you share while joining the waitlist.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="font-medium text-land-ink">
        Our full Privacy Policy is being finalised.
      </p>
      <p>
        We are preparing a clear explanation of what SabiCheck collects, why we
        collect it and the choices you have. In the meantime, if you have a
        question about your data, contact us at{" "}
        <a
          href="mailto:hello@sabicheck.com"
          className="font-medium text-land-green underline underline-offset-2"
        >
          hello@sabicheck.com
        </a>
        .
      </p>
      <p>
        When you join the waitlist, we store the name, email address and
        audience type you provide so we can send launch news and early-access
        updates. You can ask us to remove those details at any time.
      </p>
    </LegalPage>
  );
}
