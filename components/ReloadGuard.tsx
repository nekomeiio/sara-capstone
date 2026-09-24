"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReloadGuard() {
  const router = useRouter();

  useEffect(() => {
    // Next.js Fast Refresh falls back to a real browser reload when it can't
    // hot-swap a change during development, which looks identical to the user
    // pressing refresh from the Navigation Timing API's perspective. Only
    // treat this as a genuine reload in production, where that never happens.
    if (process.env.NODE_ENV !== "production") return;

    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entry?.type === "reload") {
      router.replace("/");
    }
  }, [router]);

  return null;
}
