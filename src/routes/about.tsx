import { createFileRoute } from "@tanstack/react-router";
import { Rocket, Eye, Cpu, Users, Heart, Target } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ResumeIQ" },
      { name: "description", content: "Our mission, vision, technology stack and team behind ResumeIQ — the AI-powered resume analysis platform." },
      { property: "og:title", content: "About ResumeIQ" },
      { property: "og:description", content: "The mission, vision and team behind ResumeIQ." },
    ],
  }),
  component: About,
});

const stack = ["React", "TypeScript", "TanStack Start", "Tailwind CSS", "Python", "OpenAI", "PostgreSQL", "Vector Search"];
const team = [
  { name: "Ananya Patel", role: "Founder & CEO", initial: "A" },
  { name: "David Kim", role: "Head of AI", initial: "D" },
  { name: "Sara Müller", role: "Product Designer", initial: "S" },
  { name: "Rahul Verma", role: "Engineering Lead", initial: "R" },
];

function About() {
  return (
    <>
      <section className="px-6 pt-20 pb-10 text-center">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-semibold text-primary">
            <Heart className="h-3.5 w-3.5" /> Our Story
          </span>
          <h1 className="mt-5 font-heading text-4xl font-bold md:text-5xl">Helping every job seeker get a fair shot</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            ResumeIQ started in a college dorm room with a simple question — why is it so hard to know if your resume is good enough?
            Today we use AI to give students and professionals the same edge recruiters have.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-hover rounded-2xl bg-card p-8 shadow-card">
            <div className="icon-hover inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-4 font-heading text-2xl font-bold">Mission</h2>
            <p className="mt-3 text-muted-foreground">
              Democratize career success by giving every job seeker AI-powered insight into how their resume
              measures up — and what to do next.
            </p>
          </div>
          <div className="card-hover rounded-2xl bg-card p-8 shadow-card">
            <div className="icon-hover inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-4 font-heading text-2xl font-bold">Vision</h2>
            <p className="mt-3 text-muted-foreground">
              A world where every resume is matched to the right opportunity, and every recruiter finds the right candidate
              — fairly, quickly and transparently.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <div className="flex items-center gap-3">
            <Cpu className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-2xl font-bold">Technology Stack</h2>
          </div>
          <p className="mt-2 text-muted-foreground">Built with modern, scalable, AI-first technologies.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {stack.map((s) => (
              <span key={s} className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-primary">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 pb-24">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="font-heading text-2xl font-bold">Our Team</h2>
        </div>
        <p className="mt-2 text-muted-foreground">A small, focused team of engineers, designers and career experts.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="card-hover rounded-2xl bg-card p-6 text-center shadow-card">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-hero font-heading text-2xl font-bold text-white">
                {m.initial}
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">{m.name}</h3>
              <p className="text-sm text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}