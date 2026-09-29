import { Check, RefreshCw, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./glass";

export function AiSuggestion({
  original,
  suggestion,
  loading,
  onAccept,
  onReject,
  onRegenerate,
}: {
  original?: string;
  suggestion: string;
  loading?: boolean;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
}) {
  return (
    <GlassCard soft className="mt-2 p-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="size-3.5" /> AI suggestion
      </div>
      {original ? (
        <p className="mt-2 text-xs text-muted-foreground line-through decoration-muted-foreground/40">
          {original}
        </p>
      ) : null}
      <p className="mt-1.5 whitespace-pre-wrap text-sm">{suggestion}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onAccept} disabled={loading}>
          <Check className="size-3.5" /> Accept
        </Button>
        <Button size="sm" variant="outline" onClick={onRegenerate} disabled={loading}>
          <RefreshCw className="size-3.5" /> Regenerate
        </Button>
        <Button size="sm" variant="ghost" onClick={onReject} disabled={loading}>
          <X className="size-3.5" /> Reject
        </Button>
      </div>
    </GlassCard>
  );
}
