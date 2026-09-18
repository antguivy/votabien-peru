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
          const isDesktop = window.innerWidth >= 1024;
          // Offset below sticky navbar (72px desktop) + sticky chips (~50px)
          const headerOffset = offsetPx ?? (isDesktop ? 130 : 64);

          const scrollPosition = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;

          // 1. Edge case: Bottom of page reached -> activate the last section
          if (windowHeight + scrollPosition >= documentHeight - 50) {
            const lastSectionId = sectionIds[sectionIds.length - 1];
            if (lastSectionId) {
              setActiveId(lastSectionId);
            }
            ticking = false;
            return;
          }

          // 2. Determine active section based on reading position
          let currentActiveId = sectionIds[0];

          for (const id of sectionIds) {
            const el = document.getElementById(id);
            if (!el) continue;
            const rect = el.getBoundingClientRect();

            // When section top reaches or passes the sticky header offset
            if (rect.top <= headerOffset + 30) {
              currentActiveId = id;
            } else {
              // Sections are sequentially ordered in DOM, so we can stop
              break;
            }
          }

          setActiveId(currentActiveId);
          ticking = false;
        });

        ticking = true;
      }
    };

    // Run once on mount to set initial state accurately
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
    (targetId: string, highlight = true) => {
      if (typeof window === "undefined") return;

      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      isClickScrolling.current = true;
      setActiveId(targetId);

      const isDesktop = window.innerWidth >= 1024;
      const dynamicOffset = offsetPx ?? (isDesktop ? 124 : 64);

      const targetRect = targetEl.getBoundingClientRect();
      const targetPosition = targetRect.top + window.scrollY - dynamicOffset;

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: "smooth",
      });

      if (highlight) {
        targetEl.classList.remove("flash-highlight");
        void targetEl.offsetWidth;
        targetEl.classList.add("flash-highlight");
      }

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
