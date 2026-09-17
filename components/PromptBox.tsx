"use client";

import { useState } from "react";

type PromptBoxProps = {
  onSubmit: (promptText: string) => void;
  isGenerating: boolean;
};

export default function PromptBox({ onSubmit, isGenerating }: PromptBoxProps) {
  const [promptText, setPromptText] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="prompt" className="text-sm text-black/60 dark:text-white/60">
        Describe the occasion
      </label>
      <textarea
        id="prompt"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="e.g. party tonight, chic"
        rows={3}
        disabled={isGenerating}
        className="rounded-md border border-black/10 p-3 text-sm disabled:opacity-50 dark:border-white/10 dark:bg-neutral-900"
      />
      <button
        type="button"
        onClick={() => promptText.trim() && onSubmit(promptText.trim())}
        disabled={isGenerating || !promptText.trim()}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white dark:text-black"
      >
        {isGenerating ? "Styling…" : "Generate outfit"}
      </button>
    </div>
  );
}
