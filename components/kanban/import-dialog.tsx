"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Papa from "papaparse";

const TASK_FIELDS = [
  { key: "title", label: "Title *" },
  { key: "description", label: "Description" },
  { key: "priority", label: "Priority (CRITICAL/HIGH/MEDIUM/LOW)" },
  { key: "dueDate", label: "Due Date" },
  { key: "columnName", label: "Column Name" },
  { key: "assigneeEmail", label: "Assignee Email" },
];

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
}

type Step = "upload" | "map" | "result";

export function ImportDialog({ open, onClose, boardId }: ImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setCsvHeaders([]);
    setPreview([]);
    setFile(null);
    setMapping({});
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFile(f: File) {
    setFile(f);
    Papa.parse<Record<string, string>>(f, {
      header: true,
      preview: 5,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: ({ data, meta }) => {
        setCsvHeaders(meta.fields ?? []);
        setPreview(data);
        // Auto-map columns with matching names
        const auto: Record<string, string> = {};
        for (const field of TASK_FIELDS) {
          const match = (meta.fields ?? []).find(
            (h) => h.toLowerCase() === field.key.toLowerCase()
          );
          if (match) auto[field.key] = match;
        }
        setMapping(auto);
        setStep("map");
      },
    });
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("boardId", boardId);
    fd.append("mapping", JSON.stringify(mapping));
    const res = await fetch("/api/import/csv", { method: "POST", body: fd });
    const data = await res.json();
    setResult(data);
    setStep("result");
    setImporting(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Tasks from CSV</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="py-6">
            <div
              className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Drop a CSV file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expected columns: title, description, priority, dueDate, columnName, assigneeEmail
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {step === "map" && (
          <div className="space-y-5 py-2">
            <p className="text-sm text-muted-foreground">
              Map your CSV columns to Boardly task fields. Auto-matched where names match.
            </p>

            <div className="space-y-2">
              {TASK_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <span className="text-sm w-52 flex-shrink-0">{field.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <select
                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                  >
                    <option value="">(skip)</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {preview.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview (first {preview.length} rows)</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="text-xs w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        {csvHeaders.map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          {csvHeaders.map((h) => (
                            <td key={h} className="px-3 py-1.5 text-muted-foreground max-w-[150px] truncate">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleImport} disabled={importing || !mapping["title"]}>
                {importing ? "Importing..." : "Import Tasks"}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="py-6 text-center space-y-4">
            {result.imported > 0 ? (
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            ) : (
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            )}
            <div>
              <p className="text-lg font-semibold">
                {result.imported} task{result.imported !== 1 ? "s" : ""} imported
              </p>
              {result.skipped > 0 && (
                <p className="text-sm text-muted-foreground mt-1">{result.skipped} row{result.skipped !== 1 ? "s" : ""} skipped</p>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="text-left bg-muted/50 rounded-lg p-3 text-xs space-y-1 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => <p key={i} className="text-muted-foreground">{e}</p>)}
              </div>
            )}
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
