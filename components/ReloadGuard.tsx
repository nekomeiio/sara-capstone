"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReloadGuard() {
  const router = useRouter();

  useEffect(() => {
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entry?.type === "reload") {
      router.replace("/");
    }
  }, [router]);

  return null;
}
