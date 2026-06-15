import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, FileDown } from "lucide-react";

export const Route = createFileRoute("/resume-analysis")({
  head: () => ({
    meta: [
      { title: "Resume Analysis — ResumeIQ" },
      { name: "description", content: "Upload your resume and get an instant AI-powered match score, skill coverage, gaps and personalized recommendations." },
      { property: "og:title", content: "ResumeIQ Resume Analysis" },
      { property: "og:description", content: "Instant AI-powered resume scoring, gaps and recommendations." },
    ],
  }),
  component: ResumeAnalysis,
});

const matchedSkills = ["React", "TypeScript", "Node.js", "REST APIs", "Git", "Agile", "SQL", "Tailwind CSS"];
const missingSkills = ["Kubernetes", "GraphQL", "AWS Lambda", "System Design"];
const recommendations = [
  "Add a quantifiable result for each role (e.g. 'reduced load time by 40%').",
  "Include a dedicated 'Projects' section showcasing 2–3 deployed builds.",
  "Mention Kubernetes and GraphQL exposure — both appear in 70% of target roles.",
  "Tighten the summary to 3 sentences emphasizing impact, not responsibilities.",
];

function ResumeAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setAnalyzed(false);
    setTimeout(() => setAnalyzed(true), 800);
  };

  return (
    <>
      <section className="px-6 pt-16 pb-8 text-center">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <h1 className="font-heading text-4xl font-bold md:text-5xl">Resume Analysis</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Upload your resume to see your match score, skill coverage and personalized recommendations.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0] ?? null);
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
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <button onClick={() => inputRef.current?.click()} className="btn-primary">
              <UploadCloud className="h-4 w-4" /> Upload Resume
            </button>
          </div>
          {file && (
            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-primary">
              <FileText className="h-4 w-4" /> {file.name}
            </div>
          )}
        </div>
      </section>

      {analyzed && (
        <>
          {/* Analysis Result Card */}
          <section className="mx-auto max-w-5xl px-6 py-6">
            <div className="card-hover rounded-2xl bg-card p-8 shadow-card animate-fade-up">
              <h2 className="font-heading text-2xl font-bold">Analysis Result</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <ResultStat label="Match Score" value={87} color="var(--primary)" />
                <ResultStat label="Resume Strength" value={78} color="var(--secondary)" />
                <ResultStat label="Skill Coverage" value={92} color="var(--success)" />
              </div>
            </div>
          </section>

          {/* Matched + Missing Skills */}
          <section className="mx-auto max-w-5xl px-6 py-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card-hover rounded-2xl bg-card p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[color:var(--success)]" />
                  <h3 className="font-heading text-lg font-semibold">Matched Skills</h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {matchedSkills.map((s) => (
                    <span key={s} className="rounded-full bg-[color:var(--success)]/10 px-3 py-1 text-sm font-medium text-[color:var(--success)]">{s}</span>
                  ))}
                </div>
              </div>
              <div className="card-hover rounded-2xl bg-card p-6 shadow-card">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-[color:var(--warning)]" />
                  <h3 className="font-heading text-lg font-semibold">Missing Skills</h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {missingSkills.map((s) => (
                    <span key={s} className="rounded-full bg-[color:var(--warning)]/10 px-3 py-1 text-sm font-medium text-[color:var(--warning)]">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Recommendations */}
          <section className="mx-auto max-w-5xl px-6 py-6">
            <div className="card-hover rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-lg font-semibold">Recommendations</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {recommendations.map((r) => (
                  <li key={r} className="flex gap-3 text-sm text-foreground">
                    <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">+</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Download */}
          <section className="mx-auto max-w-5xl px-6 py-8 pb-24 text-center">
            <button className="btn-primary">
              <FileDown className="h-4 w-4" /> Download PDF Report
            </button>
          </section>
        </>
      )}
    </>
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