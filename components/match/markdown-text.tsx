/**
 * MarkdownText
 * Formatea texto plano con sintaxis markdown básica:
 * - **negrita**
 * - *cursiva*
 * - listas con - o •
 * - listas numeradas 1. 2. 3.
 * - párrafos separados por línea en blanco
 */

interface MarkdownTextProps {
  content: string | null | undefined;
  className?: string;
}

export const MarkdownText = ({
  content,
  className = "",
}: MarkdownTextProps) => {
  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Block =
  | { type: "paragraph"; text: string }
  | { type: "bullet-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

// ─── Parser de bloques ────────────────────────────────────────────────────────

function parseBlocks(raw: string): Block[] {
  const lines = raw.split("\n");
  const blocks: Block[] = [];
  let currentList: {
    type: "bullet-list" | "ordered-list";
    items: string[];
  } | null = null;
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraphLines = [];
  };

  const flushList = () => {
    if (currentList) {
      blocks.push({ ...currentList });
      currentList = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Línea vacía → cierra bloque actual
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    // Lista con viñeta: - item  o  • item
    const bulletMatch = line.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "bullet-list") {
        flushList();
        currentList = { type: "bullet-list", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Lista numerada: 1. item
    const orderedMatch = line.match(/^\d+[.)]\s+(.+)/);
    if (orderedMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ordered-list") {
        flushList();
        currentList = { type: "ordered-list", items: [] };
      }
      currentList.items.push(orderedMatch[1]);
      continue;
    }

    // Línea de texto normal
    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

// ─── Renderer de bloques ──────────────────────────────────────────────────────

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={key} className="text-foreground text-[15px] leading-relaxed">
          {renderInline(block.text)}
        </p>
      );

    case "bullet-list":
      return (
        <ul key={key} className="flex flex-col gap-1.5 pl-1">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground"
            >
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );

    case "ordered-list":
      return (
        <ol key={key} className="flex flex-col gap-1.5 pl-1">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-[15px] leading-relaxed text-foreground"
            >
              <span className="mt-0.5 text-xs font-bold text-muted-foreground tabular-nums flex-shrink-0 w-4 text-right">
                {i + 1}.
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
  }
}

// ─── Renderer inline (negritas, cursivas) ─────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  // Tokeniza **bold**, *italic*, ***bold+italic***
  const parts = text.split(/(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("***") && part.endsWith("***")) {
      return (
        <strong key={i} className="font-bold italic">
          {part.slice(3, -3)}
        </strong>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
