"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface UseScrollSpyOptions {
  sectionIds: string[];
  offsetPx?: number;
}

export function useScrollSpy({ sectionIds, offsetPx }: UseScrollSpyOptions) {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] || "");
  const isClickScrolling = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || sectionIds.length === 0) return;

    let ticking = false;

    const handleScroll = () => {
      if (isClickScrolling.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const headerOffset = offsetPx ?? 100;
          const scrollPosition = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;

          // Edge case: Bottom of page reached -> activate the last section
          if (windowHeight + scrollPosition >= documentHeight - 50) {
            const lastSectionId = sectionIds[sectionIds.length - 1];
            if (lastSectionId) {
              setActiveId(lastSectionId);
            }
            ticking = false;
            return;
          }

          // Determine active section based on reading position
          let currentActiveId = sectionIds[0];

          for (const id of sectionIds) {
            const el = document.getElementById(id);
            if (!el) continue;
            const rect = el.getBoundingClientRect();

            if (rect.top <= headerOffset + 30) {
              currentActiveId = id;
            } else {
              break;
            }
          }

          setActiveId(currentActiveId);
          ticking = false;
        });

        ticking = true;
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [sectionIds, offsetPx]);

  const scrollToSection = useCallback(
    (targetId: string) => {
      if (typeof window === "undefined") return;

      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      isClickScrolling.current = true;
      setActiveId(targetId);

      const dynamicOffset = offsetPx ?? 110;
      const targetRect = targetEl.getBoundingClientRect();
      const targetPosition = targetRect.top + window.scrollY - dynamicOffset;

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: "smooth",
      });

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      clickTimeoutRef.current = setTimeout(() => {
        isClickScrolling.current = false;
      }, 800);
    },
    [offsetPx],
  );

  return { activeId, scrollToSection };
}
