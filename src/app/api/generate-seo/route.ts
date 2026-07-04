import { NextResponse } from "next/server";
import { generateText, cleanAndParseJson } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, apiKey, model } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const systemPrompt = `SEO expert. Return ONLY a JSON object, no markdown, no explanation.
Format: {"title":"title|sunilcodecraft","description":"desc under 155 chars","keywords":"kw1,kw2,kw3,kw4,kw5","slug":"url-slug","og_title":"og title","og_description":"og desc"}`;

    const userPrompt = `Generate SEO metadata for developer Instagram post about: "${topic}"`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const textOutput = await generateText({ prompt: userPrompt, systemPrompt, apiKey, model });
        const result = cleanAndParseJson(textOutput);

        if (result && result.title) {
          return NextResponse.json(result);
        }
        throw new Error("Missing title field");
      } catch (err: any) {
        console.warn(`[generate-seo] Attempt ${attempt + 1} failed:`, err.message);
        if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
      }
    }

    // Fallback: construct SEO from the topic itself (no AI needed)
    const fallback = {
      title: `${topic} | @sunilcodecraft`,
      description: `Discover the best tools, resources, and tips for ${topic}. Curated for developers by @sunilcodecraft.`,
      keywords: `${topic}, developer tools, programming, web development, coding, github, vscode, ai coding`,
      slug,
      og_title: `${topic} — Developer Resources`,
      og_description: `Top tools and resources for ${topic}. Follow @sunilcodecraft for more.`,
    };

    return NextResponse.json(fallback);

  } catch (error: any) {
    console.error("Error in generate-seo API:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
