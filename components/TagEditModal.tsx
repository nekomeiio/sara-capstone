"use client";

import { useState } from "react";
import { SEASONS, WARDROBE_CATEGORIES } from "@/lib/constants";
import type { WardrobeItemDTO } from "@/lib/wardrobe";

type TagEditModalProps = {
  item: WardrobeItemDTO;
  onClose: () => void;
  onSaved: (item: WardrobeItemDTO) => void;
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const inputClass = "input-field";

export default function TagEditModal({ item, onClose, onSaved }: TagEditModalProps) {
  const [category, setCategory] = useState(item.category);
  const [subcategory, setSubcategory] = useState(item.subcategory);
  const [primaryColor, setPrimaryColor] = useState(item.primaryColor);
  const [secondaryColors, setSecondaryColors] = useState(item.secondaryColors.join(", "));
  const [pattern, setPattern] = useState(item.pattern);
  const [materialGuess, setMaterialGuess] = useState(item.materialGuess);
  const [formality, setFormality] = useState(item.formality);
  const [seasons, setSeasons] = useState(new Set(item.seasons));
  const [fitStyle, setFitStyle] = useState(item.fitStyle);
  const [tags, setTags] = useState(item.tags.join(", "));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSeason = (season: string) => {
    setSeasons((prev) => {
      const next = new Set(prev);
      if (next.has(season)) next.delete(season);
      else next.add(season);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/wardrobe/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subcategory,
          primaryColor,
          secondaryColors: splitList(secondaryColors),
          pattern,
          materialGuess,
          formality,
          seasons: Array.from(seasons),
          fitStyle,
          tags: splitList(tags),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Couldn't save changes.");
      onSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-neutral-900">
        <h2 className="page-title mb-4 text-lg">Edit tags</h2>
        <div className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {WARDROBE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Subcategory
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            Primary color
            <input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            Secondary colors (comma-separated)
            <input
              value={secondaryColors}
              onChange={(e) => setSecondaryColors(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            Pattern
            <input value={pattern} onChange={(e) => setPattern(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            Material guess
            <input
              value={materialGuess}
              onChange={(e) => setMaterialGuess(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            Formality (1-5)
            <input
              type="number"
              min={1}
              max={5}
              value={formality}
              onChange={(e) => setFormality(Number(e.target.value))}
              className={inputClass}
            />
          </label>
          <fieldset className="flex flex-col gap-1">
            <legend>Seasons</legend>
            <div className="flex flex-wrap gap-3">
              {SEASONS.map((season) => (
                <label key={season} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={seasons.has(season)}
                    onChange={() => toggleSeason(season)}
                  />
                  {season}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1">
            Fit style
            <input value={fitStyle} onChange={(e) => setFitStyle(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            Tags (comma-separated)
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isSaving} className="btn-outline">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="btn-solid">
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
