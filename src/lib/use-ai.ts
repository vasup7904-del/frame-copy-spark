import { useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { aiGenerate } from "./ai.functions";

export function useAI() {
  const run = useServerFn(aiGenerate);
  const [loading, setLoading] = useState(false);

  const ask = useCallback(
    async (prompt: string, opts?: { system?: string | undefined; json?: boolean }) => {
      setLoading(true);
      try {
        const res = await run({
          data: {
            prompt,
            system: opts?.system ?? "You are a careful, factual career writing assistant.",
            json: opts?.json ?? false,
          },
        });
        return res.text;
      } catch (err) {
        const message = err instanceof Error ? err.message : "The AI request failed.";
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [run],
  );

  const askJson = useCallback(
    async <T,>(prompt: string, system?: string): Promise<T | null> => {
      const text = await ask(prompt, { system, json: true });
      if (!text) return null;
      const cleaned = text
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();
      try {
        return JSON.parse(cleaned) as T;
      } catch {
        const match = cleaned.match(/[[{][\s\S]*[\]}]/);
        if (match) {
          try {
            return JSON.parse(match[0]) as T;
          } catch {
            /* fall through */
          }
        }
        toast.error("The AI response could not be read. Try again.");
        return null;
      }
    },
    [ask],
  );

  return { ask, askJson, loading };
}
