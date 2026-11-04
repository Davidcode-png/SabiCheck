"use client";

import { CloudUpload, FileCheck2, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import { cn } from "@/lib/cn";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileDropzoneProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
};

export function FileDropzone({ file, onFileChange }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const errorId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();

  function acceptFile(nextFile: File | undefined) {
    if (!nextFile) return;

    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setError("Upload a PDF, PNG, or JPG file.");
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      setError("The file must be 10MB or smaller.");
      return;
    }

    setError(undefined);
    onFileChange(nextFile);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={(event) => {
          acceptFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div
        onClick={openPicker}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDragging(true);
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center rounded-[15px] border-2 border-dashed border-line bg-canvas/20 px-5 py-8 text-center transition-colors md:min-h-[268px]",
          dragging && "border-brand bg-brand-soft/40",
          error && "border-error/50",
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand"
        >
          <CloudUpload className="h-6 w-6" />
        </span>

        <span className="mt-4 text-[15px] font-semibold leading-6 text-brand-ink">
          Click to upload or drag and drop
        </span>
        <span id={hintId} className="mt-1 text-xs leading-5 text-muted">
          PDF, PNG, JPG (Max. 10MB)
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openPicker();
          }}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-label shadow-[0_1px_2px_rgb(16_24_40_/_0.04)] transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
        >
          Select File
        </button>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] leading-5 text-error">
          {error}
        </p>
      ) : null}

      {file ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3 shadow-[0_1px_2px_rgb(16_24_40_/_0.03)]">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
          >
            <FileCheck2 className="h-4 w-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-brand-ink">
              {file.name}
            </span>
            <span className="block text-xs text-muted">
              {formatFileSize(file.size)}
            </span>
          </span>

          <button
            type="button"
            onClick={() => {
              onFileChange(null);
              setError(undefined);
            }}
            aria-label={`Remove ${file.name}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-error focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
