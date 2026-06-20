import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyDashboard } from "@/lib/resume.functions";
import { isAdmin } from "@/lib/admin.functions";
import { FileText, Sparkles, ArrowRight, Loader2, Shield, BarChart3, Target, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ResumeIQ" }] }),
  component: Dashboard,
});

type Recent = {
  id: string;
  file_name: string;
  match_score: number;
  resume_strength: number;
  ats_score: number;
  employability_score: number;
  summary: string | null;
  created_at: string;
};

function Dashboard() {
  const fetchDash = useServerFn(getMyDashboard);
  const checkAdmin = useServerFn(isAdmin);
  const [data, setData] = useState<{
    recent: Recent[];
    total_analyses: number;
    avg_match: number;
    avg_ats: number;
    avg_strength: number;
    avg_employability: number;
  } | null>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    fetchDash().then((d) => setData(d as any)).catch(() => setData(null));
    checkAdmin().then((r) => setAdmin(!!r.admin)).catch(() => setAdmin(false));
  }, [fetchDash, checkAdmin]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold md:text-4xl">Welcome back 👋</h1>
          <p className="mt-2 text-muted-foreground">Your AI career command center.</p>
        </div>
        <div className="flex gap-3">
          {admin && (
            <Link to="/admin" className="btn-secondary text-sm">
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
          <Link to="/history" className="btn-secondary text-sm">View history</Link>
          <Link to="/resume-analysis" className="btn-primary text-sm">
            New analysis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {!data ? (
        <div className="mt-10 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard…
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard icon={FileText} label="Total Analyses" value={data.total_analyses} color="var(--primary)" />
            <StatCard icon={Target} label="Avg Match" value={`${data.avg_match}%`} color="var(--success)" />
            <StatCard icon={BarChart3} label="Avg ATS" value={`${data.avg_ats}%`} color="var(--secondary)" />
            <StatCard icon={Briefcase} label="Avg Employability" value={`${data.avg_employability}%`} color="var(--warning)" />
          </div>

          <div className="mt-10">
            <h2 className="font-heading text-xl font-semibold">Recent analyses</h2>
            {data.recent.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 text-muted-foreground">No analyses yet. Upload your first resume to get started.</p>
                <Link to="/resume-analysis" className="btn-primary mt-4 inline-flex">Upload resume</Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {data.recent.map((r) => (
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
                    <div className="flex flex-col items-end gap-1 text-right text-xs">
                      <span className="rounded-full bg-[color:var(--success)]/10 px-3 py-1 font-semibold text-[color:var(--success)]">{r.match_score}% match</span>
                      <span className="text-muted-foreground">ATS {r.ats_score}% · Strength {r.resume_strength}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="card-hover rounded-2xl bg-card p-5 shadow-card">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in oklab, ${color} 14%, transparent)` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="mt-3 font-heading text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}