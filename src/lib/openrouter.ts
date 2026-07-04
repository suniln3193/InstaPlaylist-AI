export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  apiKey?: string;
  model?: string;
}

/**
 * Calls Pollinations.ai text generation (keyless, free, no account needed).
 * Uses their OpenAI-compatible chat completions endpoint.
 */
async function callPollinations(prompt: string, systemPrompt?: string): Promise<string> {
  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: prompt },
  ];

  // Pollinations OpenAI-compatible endpoint
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai",  // Pollinations routes to best available model
        messages,
        temperature: 0.7,
        max_tokens: 3000,
        stream: false,
      }),
      signal: controller.signal,
      // Disable Next.js fetch caching — every generation must be fresh
      cache: "no-store",
    } as RequestInit);

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => "(no body)");
      throw new Error(`Pollinations API error (${response.status}): ${errText}`);
    }

    const responseText = await response.text();
    console.log("[Pollinations] Raw response length:", responseText.length);
    console.log("[Pollinations] Raw response (first 200):", responseText.substring(0, 200));

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // If the response isn't JSON at all, it might be plain text
      if (responseText.trim().length > 0) {
        console.log("[Pollinations] Response is plain text, not JSON — using as-is");
        return responseText.trim();
      }
      throw new Error("Pollinations returned unparseable response");
    }

    const content = data?.choices?.[0]?.message?.content;
    console.log("[Pollinations] content length:", content ? content.length : "NULL/UNDEFINED");

    if (content == null || content === "") {
      // Try to get finish_reason to understand why
      const finishReason = data?.choices?.[0]?.finish_reason ?? "unknown";
      console.error("[Pollinations] Empty content. finish_reason:", finishReason, "Full data:", JSON.stringify(data).substring(0, 300));
      throw new Error(`Pollinations returned empty content (finish_reason: ${finishReason})`);
    }

    return content;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Request timed out (60s). Pollinations AI may be busy — please try again.");
    }
    throw err;
  }

}

/**
 * Calls OpenRouter API with a provided key.
 */
async function callOpenRouter(
  prompt: string,
  systemPrompt: string | undefined,
  apiKey: string,
  model: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://instaplaylist.ai",
        "X-Title": "InstaPlaylist AI",
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "(no body)");
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned empty content");
    return content;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Request timed out (90s). Please try again or use a faster model.");
    }
    throw err;
  }
}

export async function generateText({
  prompt,
  systemPrompt,
  apiKey,
  model = "google/gemma-2-9b-it:free",
}: GenerateTextOptions): Promise<string> {
  const key = apiKey || process.env.OPENROUTER_API_KEY || "";

  if (!key) {
    // Use free keyless Pollinations.ai
    return callPollinations(prompt, systemPrompt);
  }

  return callOpenRouter(prompt, systemPrompt, key, model);
}

/**
 * Attempts to recover all complete JSON objects from a truncated array string.
 * e.g. "[{...}, {...}, {" → extracts the two complete objects.
 */
function recoverPartialJsonArray(text: string): any[] | null {
  const results: any[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        try {
          const obj = JSON.parse(text.substring(start, i + 1));
          results.push(obj);
        } catch {
          // skip malformed object
        }
        start = -1;
      }
    }
  }

  return results.length > 0 ? results : null;
}

/**
 * Robustly cleans an LLM response and parses it as JSON.
 * Handles markdown fences, conversational preamble, trailing commas, truncated arrays.
 */
export function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();

  // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json|javascript|js|ts|typescript)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  // 2. Extract the outermost JSON structure ([...] or {...})
  const firstBracket = cleaned.indexOf("[");
  const firstBrace = cleaned.indexOf("{");
  let startIdx = -1;
  let endIdx = -1;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf("]");
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf("}");
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  // 3. Remove trailing commas before ] or } (invalid JSON)
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  // 4. Fix unquoted keys (basic heuristic)
  // cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Fallback 1: regex match for a complete JSON structure
    const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // fall through to partial recovery
      }
    }

    // Fallback 2: partial array recovery — extracts all complete {…} objects
    // This handles truncated responses from free AI models
    const partial = recoverPartialJsonArray(text);
    if (partial && partial.length > 0) {
      console.warn(`cleanAndParseJson: recovered ${partial.length} objects from truncated response`);
      return partial;
    }

    throw e;
  }
}
