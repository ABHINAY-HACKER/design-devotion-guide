## Current state (already built)

- Auth: email/password + Google via Lovable Cloud, `_authenticated` gate, `UserMenu`
- DB: `profiles`, `analyses`, `contact_messages` with RLS + grants
- Storage: private `resumes` bucket with per-user folder policies
- Server fns: `resume.functions.ts` (upload + AI analyze with Gemini), `contact.functions.ts`, `stats.functions.ts`
- Pages: landing, features, about, contact (saves to DB), `/resume-analysis`, `/history`, `/auth`
- AI: Lovable AI Gateway (Gemini) wired via `ai-gateway.server.ts`

## Gaps vs PRD → phased build

### Phase 1 – Dashboard, parsing, richer analysis
- New route `/_authenticated/dashboard` with: welcome, quick-upload CTA, user stats cards (total resumes, avg ATS, avg match, total reports), recent analyses, link to history.
- Real PDF/DOCX text extraction server-side (`pdf-parse`, `mammoth`) before sending to Gemini — replaces any base64-only path so AI sees real text.
- Expand analysis JSON schema to include: `ats_score`, `strengths[]`, `weaknesses[]`, `readiness_score`, `existing_skills[]`, `recommended_skills[]`, `learning_path[]`, `employability_score`, `hiring_readiness_score`, `recommended_certifications[]`, `interview_tips[]`. Migration adds the new columns to `analyses`.
- Resume-analysis page renders all new sections (progress bars, chips, skill-gap chart using existing recharts).

### Phase 2 – PDF report generation
- Server fn `generateReport` builds a styled PDF with `pdfkit` from a stored analysis, uploads to a new private `reports` bucket, returns signed URL.
- New `reports` table (id, user_id, analysis_id, file_path, created_at) with RLS + grants.
- "Download report" button on analysis + history pages; "Reports" tab on dashboard.

### Phase 3 – Admin panel
- `app_role` enum + `user_roles` table + `has_role()` security-definer fn (per platform rules — never store role on profiles).
- Seed admin role for the user whose email is `resumeiq.support@gmail.com` (idempotent migration).
- New `/_authenticated/admin` route gated by `has_role(uid,'admin')` server-side; lists users, resumes, analyses, reports, contact messages, plus aggregate stats.
- Admin-scoped server fns using `requireSupabaseAuth` + role check before loading `supabaseAdmin`.

### Phase 4 – Email (auth verification + contact notification)
- Scaffold Lovable Auth email templates (signup confirmation, recovery, magic link) — requires email-domain setup dialog first.
- Scaffold app/transactional emails; on contact form submit, send notification to `resumeiq.support@gmail.com` with name/email/subject/message/timestamp via `/lovable/email/transactional/send`.
- Enable Supabase email confirmation (disable auto-confirm) so verification actually gates login.

### Phase 5 – Polish & security
- Dark/light mode toggle in header (Tailwind `dark:` already supported).
- Toast feedback + loading states audit across all flows.
- HIBP password check enabled via `configure_auth`.
- Zod validation on every server-fn input (most already have it — fill gaps).
- Re-run security scan and address findings.

## Technical notes

- Stack stays TanStack Start + Lovable Cloud + Lovable AI (Gemini). No Express/Node server, no separate JWT — Supabase Auth issues JWTs and `requireSupabaseAuth` validates them. No Nodemailer — Lovable Emails handles delivery.
- Deployment: handled by Lovable (publish), not Vercel/Render.
- New deps: `pdf-parse`, `mammoth`, `pdfkit`.
- New buckets: `reports` (private).
- New tables: `reports`, `user_roles`; new columns on `analyses`.

## What I need from you

1. Confirm the phase order above (or tell me to start with a specific phase).
2. For Phase 4 email: do you already own a domain you can point at Lovable (required for branded auth + contact-notification emails)? If not, we can skip Phase 4 until you have one — default Lovable auth emails will still work.
3. Confirm `resumeiq.support@gmail.com` is the admin email (you'll need to sign up with it once so the role seed picks it up).

Reply "approved" (or with changes) and I'll start Phase 1.