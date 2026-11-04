"use client";

import { ImagePlus, X } from "lucide-react";
import { useId, useRef, useState } from "react";

import { fieldLabelClassName } from "@/components/ui/text-field";
import { cn } from "@/lib/cn";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_HINT,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MIN_DIMENSION,
} from "@/lib/register-product";

type ProductImageFieldProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
};

type Preview = {
  file: File;
  url: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      reject(new Error("Could not decode image"));
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

export function ProductImageField({
  file,
  onFileChange,
}: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const errorId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const [preview, setPreview] = useState<Preview | null>(null);

  const currentPreview = file && preview?.file === file ? preview.url : null;

  function openPicker() {
    inputRef.current?.click();
  }

  async function acceptFile(nextFile: File | undefined) {
    if (!nextFile) return;

    if (!PRODUCT_IMAGE_ACCEPT.split(",").includes(nextFile.type)) {
      setError("Choose a JPG or PNG image.");
      return;
    }

    if (nextFile.size > PRODUCT_IMAGE_MAX_BYTES) {
      setError("Choose an image that is 5 MB or smaller.");
      return;
    }

    try {
      const { width, height } = await readImageDimensions(nextFile);

      if (
        width < PRODUCT_IMAGE_MIN_DIMENSION ||
        height < PRODUCT_IMAGE_MIN_DIMENSION
      ) {
        setError(
          `Choose an image at least ${PRODUCT_IMAGE_MIN_DIMENSION} × ${PRODUCT_IMAGE_MIN_DIMENSION} px.`,
        );
        return;
      }
    } catch {
      setError("We couldn't read that image. Choose a different file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview({ file: nextFile, url: reader.result });
      }
    };
    reader.onerror = () => setPreview(null);
    reader.readAsDataURL(nextFile);

    setError(undefined);
    onFileChange(nextFile);
  }

  function removeFile() {
    onFileChange(null);
    setPreview(null);
    setError(undefined);

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    void acceptFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="w-full">
      <p className={fieldLabelClassName}>Product image (optional)</p>

      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          void acceptFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <button
        type="button"
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
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        className={cn(
          "mt-2 flex min-h-[114px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-dash-line bg-canvas/30 px-4 py-5 text-center transition-colors hover:border-line-strong",
          dragging && "border-brand bg-brand-soft/40",
          error && "border-error/50",
        )}
      >
        <ImagePlus
          aria-hidden="true"
          className="h-6 w-6 text-brand-ink"
          strokeWidth={1.7}
        />
        <span className="mt-2 text-sm font-semibold leading-5 text-brand-ink">
          Choose image
        </span>
        <span id={hintId} className="mt-1 text-[13px] leading-5 text-dash-muted">
          {PRODUCT_IMAGE_HINT}
        </span>
      </button>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-[13px] leading-5 text-error"
        >
          {error}
        </p>
      ) : null}

      {file ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-dash-line bg-white px-3.5 py-3">
          {currentPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentPreview}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg border border-dash-line object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-dash-soft text-brand-ink"
            >
              <ImagePlus className="h-5 w-5" />
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-brand-ink">
              {file.name}
            </span>
            <span className="block text-xs text-dash-muted">
              {formatFileSize(file.size)}
            </span>
          </span>

          <button
            type="button"
            onClick={removeFile}
            aria-label={`Remove ${file.name}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dash-muted transition-colors hover:bg-canvas hover:text-error focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
