# ResumeIQ — Full Implementation Plan

## 1. Feature Understanding (PRD recap)

ResumeIQ is an AI-powered resume platform with:
- Email/password + Google auth, email verification, password reset
- Resume upload (PDF/DOCX) to private storage
- Server-side text extraction + Gemini analysis (ATS score, strengths, weaknesses, skill gaps, learning path, employability, hiring readiness, interview tips, certifications)
- Optional Job Description → match score, matched/missing skills, candidate ranking
- Downloadable PDF report of each analysis
- History of past analyses, per-user dashboard with stats
- Contact form → stored in DB + email notification to `resumeiq.helpdesk@gmail.com`
- Admin dashboard (admin email only) showing users, resumes, analyses, messages
- Production-grade security: RLS, role table, HIBP, Zod validation, no service-role leakage

## 2. Current State (already shipped)

- Auth (email+password, Google), `_authenticated` gate, profiles trigger
- `analyses` table with full PRD column set, RLS + grants
- `user_roles` + `has_role()` + `grant_admin_on_signup` trigger
- `contact_messages` table (insert-only by anon)
- `resumes` private storage bucket
- Server fns: resume upload + Gemini analysis, dashboard, admin overview, contact
- Pages: landing, features, about, contact, auth, dashboard, history, resume-analysis, admin

## 3. Gap → Work To Do (phased)

### Phase A — Real document parsing & richer analysis hardening
- Replace naive text read with real PDF/DOCX extraction in the upload server fn
  - PDF: `unpdf` (Worker-safe, pure JS) — `pdf-parse` uses Node `fs` and breaks on Cloudflare Worker
  - DOCX: `mammoth` (Worker-safe, raw text mode)
- Reject files >5MB / non-pdf/docx server-side
- Sanitize extracted text length before sending to Gemini (token guard)

### Phase B — PDF report generation
- Library: `@react-pdf/renderer` (Worker-compatible, no native deps)
- New server fn `generateReport({ analysisId })`:
  1. `requireSupabaseAuth` + load analysis (RLS scoped)
  2. Render React-PDF document with ResumeIQ branding
  3. Upload to new private `reports` bucket at `${user_id}/${analysis_id}.pdf`
  4. Return short-lived signed URL
- New `reports` table: `id, user_id, analysis_id, path, created_at` + RLS + grants
- "Download PDF" button on `/resume-analysis` and history rows

### Phase C — Email notifications (contact form + auth)
Requires email domain. Two sub-steps:
1. `email_domain--check_email_domain_status`; if none, prompt user via setup dialog
2. After domain ready:
   - `setup_email_infra` → `scaffold_auth_email_templates` (branded signup/recovery/magic-link)
   - `scaffold_transactional_email` → app email template `contact-notification` sent to `resumeiq.helpdesk@gmail.com` whenever contact form is submitted
- Enable Supabase email confirmation (disable auto-confirm) + HIBP password check via `configure_auth`

### Phase D — Polish & security
- Zod input validation on every server fn
- Toast feedback (success/error) on upload, analyze, contact, report
- Light/dark theme toggle in SiteLayout
- Re-run security scan; fix anything flagged
- SEO: per-route head() with unique title/description, JSON-LD on landing

## 4. Architecture

### 4.1 Database Schema
```text
profiles(id, email, full_name, avatar_url, …)
user_roles(id, user_id, role app_role)         -- 'admin' | 'user'
analyses(id, user_id, file_name, file_path,
         job_description, match_score, ats_score,
         resume_strength, skill_coverage,
         matched_skills[], missing_skills[],
         strengths[], weaknesses[], recommendations[],
         existing_skills[], recommended_skills[], learning_path[],
         employability_score, hiring_readiness_score, readiness_score,
         recommended_certifications[], interview_tips[],
         summary, created_at)
reports(id, user_id, analysis_id FK, path, created_at)   -- NEW
contact_messages(id, name, email, subject, message, created_at)
```
RLS: every table scoped to `auth.uid() = user_id`; admin reads via `has_role(uid,'admin')` policies on analyses/profiles/contact_messages.

### 4.2 Backend (TanStack server functions)
- `src/lib/resume.functions.ts` — `uploadAndAnalyze`, `getAnalysis`, `getMyDashboard`, `listMyAnalyses`
- `src/lib/report.functions.ts` (NEW) — `generateReport`
- `src/lib/admin.functions.ts` — `isAdmin`, `getAdminOverview`
- `src/lib/contact.functions.ts` — `submitContact` → insert + enqueue email
- All authed fns use `requireSupabaseAuth`; admin fns also check `has_role`

### 4.3 Frontend (routes)
```text
/                      landing
/features /about /contact      public marketing
/auth                  sign in / sign up / forgot pw
/_authenticated/dashboard      stats + recent
/_authenticated/resume-analysis  upload + result + PDF download
/_authenticated/history        list + open + download
/_authenticated/admin          admin only
```
Components: `SiteLayout`, `UserMenu`, score cards, skill-chip lists, PDF button.

### 4.4 Auth Flow
1. User signs up (email+password or Google)
2. Trigger `handle_new_user` → profile row
3. Trigger `grant_admin_on_signup` → admin role iff email = `resumeiq.helpdesk@gmail.com`
4. Supabase sends branded confirmation email (after Phase C)
5. `_authenticated/route.tsx` gate redirects unauth → `/auth`

### 4.5 Email Verification Flow (Phase C)
- Disable auto-confirm in Supabase
- Lovable-managed auth templates (signup, recovery, magic-link, etc.)
- User clicks link → returns to `/auth` confirmed → can sign in

### 4.6 Resume Upload Flow
Client → `uploadAndAnalyze({ file, jobDescription? })`
1. Validate size/type
2. Upload to `resumes/${uid}/${uuid}.{ext}`
3. Server downloads bytes, extracts text (unpdf/mammoth)
4. Call Gemini via Lovable AI Gateway with structured Zod output
5. Insert into `analyses`
6. Return `{ analysisId }`; client navigates to `/resume-analysis?id=…`

### 4.7 Job Matching Flow
- Same fn; if `jobDescription` present, prompt extension instructs Gemini to score match, list matched/missing skills, candidate ranking signal (0–100)

### 4.8 PDF Report Flow
1. UI "Download PDF" → `generateReport({ analysisId })`
2. Server loads analysis (RLS), renders React-PDF, uploads to `reports/`
3. Returns signed URL → client triggers download

### 4.9 Admin Dashboard Flow
- `/admin` route, `beforeLoad` calls `isAdmin`; non-admins redirect to `/dashboard`
- `getAdminOverview` returns counts + recent users/analyses/messages (service-role inside handler after role check)
- Tables: Users, Analyses, Contact Messages, system stats

## 5. Security
- RLS everywhere; service-role only after `has_role` check, lazy-imported inside handler
- Zod validation on every input
- HIBP leaked-password protection
- Private buckets, signed URLs only
- No secrets in client; `LOVABLE_API_KEY` server-only
- Rate-limit contact form (basic) via Zod length + Supabase policy

## 6. Deployment
- TanStack Start on Cloudflare Worker (current template)
- Lovable Cloud (Supabase) for DB/auth/storage
- Lovable AI Gateway for Gemini
- Email via Lovable Emails (after domain setup)
- Publish via Lovable; preview URL already live

## 7. Estimated Phases / Order
1. Phase A — real parsing (1 turn)
2. Phase B — PDF reports + `reports` table (1 turn, migration + code)
3. Phase D-lite — Zod + toasts + HIBP (1 turn)
4. Phase C — email domain + auth templates + contact notification (depends on user having a domain; multiple turns)
5. Final security scan + SEO polish (1 turn)

## 8. Open Questions
1. **Email domain**: do you own a domain we can delegate a subdomain from (e.g. `notify.yourdomain.com`) for branded auth + contact-notification emails? If not, Phase C is deferred and contact submissions stay DB-only.
2. **PDF library**: confirm `@react-pdf/renderer` is acceptable (Worker-safe, programmatic layout). Alternative is an HTML-template approach but it needs an external service on Workers.
3. **Admin seeding**: confirm `resumeiq.helpdesk@gmail.com` is the only admin and you'll sign up with it once so the trigger assigns the role.
4. **Email confirmation**: turn on required email confirmation now (users must verify before signing in), or keep auto-confirm until Phase C ships?

Reply with answers (or "go" to accept defaults: React-PDF, defer Phase C until you provide a domain, single admin email as listed, keep auto-confirm until branded emails are ready) and I'll start Phase A.
