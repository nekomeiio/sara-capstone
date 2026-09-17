"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { dateKeyFromIso, formatDateKey, localDateFromKey, todayDateKey } from "@/lib/dates";
import type { WornOutfitDTO } from "@/lib/outfits";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type HistoryCalendarProps = {
  wornOutfits: WornOutfitDTO[];
};

export default function HistoryCalendar({ wornOutfits }: HistoryCalendarProps) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const outfitsByDate = useMemo(() => {
    const map = new Map<string, WornOutfitDTO[]>();
    for (const outfit of wornOutfits) {
      const key = dateKeyFromIso(outfit.dateWorn);
      const bucket = map.get(key) ?? [];
      bucket.push(outfit);
      map.set(key, bucket);
    }
    return map;
  }, [wornOutfits]);

  const { year, month } = monthCursor;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayKey = todayDateKey();
  const selectedOutfits = selectedDateKey ? (outfitsByDate.get(selectedDateKey) ?? []) : [];

  const goToPreviousMonth = () =>
    setMonthCursor((prev) => (prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }));
  const goToNextMonth = () =>
    setMonthCursor((prev) => (prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10"
        >
          ‹
        </button>
        <span className="text-sm font-medium">
          {new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-black/40 dark:text-white/40">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} />;

          const key = formatDateKey(year, month, day);
          const dayOutfits = outfitsByDate.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedDateKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDateKey(dayOutfits.length > 0 ? key : null)}
              disabled={dayOutfits.length === 0}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-md border text-xs disabled:cursor-default ${
                isSelected
                  ? "border-black dark:border-white"
                  : isToday
                    ? "border-black/40 dark:border-white/40"
                    : "border-black/5 dark:border-white/5"
              }`}
            >
              <span>{day}</span>
              {dayOutfits.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white" />}
            </button>
          );
        })}
      </div>

      {selectedDateKey && (
        <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {localDateFromKey(selectedDateKey).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedDateKey(null)}
              className="text-xs text-black/40 dark:text-white/40"
            >
              Close
            </button>
          </div>
          {selectedOutfits.map((outfit) => (
            <div key={outfit.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {outfit.items.map((item) => (
                  <div key={item.id} className="relative h-14 w-14 overflow-hidden rounded-md">
                    <Image src={item.imageUrl} alt={item.subcategory} fill className="object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-black/60 dark:text-white/60">
                {outfit.sourceType === "generated_accepted" ? "AI suggestion" : "Logged manually"}
                {outfit.contextNote ? ` · ${outfit.contextNote}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
