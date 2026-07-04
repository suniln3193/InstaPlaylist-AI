import { NextResponse } from "next/server";
import { generateText } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, slides, apiKey, model } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const systemPrompt = `You are a developer relations expert and social media manager.
Your job is to generate a comprehensive, high-value Resource Pack in markdown format.
Brand: @sunilcodecraft
Topic: ${topic}

Structure:
# Developer Toolkit: [Topic] 🚀

Introduction paragraph highlighting the value.

## Featured Resources (Describe the tools from the slides: ${Array.isArray(slides) ? JSON.stringify(slides.slice(1, -2).map((s: any) => s.title)) : "relevant tools"})
For each tool, provide:
- Name
- Brief description of what it does
- Direct URL link (use real-world or placeholder developer site URLs)
- Key features list

## Bonus Resources
Additional tools, VS Code extensions, or GitHub repositories that developers will find useful.

## Developer Roadmap / Action Items
A checklist of steps to implement this tech.

Write clean, valid markdown. Do not wrap in JSON, just return raw markdown.`;

    const userPrompt = `Generate a markdown resource toolkit file for: "${topic}".`;

    const markdownOutput = await generateText({
      prompt: userPrompt,
      systemPrompt,
      apiKey,
      model,
    });

    return NextResponse.json({ markdown: markdownOutput });
  } catch (error: any) {
    console.error("Error in generate-resources API:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
