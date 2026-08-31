"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AdminShortcutListener() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.altKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        router.push("/auth/login?callbackUrl=/admin");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
