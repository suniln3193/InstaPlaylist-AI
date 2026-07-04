import { NextResponse } from "next/server";

/**
 * GET /api/ping — Tests connectivity to Pollinations.ai text endpoint.
 * Useful for debugging whether keyless mode is working.
 */
export async function GET() {
  const startTime = Date.now();
  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: 'Reply with exactly: {"status":"ok"}' }],
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const text = await response.text().catch(() => "(no body)");
      return NextResponse.json({
        reachable: false,
        status: response.status,
        error: text,
        elapsed_ms: elapsed,
      }, { status: 200 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "(empty)";

    return NextResponse.json({
      reachable: true,
      response: content,
      elapsed_ms: elapsed,
    });
  } catch (err: any) {
    return NextResponse.json({
      reachable: false,
      error: err.message,
      elapsed_ms: Date.now() - startTime,
    });
  }
}
