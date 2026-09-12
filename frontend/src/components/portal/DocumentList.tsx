"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

import { Badge, EmptyState, type BadgeTone } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/format";
import type { DocumentItem } from "@/lib/types";

const STATUS_TONE: Record<DocumentItem["status"], BadgeTone> = {
  received: "blue",
  in_review: "amber",
  reviewed: "brand",
  action_needed: "red",
};

const STATUS_LABEL: Record<DocumentItem["status"], string> = {
  received: "Received",
  in_review: "In review",
  reviewed: "Reviewed",
  action_needed: "Action needed",
};

export function DocumentList({
  documents,
  emptyDescription = "Uploaded documents appear here with their review status.",
}: {
  documents: DocumentItem[];
  emptyDescription?: string;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const toast = useToast();

  const download = async (document_: DocumentItem) => {
    setDownloading(document_.id);
    try {
      const blob = await api.download(`/documents/${document_.id}/download`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = document_.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Revoke on the next tick so the download has started.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error("Download failed", "That document could not be retrieved.");
    } finally {
      setDownloading(null);
    }
  };

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="size-5" />}
        title="No documents yet"
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="divide-y divide-navy-100">
      {documents.map((item) => (
        <li key={item.id} className="flex flex-wrap items-start gap-4 py-4 first:pt-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
            <FileText className="size-5" aria-hidden />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-900">{item.filename}</p>
            <p className="mt-0.5 text-xs text-muted">
              {item.category_label} · {formatBytes(item.size_bytes)} · uploaded{" "}
              {formatDate(item.uploaded_at)} by {item.uploaded_by_name}
            </p>
            {item.reviewer_note ? (
              <p className="mt-2 rounded-lg bg-navy-50/70 p-2.5 text-xs leading-relaxed text-muted">
                <span className="font-semibold text-navy-800">Specialist note: </span>
                {item.reviewer_note}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
            <button
              type="button"
              onClick={() => download(item)}
              disabled={downloading === item.id}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-navy-100 text-navy-600 transition hover:bg-navy-50 hover:text-navy-900 disabled:opacity-50"
              aria-label={`Download ${item.filename}`}
            >
              {downloading === item.id ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
