"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, CloudUpload, FileText, Lock, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import { formatBytes } from "@/lib/format";
import type { DocumentCategory, DocumentItem } from "@/lib/types";

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "experian_report", label: "Experian report" },
  { value: "equifax_report", label: "Equifax report" },
  { value: "transunion_report", label: "TransUnion report" },
  { value: "supporting_document", label: "Supporting document" },
  { value: "identity_theft_documentation", label: "Identity-theft documentation" },
  { value: "account_statement", label: "Account statement" },
  { value: "other", label: "Other documentation" },
];

const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp,.heic";
const MAX_BYTES = 15 * 1024 * 1024;

export function DocumentUploader({
  onUploaded,
  clientId,
}: {
  onUploaded: (document: DocumentItem) => void;
  /** Set when staff upload on a client's behalf from the admin area. */
  clientId?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("experian_report");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [justUploaded, setJustUploaded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const accept = useCallback((candidate: File | undefined | null) => {
    setError(null);
    if (!candidate) return;
    if (candidate.size > MAX_BYTES) {
      setError(`That file is ${formatBytes(candidate.size)}. Files must be 15 MB or smaller.`);
      return;
    }
    if (candidate.size === 0) {
      setError("That file is empty.");
      return;
    }
    setFile(candidate);
    setJustUploaded(null);
  }, []);

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("category", category);
      if (clientId) body.append("client_id", clientId);

      const result = await api.upload<{ document: DocumentItem; message: string }>(
        "/documents",
        body,
      );
      onUploaded(result.document);
      setJustUploaded(result.document.filename);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Document uploaded successfully", result.document.filename);
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : "We couldn't upload that file. Please try again.";
      setError(message);
      toast.error("Upload failed", message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="card-surface p-6">
      <h2 className="font-display text-lg font-bold text-navy-900">Upload a document</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        Credit reports, identity-theft documentation, account statements and other
        supporting files. PDF or image, up to 15 MB.
      </p>

      {justUploaded ? (
        <Alert tone="success" className="mt-5">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4" aria-hidden />
            Document uploaded successfully ✓
          </span>
          <span className="mt-1 block text-sm">
            {justUploaded} was encrypted and added to your file. Your specialist has been
            notified.
          </span>
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      ) : null}

      <Field label="Document type" className="mt-5" htmlFor="doc-category">
        <Select
          id="doc-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as DocumentCategory)}
        >
          {CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          "mt-5 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-brand-500 bg-brand-50/60" : "border-navy-200 bg-navy-50/40",
        )}
      >
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <FileText className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy-900">{file.name}</p>
              <p className="text-xs text-muted">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700"
              aria-label="Remove selected file"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-navy-500 shadow-soft">
              <CloudUpload className="size-6" aria-hidden />
            </span>
            <p className="mt-4 text-sm font-semibold text-navy-900">
              Drag a file here, or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-brand-700 underline underline-offset-2"
              >
                browse your device
              </button>
            </p>
            <p className="mt-1 text-xs text-muted">PDF, PNG, JPG, WEBP or HEIC · max 15 MB</p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(event) => accept(event.target.files?.[0])}
        />
      </div>

      <Button
        onClick={upload}
        disabled={!file}
        loading={uploading}
        size="lg"
        className="mt-5 w-full sm:w-auto"
      >
        {!uploading ? <CloudUpload className="size-4" aria-hidden /> : null}
        Upload document
      </Button>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-brand-600" aria-hidden />
        Files are encrypted at rest and readable only by the staff assigned to your file.
        Documents are never sent or stored in ordinary email.
      </p>
    </section>
  );
}
