import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({ analysisId: z.string().uuid() });

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: a, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", data.analysisId)
      .single();
    if (error || !a) throw new Error("Analysis not found");

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const M = 50;
    const PRIMARY = rgb(0.13, 0.39, 0.92);
    const TEXT = rgb(0.12, 0.16, 0.22);
    const MUTED = rgb(0.42, 0.46, 0.52);

    let page = pdf.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - M;

    const newPage = () => {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - M;
    };
    const ensure = (h: number) => {
      if (y - h < M) newPage();
    };
    const wrap = (text: string, f: typeof font, size: number, maxW: number): string[] => {
      const words = text.replace(/\s+/g, " ").trim().split(" ");
      const lines: string[] = [];
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(test, size) > maxW) {
          if (line) lines.push(line);
          line = w;
        } else line = test;
      }
      if (line) lines.push(line);
      return lines;
    };
    const drawText = (
      text: string,
      opts: { size?: number; f?: typeof font; color?: typeof TEXT; gap?: number } = {},
    ) => {
      const size = opts.size ?? 11;
      const f = opts.f ?? font;
      const color = opts.color ?? TEXT;
      const lines = wrap(text, f, size, PAGE_W - M * 2);
      const lh = size * 1.35;
      for (const ln of lines) {
        ensure(lh);
        page.drawText(ln, { x: M, y: y - size, size, font: f, color });
        y -= lh;
      }
      y -= opts.gap ?? 4;
    };
    const heading = (t: string) => {
      ensure(28);
      y -= 8;
      drawText(t, { size: 14, f: bold, color: PRIMARY, gap: 6 });
    };
    const list = (items: string[], numbered = false) => {
      if (!items.length) {
        drawText("None.", { color: MUTED });
        return;
      }
      items.forEach((it, i) => {
        drawText(`${numbered ? `${i + 1}.` : "•"} ${it}`);
      });
    };
    const chips = (items: string[]) => {
      if (!items.length) {
        drawText("None.", { color: MUTED });
        return;
      }
      drawText(items.join("  •  "));
    };
    const stat = (label: string, value: number) => {
      drawText(`${label}: ${value}%`, { f: bold, size: 11 });
    };

    // Header
    drawText("ResumeIQ — Analysis Report", { size: 22, f: bold, color: PRIMARY, gap: 4 });
    drawText(new Date(a.created_at).toLocaleString(), { size: 10, color: MUTED, gap: 8 });
    drawText(`File: ${a.file_name}`, { size: 11, gap: 14 });

    if (a.summary) {
      heading("Executive Summary");
      drawText(a.summary);
    }

    heading("Scores");
    stat("Match Score", a.match_score);
    stat("ATS Score", a.ats_score);
    stat("Resume Strength", a.resume_strength);
    stat("Skill Coverage", a.skill_coverage);
    stat("Industry Readiness", a.readiness_score);
    stat("Employability", a.employability_score);
    stat("Hiring Readiness", a.hiring_readiness_score);

    heading("Matched Skills");
    chips(arr(a.matched_skills));
    heading("Missing Skills");
    chips(arr(a.missing_skills));
    heading("All Resume Skills");
    chips(arr(a.existing_skills));
    heading("Recommended Skills");
    chips(arr(a.recommended_skills));

    heading("Strengths");
    list(arr(a.strengths));
    heading("Weaknesses");
    list(arr(a.weaknesses));
    heading("Learning Path");
    list(arr(a.learning_path), true);
    heading("Recommended Certifications");
    list(arr(a.recommended_certifications));
    heading("Interview Tips");
    list(arr(a.interview_tips));
    heading("Recommendations");
    list(arr(a.recommendations));

    const bytes = await pdf.save();

    const path = `${userId}/${a.id}.pdf`;
    const up = await supabase.storage
      .from("reports")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (up.error) throw new Error(up.error.message);

    // Upsert report row
    await supabase
      .from("reports")
      .delete()
      .eq("analysis_id", a.id);
    await supabase.from("reports").insert({
      user_id: userId,
      analysis_id: a.id,
      path,
    });

    const signed = await supabase.storage.from("reports").createSignedUrl(path, 300);
    if (signed.error || !signed.data) throw new Error("Could not generate report URL");
    return { url: signed.data.signedUrl, path };
  });