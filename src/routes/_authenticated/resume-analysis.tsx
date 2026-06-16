import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2, Briefcase } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { analyzeResume } from "@/lib/resume.functions";

export const Route = createFileRoute("/_authenticated/resume-analysis")({
  head: () => ({
    meta: [
      { title: "Resume Analysis — ResumeIQ" },
      { name: "description", content: "Upload your resume, paste a job description and get an instant AI match score, skills, gaps and recommendations." },
    ],
  }),
  component: ResumeAnalysis,
});

type Result = {
  match_score: number;
  resume_strength: number;
  skill_coverage: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  summary: string | null;
  file_name: string;
};

function ResumeAnalysis() {
  const analyze = useServerFn(analyzeResume);
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const submit = async () => {
    setError(null);
    if (!file) return setError("Please upload a resume file.");
    if (jd.trim().length < 20) return setError("Job description must be at least 20 characters.");
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in again.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${uid}/${Date.now()}-${safeName}`;

      const up = await supabase.storage.from("resumes").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });
      if (up.error) throw up.error;

      const row = await analyze({
        data: { filePath, fileName: file.name, jobDescription: jd.trim() },
      });
      setResult({
        match_score: row.match_score,
        resume_strength: row.resume_strength,
        skill_coverage: row.skill_coverage,
        matched_skills: (row.matched_skills as string[]) ?? [],
        missing_skills: (row.missing_skills as string[]) ?? [],
        recommendations: (row.recommendations as string[]) ?? [],
        summary: row.summary,
        file_name: row.file_name,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="px-6 pt-16 pb-8 text-center">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <h1 className="font-heading text-4xl font-bold md:text-5xl">Resume Analysis</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Upload your resume and paste a target job description. Our AI returns a match score, skill coverage and personalized recommendations.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`rounded-3xl border-2 border-dashed bg-card p-10 text-center shadow-card transition ${dragging ? "border-primary bg-accent" : "border-border"}`}
        >
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-bold">Drag &amp; drop your resume</h2>
          <p className="mt-1 text-sm text-muted-foreground">PDF or DOCX, up to 10MB</p>
          <div className="mt-6">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            <button onClick={() => inputRef.current?.click()} className="btn-primary" type="button">
              <UploadCloud className="h-4 w-4" /> Choose Resume
            </button>
          </div>
          {file && (
            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-primary">
              <FileText className="h-4 w-4" /> {file.name}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-8">
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <label className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Briefcase className="h-5 w-5 text-primary" /> Job Description
          </label>
          <p className="mt-1 text-xs text-muted-foreground">Paste the JD you want to match against (min 20 characters).</p>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={6}
            maxLength={8000}
            placeholder="e.g. We are looking for a Senior Frontend Engineer skilled in React, TypeScript, GraphQL…"
            className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">{jd.length}/8000</div>

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

          <button onClick={submit} disabled={busy} className="btn-primary mt-4">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Analyzing…" : "Analyze Resume"}
          </button>
        </div>
      </section>

      {result && (
        <>
          <section className="mx-auto max-w-5xl px-6 py-6">
            <div className="card-hover rounded-2xl bg-card p-8 shadow-card animate-fade-up">
              <h2 className="font-heading text-2xl font-bold">Analysis Result</h2>
              {result.summary && <p className="mt-2 text-sm text-muted-foreground">{result.summary}</p>}
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <ResultStat label="Match Score" value={result.match_score} color="var(--primary)" />
                <ResultStat label="Resume Strength" value={result.resume_strength} color="var(--secondary)" />
                <ResultStat label="Skill Coverage" value={result.skill_coverage} color="var(--success)" />
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-6 py-6">
            <div className="grid gap-6 md:grid-cols-2">
              <SkillCard title="Matched Skills" items={result.matched_skills} good />
              <SkillCard title="Missing Skills" items={result.missing_skills} />
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-6 py-6 pb-24">
            <div className="card-hover rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-lg font-semibold">Recommendations</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">+</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function SkillCard({ title, items, good }: { title: string; items: string[]; good?: boolean }) {
  const color = good ? "var(--success)" : "var(--warning)";
  const Icon = good ? CheckCircle2 : AlertCircle;
  return (
    <div className="card-hover rounded-2xl bg-card p-6 shadow-card">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" style={{ color }} />
        <h3 className="font-heading text-lg font-semibold">{title}</h3>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.length === 0 && <span className="text-sm text-muted-foreground">None detected.</span>}
        {items.map((s) => (
          <span key={s} className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: `color-mix(in oklab, ${color} 10%, transparent)`, color }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border p-5 text-center">
      <div className="font-heading text-4xl font-bold" style={{ color }}>{value}%</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}