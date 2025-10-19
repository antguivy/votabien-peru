'use client'
import { useCallback, useState } from "react";

/**
* useCopyToClipboard
* Simple, well-typed hook to copy text to clipboard with a fallback for older browsers.
* Supports multiple copy buttons by tracking which ID was copied.
*
* @param timeout ms after which `isCopied` resets to false (default 2000ms)
* @returns { copy, isCopied, error, reset }
*/
export function useCopyToClipboard(timeout = 2000) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCopiedId(null);
    setError(null);
  }, []);

  const copyToClipboard = useCallback(
    async (text: string | null, id?: string): Promise<boolean> => {
      setError(null);

      if (typeof text !== "string" || text.length === 0) {
        setError("No text provided to copy");
        return false;
      }

      try {
        // Preferred modern API
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else if (typeof document !== "undefined") {
          // Fallback for older browsers
          const textarea = document.createElement("textarea");
          textarea.value = text;
          // prevent mobile keyboard from showing
          textarea.setAttribute("readonly", "");
          textarea.style.position = "absolute";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();

          const successful = document.execCommand("copy");
          document.body.removeChild(textarea);

          if (!successful) throw new Error("Fallback: copy command was unsuccessful");
        } else {
          throw new Error("No clipboard available");
        }

        setCopiedId(id || "default");
        // reset copiedId after timeout
        if (timeout > 0) {
          window.setTimeout(() => setCopiedId(null), timeout);
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [timeout]
  );

  const isCopied = useCallback((id?: string) => {
    return copiedId === (id || "default");
  }, [copiedId]);

  return { copyToClipboard, isCopied, error, reset } as const;
}