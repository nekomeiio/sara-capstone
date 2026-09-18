function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// dateWorn is a pure calendar date (no meaningful time-of-day), stored as a
// UTC-midnight instant. Deriving keys via toISOString()/local Date getters
// mixes local and UTC interpretation and can shift the date by one near
// midnight depending on the viewer's timezone — these helpers avoid that by
// working on the "YYYY-MM-DD" string/components directly.

export function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function todayDateKey(): string {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

// Prisma types this as Date, but a WornOutfitDTO consumed on the client
// arrives via JSON, where it's actually a serialized ISO string at runtime —
// accept either so callers don't need an unsafe cast.
export function dateKeyFromIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

export function localDateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}
