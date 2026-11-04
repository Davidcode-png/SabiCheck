"use client";

import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { TextField } from "@/components/ui/text-field";

export function CodeEntryScreen({
  code,
  onCodeChange,
  onSubmit,
  loading,
  fieldError,
  formError,
}: {
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  fieldError: string | null;
  formError: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div>
        <h1 className="font-display text-[30px] font-bold leading-[38px] text-brand-ink">
          Enter verification code
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-muted">
          Scratch off the label to get the concealed code
        </p>
      </div>

      <form
        className="mt-9"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <TextField
          id="consumer-product-code"
          label="Product code"
          name="code"
          value={code}
          onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
          placeholder="SCQR7H2K9A"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          inputClassName="font-mono text-[17px] uppercase tracking-[0.12em]"
          error={fieldError ?? undefined}
        />

        {formError ? (
          <FormAlert className="mt-4">{formError}</FormAlert>
        ) : null}

        <Button type="submit" className="mt-8" loading={loading}>
          <Send aria-hidden="true" className="h-[18px] w-[18px]" />
          Continue
        </Button>
      </form>
    </div>
  );
}
