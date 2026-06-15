import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Brain, Target, Trophy, FileDown, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — ResumeIQ" },
      { name: "description", content: "Resume upload, AI matching, skill gap analysis, candidate ranking and downloadable PDF reports — discover everything ResumeIQ offers." },
      { property: "og:title", content: "ResumeIQ Features" },
      { property: "og:description", content: "Resume upload, AI matching, skill gap analysis, ranking and PDF reports." },
    ],
  }),
  component: Features,
});

const featureCards = [
  { icon: Upload, title: "Resume Upload", desc: "Upload PDF and DOCX files. We parse formatting, sections and metadata accurately." },
  { icon: Brain, title: "AI Matching", desc: "Calculate a precise match percentage between your resume and any job description." },
  { icon: Target, title: "Skill Gap Analysis", desc: "Identify missing skills and the exact keywords required for the role." },
  { icon: Trophy, title: "Candidate Ranking", desc: "Rank applicants automatically with explainable, recruiter-grade scoring." },
  { icon: FileDown, title: "PDF Reports", desc: "Download detailed branded reports to share with mentors and recruiters." },
];

function Features() {
  return (
    <>
      <section className="px-6 pt-20 pb-12 text-center">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <h1 className="font-heading text-4xl font-bold md:text-5xl">Powerful platform capabilities</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Every feature is engineered to help you understand, improve and showcase your resume.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((f) => (
            <div key={f.title} className="card-hover feature-card rounded-2xl bg-card p-7 shadow-card">
              <div className="icon-hover inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-heading text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-hero p-10 text-center text-white shadow-card md:p-14">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Try it on your resume</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">See your match score in under a minute.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/resume-analysis" className="btn-primary !bg-white !text-primary">Analyze Now <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}