import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Generate a random stable seed so that successive requests for the same prompt get the same image.
    // We can sum the character codes of the prompt to create a simple stable seed.
    let seed = 42;
    for (let i = 0; i < prompt.length; i++) {
      seed = (seed + prompt.charCodeAt(i)) % 100000;
    }

    // Clean prompt for the URL
    const cleanPrompt = encodeURIComponent(
      `${prompt}, developer aesthetic, SaaS dashboard design, neon theme`
    );

    // Build Pollinations.ai URL with premium parameters
    // We set nologo=true to make it clean, and specify width/height to match Instagram's 4:5 aspect ratio (800x1000)
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1350&nologo=true&model=flux&seed=${seed}`;

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("Error in generate-images API:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
