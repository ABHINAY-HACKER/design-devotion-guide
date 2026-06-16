import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, ChevronDown, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { submitContact } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ResumeIQ" },
      { name: "description", content: "Get in touch with the ResumeIQ team. Email, phone, location, and answers to frequently asked questions." },
      { property: "og:title", content: "Contact ResumeIQ" },
      { property: "og:description", content: "Reach our team or browse FAQs." },
    ],
  }),
  component: Contact,
});

const faqs = [
  { q: "Is ResumeIQ free to use?", a: "Yes — core resume analysis and job matching are free for students and individual job seekers." },
  { q: "Which file formats do you support?", a: "We currently support PDF and DOCX files up to 10MB." },
  { q: "How accurate is the match score?", a: "Our AI matches resumes against job descriptions using semantic search and keyword analysis, typically within ±3% of recruiter scoring." },
  { q: "Do you store my resume?", a: "Resumes are processed securely and never shared. You can delete your data at any time." },
];

function Contact() {
  const submit = useServerFn(submitContact);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submit({ data: { name, email, subject, message } });
      setSent(true);
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="px-6 pt-20 pb-10 text-center">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <h1 className="font-heading text-4xl font-bold md:text-5xl">Get in touch</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Questions, feedback or partnership ideas? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { icon: Mail, label: "Email", value: "hello@resumeiq.app" },
            { icon: Phone, label: "Phone", value: "+1 (555) 123-4567" },
            { icon: MapPin, label: "Location", value: "San Francisco, CA" },
          ].map((c) => (
            <div key={c.label} className="card-hover rounded-2xl bg-card p-6 shadow-card">
              <div className="icon-hover inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <c.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">{c.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <form onSubmit={onSubmit} className="rounded-2xl bg-card p-8 shadow-card">
            <h2 className="font-heading text-2xl font-bold">Send us a message</h2>
            <div className="mt-6 space-y-4">
              <Field label="Name" type="text" value={name} onChange={setName} />
              <Field label="Email" type="email" value={email} onChange={setEmail} />
              <Field label="Subject" type="text" value={subject} onChange={setSubject} required={false} />
              <div>
                <label className="text-sm font-medium text-foreground">Message</label>
                <textarea
                  required rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  minLength={5}
                  maxLength={5000}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {busy ? "Sending…" : "Send Message"}
              </button>
              {error && <p className="text-center text-sm text-destructive">{error}</p>}
              {sent && (
                <p className="text-center text-sm font-medium text-[color:var(--success)]">
                  Thanks! We'll get back to you within 24 hours.
                </p>
              )}
            </div>
          </form>

          {/* FAQ */}
          <div>
            <h2 className="font-heading text-2xl font-bold">Frequently Asked Questions</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((f, i) => <FaqItem key={i} {...f} />)}
            </div>
          </div>
        </div>
      </section>
      <div className="pb-16" />
    </>
  );
}

function Field({
  label, type, value, onChange, required = true,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-heading text-base font-semibold">{q}</span>
        <ChevronDown className={`h-5 w-5 text-primary transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-5 text-sm text-muted-foreground">{a}</p>}
    </div>
  );
}