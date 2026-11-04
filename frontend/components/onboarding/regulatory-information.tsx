import { FileText } from "lucide-react";

import { FileDropzone } from "@/components/onboarding/file-dropzone";
import { SectionCard } from "@/components/onboarding/section-card";
import { TextField, fieldLabelClassName } from "@/components/ui/text-field";
import {
  ONBOARDING_FIELD_IDS,
  type OnboardingErrors,
  type OnboardingFieldChange,
  type OnboardingValues,
} from "@/lib/onboarding";

type RegulatoryInformationProps = {
  values: OnboardingValues;
  errors: OnboardingErrors;
  document: File | null;
  onChange: OnboardingFieldChange;
  onDocumentChange: (file: File | null) => void;
  onFocus: () => void;
};

export function RegulatoryInformation({
  values,
  errors,
  document,
  onChange,
  onDocumentChange,
  onFocus,
}: RegulatoryInformationProps) {
  return (
    <SectionCard
      id="regulatory-information"
      icon={FileText}
      title="Regulatory Information"
      onFocusCapture={onFocus}
    >
      <div className="space-y-5 md:space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6">
          <TextField
            id={ONBOARDING_FIELD_IDS.nafdacDetails}
            label="NAFDAC Registration Details"
            name="nafdacDetails"
            placeholder="e.g. B1-1234"
            autoComplete="off"
            spellCheck={false}
            value={values.nafdacDetails}
            onChange={(event) => onChange("nafdacDetails", event.target.value)}
            error={errors.nafdacDetails}
          />

          <TextField
            id={ONBOARDING_FIELD_IDS.referenceNumber}
            label="Reference Number"
            name="referenceNumber"
            placeholder="Internal or Regulatory ref"
            autoComplete="off"
            spellCheck={false}
            value={values.referenceNumber}
            onChange={(event) =>
              onChange("referenceNumber", event.target.value)
            }
            error={errors.referenceNumber}
          />
        </div>

        <div>
          <p className={`${fieldLabelClassName} mb-2`}>
            Supporting Document Upload
          </p>
          <FileDropzone file={document} onFileChange={onDocumentChange} />
        </div>
      </div>
    </SectionCard>
  );
}
