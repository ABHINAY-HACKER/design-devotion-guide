import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Trash2, ArrowRight, Loader2, Download } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listMyAnalyses, deleteAnalysis } from "@/lib/resume.functions";
import { generateReport } from "@/lib/report.functions";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [{ title: "My Analyses — ResumeIQ" }],
  }),
  component: History,
});

type Row = {
  id: string;
  file_name: string;
  match_score: number;
  resume_strength: number;
  skill_coverage: number;
  summary: string | null;
  created_at: string;
};

function History() {
  const list = useServerFn(listMyAnalyses);
  const remove = useServerFn(deleteAnalysis);
  const makeReport = useServerFn(generateReport);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);

  useEffect(() => {
    list().then((r) => setRows(r as Row[])).catch(() => setRows([]));
  }, [list]);

  const onDelete = async (id: string) => {
    setBusy(id);
    await remove({ data: { id } });
    setRows((rs) => rs?.filter((r) => r.id !== id) ?? []);
    setBusy(null);
  };

  const onDownload = async (id: string, fileName: string) => {
    setReporting(id);
    try {
      const { url } = await makeReport({ data: { analysisId: id } });
      const a = document.createElement("a");
      a.href = url;
      a.download = `ResumeIQ-${fileName.replace(/\.[^.]+$/, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setReporting(null);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold md:text-4xl">My Analyses</h1>
          <p className="mt-2 text-muted-foreground">Every resume you have analyzed.</p>
        </div>
        <Link to="/resume-analysis" className="btn-primary text-sm">
          New analysis <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {rows === null && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {rows && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">No analyses yet.</p>
            <Link to="/resume-analysis" className="btn-primary mt-4 inline-flex">Upload your first resume</Link>
          </div>
        )}
        {rows?.map((r) => (
          <div key={r.id} className="card-hover flex items-start justify-between gap-4 rounded-2xl bg-card p-5 shadow-card">
            <div className="flex flex-1 items-start gap-4">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-accent">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-base font-semibold truncate">{r.file_name}</h3>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                {r.summary && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{r.summary}</p>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-[color:var(--success)]/10 px-3 py-1 text-sm font-semibold text-[color:var(--success)]">
                {r.match_score}% match
              </span>
              <button
                onClick={() => onDownload(r.id, r.file_name)}
                disabled={reporting === r.id}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40"
              >
                {reporting === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                PDF
              </button>
              <button
                onClick={() => onDelete(r.id)}
                disabled={busy === r.id}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}