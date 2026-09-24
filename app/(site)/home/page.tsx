"use client";

import { useEffect, useState } from "react";
import OutfitCard from "@/components/OutfitCard";
import PromptBox from "@/components/PromptBox";
import { useToast } from "@/components/ToastProvider";
import { MIN_WARDROBE_ITEMS_FOR_TRY_NEW } from "@/lib/constants";
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
  const { showToast } = useToast();
  const [wardrobeCount, setWardrobeCount] = useState<number | null>(null);
  const [lastRequest, setLastRequest] = useState<LastRequest | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTryingNew, setIsTryingNew] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/wardrobe")
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setWardrobeCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => {
        if (!ignore) setWardrobeCount(0);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const runGeneration = async (endpoint: string, body: object | undefined, request: LastRequest) => {
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
      showToast(err instanceof Error ? err.message : "Couldn't generate an outfit.");
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
  const hasNoWardrobe = wardrobeCount === 0;
  const tryNewLocked = wardrobeCount !== null && wardrobeCount < MIN_WARDROBE_ITEMS_FOR_TRY_NEW;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">What are you wearing today?</h1>

      {hasNoWardrobe && <p className="muted-faint">Add a few wardrobe items before generating outfits.</p>}

      <PromptBox onSubmit={generateFromPrompt} isGenerating={isGenerating || hasNoWardrobe} />

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="muted">or</span>
          <button
            type="button"
            onClick={generateTryNew}
            disabled={isBusy || tryNewLocked}
            className="btn-outline w-fit"
          >
            {isTryingNew ? "Finding something…" : "Try Something New"}
          </button>
        </div>
        {tryNewLocked && (
          <p className="muted-faint text-xs">
            Add a few more items to unlock this — you need at least {MIN_WARDROBE_ITEMS_FOR_TRY_NEW}{" "}
            wardrobe items.
          </p>
        )}
      </div>

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
