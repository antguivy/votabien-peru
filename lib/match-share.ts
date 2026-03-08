// Encodes/decodes a match result into a shareable URL-safe string.
// Only stores candidate IDs per category (lightweight) — the receiving
// page fetches full candidate data from the API using those IDs.

import { CategoryType } from "@/store/saved-match-results";

export interface SharePayload {
  v: 1;
  at: string; // ISO date
  s: Partial<Record<CategoryType, string[]>>; // category → candidate IDs
}

/**
 * Encode a SharePayload into a URL-safe base64 string.
 */
export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json, "utf-8").toString("base64");
}

/**
 * Decode a URL-safe base64 string back into a SharePayload.
 * Returns null if the string is invalid.
 */
export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    let json: string;
    if (typeof window !== "undefined") {
      json = decodeURIComponent(escape(atob(encoded)));
    } else {
      json = Buffer.from(encoded, "base64").toString("utf-8");
    }
    const parsed = JSON.parse(json);
    if (parsed?.v === 1 && parsed?.s) return parsed as SharePayload;
    return null;
  } catch {
    return null;
  }
}

/**
 * Build a full share URL for the given selections.
 * Example: https://votabienperu.com/match/shared?d=<encoded>
 */
export function buildShareUrl(
  selections: Partial<Record<CategoryType, { id: string }[]>>,
  savedAt: string,
): string {
  const payload: SharePayload = {
    v: 1,
    at: savedAt,
    s: Object.fromEntries(
      Object.entries(selections).map(([cat, candidates]) => [
        cat,
        (candidates ?? []).map((c) => c.id),
      ]),
    ) as Partial<Record<CategoryType, string[]>>,
  };

  const encoded = encodeSharePayload(payload);
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}/match/shared`
      : "/match/shared";

  return `${base}?d=${encoded}`;
}

/**
 * Open the native share sheet (Web Share API) or fall back to clipboard copy.
 * Returns "shared" | "copied" | "error".
 */
export async function shareOrCopy(
  url: string,
  title = "Mi selección electoral",
  text = "Mira los candidatos que elegí con VotaBien Perú:",
): Promise<"shared" | "copied" | "error"> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "error";
  }
}

/**
 * Build a WhatsApp share URL directly.
 */
export function buildWhatsAppUrl(shareUrl: string, text?: string): string {
  const message = encodeURIComponent(
    `${text ?? "Mira los candidatos que elegí con VotaBien Perú"}\n${shareUrl}`,
  );
  return `https://wa.me/?text=${message}`;
}
