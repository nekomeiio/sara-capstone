"use client";

import { useState } from "react";
import OutfitCard from "@/components/OutfitCard";
import PromptBox from "@/components/PromptBox";
import type { WardrobeItemDTO } from "@/lib/wardrobe";

type Suggestion = {
  suggestionId: string;
  items: WardrobeItemDTO[];
  explanation: string;
  confidence?: "high" | "medium" | "low" | null;
  noveltyNote?: string | null;
};

type LastRequest = { kind: "prompt"; promptText: string } | { kind: "try-new" };

export default function HomePage() {
  const [lastRequest, setLastRequest] = useState<LastRequest | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTryingNew, setIsTryingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runGeneration = async (endpoint: string, body: object | undefined, request: LastRequest) => {
    setError(null);
    setLastRequest(request);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't generate an outfit.");
      setSuggestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate an outfit.");
    }
  };

  const generateFromPrompt = async (promptText: string) => {
    setIsGenerating(true);
    await runGeneration("/api/generate/prompt", { promptText }, { kind: "prompt", promptText });
    setIsGenerating(false);
  };

  const generateTryNew = async () => {
    setIsTryingNew(true);
    await runGeneration("/api/generate/try-new", undefined, { kind: "try-new" });
    setIsTryingNew(false);
  };

  const regenerate = () => {
    if (!lastRequest) return;
    if (lastRequest.kind === "prompt") generateFromPrompt(lastRequest.promptText);
    else generateTryNew();
  };

  const isBusy = isGenerating || isTryingNew;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">What are you wearing today?</h1>

      <PromptBox onSubmit={generateFromPrompt} isGenerating={isGenerating} />

      <div className="flex items-center gap-3">
        <span className="text-sm text-black/60 dark:text-white/60">or</span>
        <button
          type="button"
          onClick={generateTryNew}
          disabled={isBusy}
          className="w-fit rounded-md border border-black/10 px-4 py-2 text-sm disabled:opacity-40 dark:border-white/10"
        >
          {isTryingNew ? "Finding something…" : "Try Something New"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {suggestion && (
        <OutfitCard
          suggestionId={suggestion.suggestionId}
          items={suggestion.items}
          explanation={suggestion.explanation}
          confidence={suggestion.confidence}
          noveltyNote={suggestion.noveltyNote}
          onRegenerate={regenerate}
          isRegenerating={isBusy}
        />
      )}
    </div>
  );
}
