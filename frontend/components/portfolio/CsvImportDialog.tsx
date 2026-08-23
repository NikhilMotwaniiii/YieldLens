"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { csvTemplateUrl, importCsv } from "@/lib/api/portfolios";

export function CsvImportDialog({
  open,
  onClose,
  portfolioId
}: {
  open: boolean;
  onClose: () => void;
  portfolioId: number;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Choose a CSV file first");
      return importCsv(portfolioId, file);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      void queryClient.invalidateQueries({ queryKey: ["analytics", portfolioId] });
      void queryClient.invalidateQueries({ queryKey: ["scenario", portfolioId] });
    }
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-night/55 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-line bg-paper shadow-desk">
        <div className="flex items-center justify-between border-b border-line bg-panel p-5">
          <div>
            <h2 className="text-lg font-semibold">Import CSV</h2>
            <p className="mt-1 text-sm text-muted">Valid rows are imported even when other rows fail validation.</p>
          </div>
          <button aria-label="Close import dialog" className="rounded-md p-2 hover:bg-paper" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-5">
          <a
            href={csvTemplateUrl(portfolioId)}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-panel px-4 text-sm font-semibold hover:bg-accent-soft"
          >
            <Download size={16} />
            Download Template
          </a>

          <label className="mt-6 block rounded-md border border-dashed border-line bg-panel p-6">
            <span className="text-sm font-semibold">CSV file</span>
            <input
              className="mt-3 block w-full text-sm"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {mutation.data ? (
            <div className="mt-5 rounded-md border border-line bg-panel p-4 text-sm">
              <p className="font-semibold">
                Imported {mutation.data.imported_rows} of {mutation.data.valid_rows} valid rows
              </p>
              {mutation.data.errors.length ? (
                <div className="mt-3 max-h-48 overflow-auto">
                  {mutation.data.errors.map((error) => (
                    <p key={`${error.row}-${error.field}-${error.message}`} className="text-loss">
                      Row {error.row}, {error.field}: {error.message}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {mutation.isError ? (
            <p className="mt-4 rounded-md border border-[#efb0aa] bg-[#fff0ee] p-3 text-sm text-loss">
              {mutation.error instanceof Error ? mutation.error.message : "Unable to import CSV"}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-line bg-panel p-5">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button disabled={!file || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Importing..." : "Import CSV"}
          </Button>
        </div>
      </div>
    </div>
  );
}
