"use client";

import { useCallback, useEffect, useState } from "react";

import { DocumentList } from "@/components/portal/DocumentList";
import { DocumentUploader } from "@/components/portal/DocumentUploader";
import { usePortal } from "@/components/portal/PortalContext";
import { Alert, LoadingPanel } from "@/components/ui/Primitives";
import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/types";

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refresh } = usePortal();

  const load = useCallback(async () => {
    try {
      setDocuments(await api.get<DocumentItem[]>("/documents", true));
      setError(null);
    } catch {
      setError("We couldn't load your documents. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onUploaded = (document: DocumentItem) => {
    setDocuments((current) => [document, ...current]);
    // Keep the sidebar count and bureau status in sync.
    void refresh();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <DocumentUploader onUploaded={onUploaded} />

      <section className="card-surface p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-navy-900">Your documents</h2>
          <p className="text-sm text-muted">
            {documents.length} {documents.length === 1 ? "file" : "files"}
          </p>
        </div>

        <div className="mt-5">
          {loading ? (
            <LoadingPanel label="Loading documents…" />
          ) : error ? (
            <Alert tone="error">{error}</Alert>
          ) : (
            <DocumentList
              documents={documents}
              emptyDescription="Start with your Experian, Equifax and TransUnion reports. Your specialist needs all three for a complete review."
            />
          )}
        </div>
      </section>
    </div>
  );
}
