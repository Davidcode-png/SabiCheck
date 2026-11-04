import type { Metadata } from "next";

import { CheckJourney } from "@/components/consumer/check-journey";

export const metadata: Metadata = {
  title: "Check a product code",
  description:
    "Verify a SabiCheck product code and report a concern about a product.",
};

export default function CheckPage() {
  return <CheckJourney />;
}
