"use client";

import { useState } from "react";
import OutfitCard from "@/components/OutfitCard";
import PromptBox from "@/components/PromptBox";
import type { WardrobeItemDTO } from "@/lib/wardrobe";

type Suggestion = {
  suggestionId: string;
  items: WardrobeItemDTO[];
  explanation: string;
  confidence: "high" | "medium" | "low";
};

export default function HomePage() {
  const [lastPromptText, setLastPromptText] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (promptText: string) => {
    setIsGenerating(true);
    setError(null);
    setLastPromptText(promptText);
    try {
      const response = await fetch("/api/generate/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't generate an outfit.");
      setSuggestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate an outfit.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">What are you wearing today?</h1>

      <PromptBox onSubmit={generate} isGenerating={isGenerating} />

      <div className="flex items-center gap-3">
        <span className="text-sm text-black/60 dark:text-white/60">or</span>
        <button
          type="button"
          disabled
          title="Coming in Phase 4"
          className="w-fit rounded-md border border-black/10 px-4 py-2 text-sm disabled:opacity-40 dark:border-white/10"
        >
          Try Something New
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {suggestion && (
        <OutfitCard
          items={suggestion.items}
          explanation={suggestion.explanation}
          confidence={suggestion.confidence}
          onRegenerate={() => generate(lastPromptText)}
          isRegenerating={isGenerating}
        />
      )}
    </div>
  );
}
