"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes server components without exposing the QuantCo API to the browser. */
export function LiveRefresh({ intervalSeconds }: { intervalSeconds: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refresh, intervalSeconds * 1_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [intervalSeconds, router]);

  return null;
}
