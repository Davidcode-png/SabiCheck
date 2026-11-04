"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState, type ReactNode } from "react";

import { TextField } from "./text-field";

type PasswordFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  labelAction?: ReactNode;
  id?: string;
  containerClassName?: string;
  labelClassName?: string;
};

export function PasswordField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder = "••••••••",
  autoComplete = "current-password",
  labelAction,
  id,
  containerClassName,
  labelClassName,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      id={id}
      label={label}
      icon={LockKeyhole}
      name={name}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      error={error}
      labelAction={labelAction}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          title={visible ? "Hide password" : "Show password"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="h-[18px] w-[18px]" />
          ) : (
            <Eye aria-hidden="true" className="h-[18px] w-[18px]" />
          )}
        </button>
      }
    />
  );
}
