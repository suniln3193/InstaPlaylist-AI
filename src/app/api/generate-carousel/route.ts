import { NextResponse } from "next/server";
import { generateText, cleanAndParseJson } from "@/lib/openrouter";
const MAX_RETRIES = 3;

/** Normalize raw parsed value into a clean slides array */
function extractSlidesArray(parsed: any): any[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    for (const key of ["slides", "carousel", "data", "items", "results"]) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    const arrayKey = Object.keys(parsed).find((k) => Array.isArray((parsed as any)[k]));
    if (arrayKey) return (parsed as any)[arrayKey];
    return [parsed]; // wrap single object
  }
  return [];
}

/** Normalize each slide to guarantee all required fields exist */
function normalizeSlide(slide: any, idx: number, topic: string) {
  return {
    slide_number: slide.slide_number ?? idx + 1,
    title: (slide.title ?? `Slide ${idx + 1}`).toString(),
    subtitle: slide.subtitle ?? "",
    description: slide.description ?? "",
    bullets: Array.isArray(slide.bullets) ? slide.bullets.filter(Boolean) : [],
    visual_suggestion: slide.visual_suggestion ?? "",
    image_prompt: slide.image_prompt ?? `${slide.title ?? topic} developer aesthetic dark background yellow accents`,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      topic,
      playlist,
      keyword,
      slideCount = 6,
      apiKey,
      model,
    } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const ctaWord = keyword || "CODE";

    // Two prompt variants — if one fails, retry with the other
    const prompts = [
      // Variant A: compact schema example
      {
        system: `Instagram carousel creator for @sunilcodecraft. Return ONLY a JSON array, nothing else.
Format: [{"slide_number":1,"title":"Title Case","subtitle":"Sub","description":"one sentence","bullets":["a","b","c"],"visual_suggestion":"layout","image_prompt":"${topic} dark bg yellow accents"}]
CRITICAL TONE GUIDELINES: The content MUST be highly professional, deeply researched, and educational. NO CLICKBAIT. Titles should be clean, authoritative, and properly cased (e.g., "The Architecture of X", "Advanced Patterns in Y").
CRITICAL LENGTH GUIDELINES: Keep text EXTREMELY CONCISE. Descriptions must be 1 short sentence. Bullets must be 4-6 words maximum. This must fit on a small mobile slide.
Slide 1 title must introduce "${topic}" professionally.
Slides 2-${slideCount - 2}: highly technical, accurate, real-world tools/tips about "${topic}".
Slide ${slideCount - 1}: tease upcoming advanced concepts for the next post.
Slide ${slideCount}: CTA, ask viewer to comment "${ctaWord}".`,
        user: `Generate ${slideCount} professional slides for topic: "${topic}".`,
      },
      // Variant B: numbered instructions, no schema
      {
        system: `You output ONLY valid JSON arrays. No markdown. No text. No explanation.
Output a JSON array of ${slideCount} objects for an Instagram carousel about "${topic}" for senior developers.
Each object must have: slide_number, title (Proper Case, highly professional, no clickbait), subtitle, description (1 short sentence max), bullets (array of 3, very short 4-6 words max), visual_suggestion, image_prompt.
First slide: hook, title includes "${topic}". Middle slides: well-researched, deeply technical resources for "${topic}". Last slide: CTA with "${ctaWord}".`,
        user: `["${topic}" professional carousel, ${slideCount} slides, deeply researched]`,
      },
    ];

    let lastRawOutput = "";
    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const variant = prompts[attempt % prompts.length];
      console.log(`[generate-carousel] Attempt ${attempt + 1}/${MAX_RETRIES}`);

      try {
        const textOutput = await generateText({
          prompt: variant.user,
          systemPrompt: variant.system,
          apiKey,
          model,
        });

        lastRawOutput = textOutput;
        console.log(`[generate-carousel] Raw output (attempt ${attempt + 1}, len=${textOutput.length}):`, textOutput.substring(0, 200));

        const parsed = cleanAndParseJson(textOutput);
        const slidesArray = extractSlidesArray(parsed);

        if (!slidesArray.length) {
          throw new Error("Parsed result contained no slides");
        }

        const normalizedSlides = slidesArray.map((s, i) => normalizeSlide(s, i, topic));

        console.log(`[generate-carousel] ✅ Success on attempt ${attempt + 1}: ${normalizedSlides.length} slides`);
        return NextResponse.json({ topic, playlist, keyword, slides: normalizedSlides });

      } catch (err: any) {
        lastError = err;
        console.warn(`[generate-carousel] Attempt ${attempt + 1} failed:`, err.message);

        // Don't retry on timeout or network errors — they'll just time out again
        if (err.message?.includes("timed out") || err.message?.includes("fetch")) {
          break;
        }

        // Small delay before retry to avoid rate limiting
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    // All retries exhausted — return last error with raw output for debugging
    console.error("[generate-carousel] All retries failed. Last raw output:", lastRawOutput.substring(0, 500));
    return NextResponse.json(
      {
        error: `Failed after ${MAX_RETRIES} attempts. ${lastError?.message ?? "AI returned invalid JSON."}`,
        hint: "The free AI model is unreliable. Add an OpenRouter API key for better results.",
        rawOutput: lastRawOutput.substring(0, 800),
      },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("Error in generate-carousel API:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
