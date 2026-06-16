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
  matched_skills: z.array(z.string().max(60)).max(30),
  missing_skills: z.array(z.string().max(60)).max(30),
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
- matched_skills: skills present in BOTH resume and JD (max 12, concise tech/skill names).
- missing_skills: skills in JD but missing from resume (max 8).
- recommendations: 3-6 short, specific, actionable improvements.
- summary: 2-3 sentence executive summary of the candidate vs JD.`;

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
        matched_skills: a.matched_skills,
        missing_skills: a.missing_skills,
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
      .select("id, file_name, match_score, resume_strength, skill_coverage, summary, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });