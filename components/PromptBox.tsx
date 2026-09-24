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
      <label htmlFor="prompt" className="muted">
        Describe the occasion
      </label>
      <textarea
        id="prompt"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="e.g. party tonight, chic"
        rows={3}
        disabled={isGenerating}
        className="input-field disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => promptText.trim() && onSubmit(promptText.trim())}
        disabled={isGenerating || !promptText.trim()}
        className="btn-solid w-fit"
      >
        {isGenerating ? "Styling…" : "Generate outfit"}
      </button>
    </div>
  );
}
