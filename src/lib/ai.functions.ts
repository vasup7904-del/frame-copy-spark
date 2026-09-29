import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  system: z.string().default("You are a careful, factual career writing assistant."),
  prompt: z.string().min(1),
  json: z.boolean().optional(),
});

const GUARD = `
Hard rules you must never break:
- Never invent jobs, employers, schools, degrees, dates, metrics, numbers, certifications or skills.
- Only rewrite or reorganise information the user has already provided.
- If a detail is missing and would be needed, insert a clearly marked placeholder like [ADD METRIC] instead of inventing it.
- Never claim a score guarantees passing an applicant tracking system.
`;

async function callGateway(system: string, prompt: string, wantJson: boolean) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this app yet.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                system +
                "\n" +
                GUARD +
                (wantJson
                  ? "\nRespond with raw JSON only. No markdown fences, no commentary."
                  : "\nRespond with plain text only. No markdown fences."),
            },
          ],
        },
        { role: "user", content: [{ type: "input_text", text: prompt }] },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI is busy right now. Try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits are exhausted. Add credits in your workspace settings.");
    throw new Error(`AI request failed (${res.status}). ${body.slice(0, 200)}`);
  }
  if (!res.body) throw new Error("AI returned an empty response.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.error" || evt.type === "error") {
            throw new Error(evt.error?.message ?? "AI stream error");
          }
        } catch {
          /* ignore partial frames */
        }
      }
    }
  }

  return text.trim();
}

export const aiGenerate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const text = await callGateway(data.system, data.prompt, data.json ?? false);
    return { text };
  });
