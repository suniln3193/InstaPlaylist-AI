import { NextResponse } from "next/server";
import { generateText, cleanAndParseJson } from "@/lib/openrouter";

const MAX_RETRIES = 2;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, playlist, keyword, slides, apiKey, model } = body;

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: "Slides array is required" }, { status: 400 });
    }

    const featuredTools = slides
      .slice(1, Math.max(2, slides.length - 2))
      .map((s: any) => s.title)
      .filter(Boolean)
      .slice(0, 4)
      .join(", ");

    const ctaWord = keyword || "CODE";

    const systemPrompt = `Instagram caption writer for @sunilcodecraft (developer niche).
Return ONLY a JSON object. No markdown. No explanation.
Format: {"caption":"full caption text with line breaks as \\n","hashtags":["tag1","tag2","tag3","tag4","tag5"]}
Caption must: hook → pain point → value (mention: ${featuredTools}) → CTA (comment "${ctaWord}") → save reminder.`;

    const userPrompt = `Write Instagram caption for: "${topic}". Playlist: ${playlist || "Developer Hacks"}.`;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const textOutput = await generateText({ prompt: userPrompt, systemPrompt, apiKey, model });
        const result = cleanAndParseJson(textOutput);

        const caption = result.caption || result.text || result.body || "";
        const hashtags = Array.isArray(result.hashtags)
          ? result.hashtags.map((h: string) => h.replace("#", ""))
          : [];

        if (caption) {
          return NextResponse.json({ caption, hashtags });
        }
        throw new Error("Caption was empty");
      } catch (err: any) {
        console.warn(`[generate-caption] Attempt ${attempt + 1} failed:`, err.message);
        if (attempt < MAX_RETRIES - 1) await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Fallback: generate a minimal caption without JSON parsing
    try {
      const fallbackSystem = `Write a short Instagram caption for a developer post about "${topic}". 
Include: hook, value, CTA asking to comment "${ctaWord}". Plain text only, no JSON.`;
      const fallbackText = await generateText({ prompt: fallbackSystem, apiKey, model });
      return NextResponse.json({
        caption: fallbackText.trim(),
        hashtags: ["webdev", "coding", "developer", "programming", "techlife"],
      });
    } catch {
      // Return a minimal template caption
      return NextResponse.json({
        caption: `🔥 ${topic}\n\nEvery developer needs to know this.\n\nSave this for later 📌\n\nComment "${ctaWord}" to get the full resource pack sent to your DMs.\n\n— @sunilcodecraft`,
        hashtags: ["webdev", "coding", "developer", "programming", "100daysofcode"],
      });
    }
  } catch (error: any) {
    console.error("Error in generate-caption API:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
