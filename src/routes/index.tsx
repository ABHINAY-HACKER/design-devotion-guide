import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPublicStats } from "@/lib/stats.functions";
import {
  FileSearch, Target, Brain, Trophy, Upload, BarChart3, Briefcase, Sparkles,
  ArrowRight, Quote, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResumeIQ — AI Resume Analysis & Job Matching" },
      { name: "description", content: "Optimize your resume, detect skill gaps, and match the right jobs with ResumeIQ's AI-powered platform." },
      { property: "og:title", content: "ResumeIQ — AI Resume Analysis & Job Matching" },
      { property: "og:description", content: "Optimize your resume, detect skill gaps, and match the right jobs with AI." },
    ],
  }),
  component: Index,
});

function useCountUp(target: number, duration = 2000, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

const features = [
  { icon: FileSearch, title: "Resume Analysis", desc: "Deep AI parsing of your resume to surface strengths, gaps, and ATS issues." },
  { icon: Target, title: "Skill Gap Detection", desc: "See exactly which skills you're missing for the roles you want." },
  { icon: Brain, title: "AI Job Matching", desc: "Match your profile against job descriptions with a precise match score." },
  { icon: Trophy, title: "Candidate Ranking", desc: "Automatically rank candidates for any role with explainable scoring." },
];

const steps = [
  { icon: Upload, title: "Upload Resume", desc: "Drop in your PDF or DOCX in seconds." },
  { icon: BarChart3, title: "Analyze Skills", desc: "Our AI extracts and evaluates every skill." },
  { icon: Briefcase, title: "Match Jobs", desc: "Compare your profile to real job descriptions." },
  { icon: Sparkles, title: "Get Recommendations", desc: "Receive tailored, actionable next steps." },
];

const statLabels = [
  { key: "resumes_analyzed" as const, label: "Resumes Analyzed" },
  { key: "jobs_matched" as const, label: "Jobs Matched" },
  { key: "students_assisted" as const, label: "Students Assisted" },
];

const testimonials = [
  { name: "Priya Sharma", role: "CS Student, NIT", quote: "ResumeIQ helped me close my skill gaps and land 3 interviews in 2 weeks." },
  { name: "Marcus Lee", role: "Junior Developer", quote: "The match score is shockingly accurate. I finally understand what recruiters see." },
  { name: "Dr. Anita Rao", role: "Career Counselor", quote: "I recommend ResumeIQ to every student. It's the clearest resume tool I've used." },
];

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);
  const fetchStats = useServerFn(getPublicStats);
  const [stats, setStats] = useState<{ resumes_analyzed: number; jobs_matched: number; students_assisted: number } | null>(null);
  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats({ resumes_analyzed: 1250, jobs_matched: 480, students_assisted: 320 }));
  }, [fetchStats]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setStart(true), io.disconnect()),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} className="bg-gradient-hero py-20 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
        {statLabels.map((s) => (
          <Stat key={s.label} value={stats?.[s.key] ?? 0} suffix="+" label={s.label} start={start && !!stats} />
        ))}
      </div>
    </section>
  );
}
function Stat({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const n = useCountUp(value, 2000, start);
  return (
    <div className="text-center">
      <div className="font-heading text-5xl font-bold md:text-6xl">
        {n.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-lg text-white/85">{label}</div>
    </div>
  );
}

function Index() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,oklch(0.951_0.025_251)_0%,transparent_70%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered career platform
            </span>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-tight text-foreground md:text-6xl">
              Land the right job with <span className="text-gradient-hero">smart resume AI</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              ResumeIQ analyzes your resume, identifies skill gaps, and matches you to jobs with an
              explainable score — so you apply with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/resume-analysis" className="btn-primary">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/features" className="btn-secondary">Learn More</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              {["No credit card", "PDF & DOCX", "Instant analysis"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="relative">
            <div className="animate-float mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                    <FileSearch className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">resume_priya.pdf</div>
                    <div className="text-xs text-muted-foreground">Analyzed just now</div>
                  </div>
                </div>
                <span className="rounded-full bg-[color:var(--success)]/10 px-2 py-1 text-xs font-semibold text-[color:var(--success)]">
                  92% match
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Skill coverage", v: 88, c: "var(--primary)" },
                  { label: "Resume strength", v: 76, c: "var(--secondary)" },
                  { label: "Keyword match", v: 94, c: "var(--success)" },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>{b.label}</span><span>{b.v}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full" style={{ width: `${b.v}%`, background: b.c }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {["React", "TypeScript", "SQL", "AWS", "Docker", "GraphQL"].map((s) => (
                  <span key={s} className="rounded-md bg-accent px-2 py-1 text-center text-xs font-medium text-primary">{s}</span>
                ))}
              </div>
            </div>
            <div className="absolute -right-2 top-6 hidden rounded-2xl bg-white p-4 shadow-card md:block animate-float" style={{ animationDelay: "1s" }}>
              <div className="flex items-center gap-2 text-sm font-semibold"><Brain className="h-4 w-4 text-primary" /> AI Insight</div>
              <p className="mt-1 max-w-[180px] text-xs text-muted-foreground">Add "Kubernetes" to boost match by 6%.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Everything you need to stand out</h2>
          <p className="mt-4 text-muted-foreground">Four AI-powered capabilities that make your resume work harder.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card-hover feature-card rounded-2xl bg-card p-6 shadow-card">
              <div className="icon-hover mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">From upload to offer — in four simple steps.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="card-hover relative rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="absolute -top-3 -left-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-hero font-heading text-sm font-bold text-white shadow-card">
                  {i + 1}
                </div>
                <div className="icon-hover inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StatsSection />

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Loved by students and recruiters</h2>
          <p className="mt-4 text-muted-foreground">Real results from real users.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="card-hover rounded-2xl bg-card p-6 shadow-card">
              <Quote className="h-6 w-6 text-primary" />
              <blockquote className="mt-3 text-sm text-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero font-heading font-semibold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-hero p-10 text-center text-white shadow-card md:p-16">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Ready to upgrade your resume?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">Analyze your resume in seconds and start matching jobs with confidence.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/resume-analysis" className="btn-primary !bg-white !text-primary">Get Started <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/features" className="btn-secondary !border-white !text-white !bg-transparent">Learn More</Link>
          </div>
        </div>
      </section>
    </>
  );
}
