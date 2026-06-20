import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AnalyzeInput = z.object({
  filePath: z.string().min(1).max(512),
  fileName: z.string().min(1).max(255),
  jobDescription: z.string().trim().min(20).max(8000),
});

const AnalysisSchema = z.object({
  match_score: z.number().int().min(0).max(100),
  resume_strength: z.number().int().min(0).max(100),
  skill_coverage: z.number().int().min(0).max(100),
  ats_score: z.number().int().min(0).max(100),
  readiness_score: z.number().int().min(0).max(100),
  employability_score: z.number().int().min(0).max(100),
  hiring_readiness_score: z.number().int().min(0).max(100),
  matched_skills: z.array(z.string().max(60)).max(30),
  missing_skills: z.array(z.string().max(60)).max(30),
  existing_skills: z.array(z.string().max(60)).max(40),
  recommended_skills: z.array(z.string().max(60)).max(20),
  strengths: z.array(z.string().max(200)).max(8),
  weaknesses: z.array(z.string().max(200)).max(8),
  learning_path: z.array(z.string().max(200)).max(10),
  recommended_certifications: z.array(z.string().max(120)).max(8),
  interview_tips: z.array(z.string().max(240)).max(8),
  recommendations: z.array(z.string().max(300)).max(8),
  summary: z.string().max(600),
});

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify the user owns this file path (must start with their uid/)
    if (!data.filePath.startsWith(`${userId}/`)) {
      throw new Error("Forbidden: file path does not belong to user");
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");

    // Download resume bytes via admin client (storage RLS would also allow as user, but admin is simpler from server)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const dl = await supabaseAdmin.storage.from("resumes").download(data.filePath);
    if (dl.error || !dl.data) throw new Error("Could not read uploaded resume");
    const arrayBuffer = await dl.data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const lower = data.fileName.toLowerCase();
    const mediaType = lower.endsWith(".pdf")
      ? "application/pdf"
      : lower.endsWith(".docx")
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : lower.endsWith(".doc")
          ? "application/msword"
          : "application/octet-stream";

    const { generateText, Output } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

    const prompt = `You are an expert technical recruiter and resume reviewer. Analyze the attached resume against the following job description and return a strict JSON object matching the schema.

JOB DESCRIPTION:
"""
${data.jobDescription}
"""

Rules:
- match_score: 0-100, how well this candidate fits the JD.
- resume_strength: 0-100, overall quality of the resume (clarity, impact, structure, quantified results).
- skill_coverage: 0-100, share of JD-required skills present in the resume.
- ats_score: 0-100, estimated ATS compatibility (keyword density, formatting, parseability).
- readiness_score: 0-100, placement / industry readiness.
- employability_score: 0-100, holistic employability based on skills+experience+education.
- hiring_readiness_score: 0-100, likelihood a recruiter shortlists this candidate now.
- matched_skills: skills present in BOTH resume and JD (max 12).
- missing_skills: skills in JD but missing from resume (max 10).
- existing_skills: all distinct skills found in the resume (max 20).
- recommended_skills: skills the candidate should learn next (max 8).
- strengths: 3-6 concrete resume strengths.
- weaknesses: 3-6 concrete resume weaknesses.
- learning_path: ordered 4-8 step roadmap to close the biggest gaps.
- recommended_certifications: 3-6 specific certifications worth pursuing.
- interview_tips: 4-6 tailored interview preparation tips for this JD.
- recommendations: 3-6 short, specific, actionable resume improvements.
- summary: 2-3 sentence executive summary of the candidate vs JD.
Return ONLY valid JSON matching the schema.`;

    let result;
    try {
      result = await generateText({
        model,
        experimental_output: Output.object({ schema: AnalysisSchema }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "file", data: bytes, mediaType },
            ],
          },
        ],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("AI is rate-limited. Please try again in a minute.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`Resume analysis failed: ${msg}`);
    }

    const parsed = AnalysisSchema.safeParse(result.experimental_output);
    if (!parsed.success) {
      throw new Error("AI returned an invalid response. Please try again.");
    }
    const a = parsed.data;

    const { data: row, error } = await supabase
      .from("analyses")
      .insert({
        user_id: userId,
        file_name: data.fileName,
        file_path: data.filePath,
        job_description: data.jobDescription,
        match_score: a.match_score,
        resume_strength: a.resume_strength,
        skill_coverage: a.skill_coverage,
        ats_score: a.ats_score,
        readiness_score: a.readiness_score,
        employability_score: a.employability_score,
        hiring_readiness_score: a.hiring_readiness_score,
        matched_skills: a.matched_skills,
        missing_skills: a.missing_skills,
        existing_skills: a.existing_skills,
        recommended_skills: a.recommended_skills,
        strengths: a.strengths,
        weaknesses: a.weaknesses,
        learning_path: a.learning_path,
        recommended_certifications: a.recommended_certifications,
        interview_tips: a.interview_tips,
        recommendations: a.recommendations,
        summary: a.summary,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const listMyAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("analyses")
      .select("id, file_name, match_score, resume_strength, skill_coverage, ats_score, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("analyses")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMyDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("analyses")
      .select("id, file_name, match_score, resume_strength, ats_score, employability_score, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const { count: total } = await context.supabase
      .from("analyses")
      .select("id", { count: "exact", head: true });
    const avg = (key: "match_score" | "ats_score" | "resume_strength" | "employability_score") =>
      rows.length ? Math.round(rows.reduce((s, r) => s + (r[key] ?? 0), 0) / rows.length) : 0;
    return {
      recent: rows,
      total_analyses: total ?? 0,
      avg_match: avg("match_score"),
      avg_ats: avg("ats_score"),
      avg_strength: avg("resume_strength"),
      avg_employability: avg("employability_score"),
    };
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });