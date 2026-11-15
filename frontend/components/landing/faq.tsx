import { Minus, Plus } from "lucide-react";

import { LandingContainer } from "@/components/landing/container";
import { SectionLabel } from "@/components/landing/section-label";

const FAQS = [
  {
    question: "How do I verify a product?",
    answer:
      "Scan the SabiCheck QR or visit the SabiCheck verification website, enter the product\u2019s unique UVC, then read the verification response.",
  },
  {
    question: "Is the QR code the same as the UVC?",
    answer:
      "No. The uniform QR opens the verification page. The UVC is unique to the product and is entered to run the check.",
  },
  {
    question: "Can I verify without internet access?",
    answer:
      "USSD is planned for phones without internet access. Dial the shortcode and follow the UVC prompts. The shortcode will be announced at launch.",
  },
  {
    question: "How can I report a suspicious product?",
    answer:
      "Submit the product details and describe your concern. Photos are optional for web reports only; USSD does not support photo uploads.",
  },
  {
    question: "What can manufacturers manage?",
    answer:
      "Register products and batches, manage codes, allocate to distributors, view verification analytics and review consumer reports.",
  },
  {
    question: "Which languages will be supported?",
    answer:
      "We\u2019re planning English, Yoruba, Hausa, Igbo and Nigerian Pidgin support. Availability will be confirmed as we roll out.",
  },
] as const;

export function Faq() {
  return (
    <section id="faqs" className="scroll-mt-24 bg-white py-20 lg:py-24">
      <LandingContainer className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <SectionLabel>A little more clarity</SectionLabel>
          <h2 className="mt-4 font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-land-green sm:text-[44px] lg:text-[48px]">
            Good questions.
            <br />
            Clear answers.
          </h2>
          <p className="mt-4 text-[17px] leading-7 text-land-muted">
            Here&rsquo;s what to know before your first SabiCheck.
          </p>
        </div>

        <div className="border-t border-land-line">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              open
              className="group border-b border-land-line py-5"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px] font-semibold leading-6 text-land-ink [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span className="relative mt-0.5 h-4 w-4 shrink-0 text-land-green">
                  <Minus
                    aria-hidden="true"
                    className="absolute inset-0 h-4 w-4 group-open:block hidden"
                    strokeWidth={2.5}
                  />
                  <Plus
                    aria-hidden="true"
                    className="absolute inset-0 h-4 w-4 group-open:hidden"
                    strokeWidth={2.5}
                  />
                </span>
              </summary>
              <p className="mt-3 pr-10 text-[15px] leading-6 text-land-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
