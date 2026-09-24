"use client";

import { useEffect, useState } from "react";
import HistoryCalendar from "@/components/HistoryCalendar";
import LogWornOutfitForm from "@/components/LogWornOutfitForm";
import { todayDateKey } from "@/lib/dates";
import type { WornOutfitDTO } from "@/lib/outfits";

export default function HistoryPage() {
  const [wornOutfits, setWornOutfits] = useState<WornOutfitDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logDate, setLogDate] = useState(todayDateKey());

  useEffect(() => {
    let ignore = false;
    fetch("/api/outfits/worn?limit=200")
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setWornOutfits(data);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = async (id: string): Promise<boolean> => {
    const previous = wornOutfits;
    setWornOutfits((prev) => prev.filter((outfit) => outfit.id !== id));
    const response = await fetch(`/api/outfits/worn/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setWornOutfits(previous);
      return false;
    }
    return true;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">Worn history</h1>

      <LogWornOutfitForm
        dateWorn={logDate}
        onDateChange={setLogDate}
        onLogged={(wornOutfit) => setWornOutfits((prev) => [wornOutfit, ...prev])}
      />

      {isLoading ? (
        <p className="muted-faint">Loading…</p>
      ) : (
        <>
          {wornOutfits.length === 0 && (
            <p className="muted-faint">
              No worn outfits logged yet — log one above, or accept an AI suggestion, to start building
              your history.
            </p>
          )}
          <HistoryCalendar wornOutfits={wornOutfits} onDelete={handleDelete} onDaySelect={setLogDate} />
        </>
      )}
    </div>
  );
}
