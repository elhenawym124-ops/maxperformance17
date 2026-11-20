import React, { useMemo } from "react";

interface MarketingMarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

type Alignment = "left" | "center" | "right";

interface TableBlock {
  type: "table";
  headers: string[];
  alignments: Alignment[];
  rows: string[][];
}

interface CodeBlock {
  type: "code";
  code: string;
  language?: string;
}

interface HeadingBlock {
  type: "heading";
  level: number;
  text: string;
}

interface ListBlock {
  type: "list";
  items: string[];
  ordered: boolean;
}

interface QuoteBlock {
  type: "quote";
  text: string;
}

interface DividerBlock {
  type: "divider";
}

interface ParagraphBlock {
  type: "paragraph";
  text: string;
}

type MarkdownBlock =
  | TableBlock
  | CodeBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | DividerBlock
  | ParagraphBlock;

// Decision / Status Badge Configurations
const CHIP_MAP: Record<string, { icon: string; classes: string }> = {
  SCALE: { icon: "🚀", classes: "bg-emerald-100 text-success dark:bg-success/80 dark:text-success border-success dark:border-success font-bold" },
  مضاعفة: { icon: "🚀", classes: "bg-emerald-100 text-success dark:bg-success/80 dark:text-success border-success dark:border-success font-bold" },
  "زيادة الميزانية": { icon: "🚀", classes: "bg-emerald-100 text-success dark:bg-success/80 dark:text-success border-success dark:border-success font-bold" },
  KILL: { icon: "🛑", classes: "bg-rose-100 text-destructive dark:bg-destructive/80 dark:text-destructive border-destructive dark:border-destructive font-bold" },
  إيقاف: { icon: "🛑", classes: "bg-rose-100 text-destructive dark:bg-destructive/80 dark:text-destructive border-destructive dark:border-destructive font-bold" },
  حذف: { icon: "🛑", classes: "bg-rose-100 text-destructive dark:bg-destructive/80 dark:text-destructive border-destructive dark:border-destructive font-bold" },
  WATCH: { icon: "👀", classes: "bg-amber-100 text-warning dark:bg-warning/80 dark:text-warning border-warning dark:border-warning font-bold" },
  مراقبة: { icon: "👀", classes: "bg-amber-100 text-warning dark:bg-warning/80 dark:text-warning border-warning dark:border-warning font-bold" },
  FIX_CREATIVE: { icon: "🎨", classes: "bg-indigo-100 text-primary dark:bg-primary/80 dark:text-primary border-primary dark:border-primary font-bold" },
  "تعديل كريتيف": { icon: "🎨", classes: "bg-indigo-100 text-primary dark:bg-primary/80 dark:text-primary border-primary dark:border-primary font-bold" },
  "تعديل المحتوى": { icon: "🎨", classes: "bg-indigo-100 text-primary dark:bg-primary/80 dark:text-primary border-primary dark:border-primary font-bold" },
  LEARNING: { icon: "📚", classes: "bg-sky-100 text-info dark:bg-info/80 dark:text-info border-info dark:border-info font-semibold" },
  "مرحلة التعلم": { icon: "📚", classes: "bg-sky-100 text-info dark:bg-info/80 dark:text-info border-info dark:border-info font-semibold" },
  تعلم: { icon: "📚", classes: "bg-sky-100 text-info dark:bg-info/80 dark:text-info border-info dark:border-info font-semibold" },
  PAUSED: { icon: "⏸️", classes: "bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground border-border dark:border-border font-medium" },
  متوقف: { icon: "⏸️", classes: "bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground border-border dark:border-border font-medium" },
};

function splitTableRow(rowStr: string): string[] {
  let cleaned = rowStr.trim();
  if (cleaned.startsWith("|")) cleaned = cleaned.slice(1);
  if (cleaned.endsWith("|")) cleaned = cleaned.slice(0, -1);
  return cleaned.split("|").map((c) => c.trim());
}

function parseAlignment(cell: string): Alignment {
  const t = cell.trim();
  if (t.startsWith(":") && t.endsWith(":")) return "center";
  if (t.endsWith(":")) return "left";
  return "right";
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function renderInline(text: string, isUser?: boolean): React.ReactNode {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={key}
          className={`px-1.5 py-0.5 mx-0.5 rounded font-mono text-[10px] ${
            isUser
              ? "bg-blue-700/80 text-white"
              : "bg-slate-200 dark:bg-muted text-primary dark:text-primary"
          }`}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong
          key={key}
          className={
            isUser ? "font-extrabold text-white" : "font-bold text-foreground dark:text-white"
          }
        >
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

function renderTableCellContent(cell: string): React.ReactNode {
  const trimmed = cell.trim();
  const upper = trimmed.toUpperCase();

  const chip = CHIP_MAP[upper] || CHIP_MAP[trimmed];
  if (chip) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border shadow-2xs ${chip.classes}`}>
        <span>{chip.icon}</span>
        <span>{trimmed}</span>
      </span>
    );
  }

  if (upper === "ACTIVE" || trimmed === "نشط") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-success/10 text-success dark:bg-success/60 dark:text-success border border-success dark:border-success">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        <span>{trimmed}</span>
      </span>
    );
  }

  if (trimmed.includes("⚠️")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-warning/10 text-warning dark:bg-warning/80 dark:text-warning border border-warning dark:border-warning">
        {trimmed}
      </span>
    );
  }

  return renderInline(cell);
}

export const MarketingMarkdownMessage: React.FC<MarketingMarkdownMessageProps> = ({
  content,
  isUser,
}) => {
  const blocks = useMemo(() => {
    if (!content) return [];
    const lines = content.split(/\r?\n/);
    const parsed: MarkdownBlock[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Code block ```
      if (trimmed.startsWith("```")) {
        const lang = trimmed.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        parsed.push({ type: "code", code: codeLines.join("\n"), language: lang });
        i++;
        continue;
      }

      // 2. Table detection
      if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headers = splitTableRow(line);
        const sepCells = splitTableRow(lines[i + 1]);
        const alignments = sepCells.map(parseAlignment);
        const rows: string[][] = [];

        i += 2;
        while (i < lines.length && lines[i].includes("|") && lines[i].trim().length > 0) {
          if (!isTableSeparator(lines[i])) {
            rows.push(splitTableRow(lines[i]));
          }
          i++;
        }
        parsed.push({ type: "table", headers, alignments, rows });
        continue;
      }

      // 3. Headings
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        parsed.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] });
        i++;
        continue;
      }

      // 4. Horizontal Rule
      if (/^(---|---|\*\*\*)\s*$/.test(trimmed)) {
        parsed.push({ type: "divider" });
        i++;
        continue;
      }

      // 5. Blockquote
      if (trimmed.startsWith("> ")) {
        parsed.push({ type: "quote", text: trimmed.slice(2) });
        i++;
        continue;
      }

      // 6. Lists
      const listMatch = line.match(/^(\s*)([-*•]|\d+\.)\s+(.+)$/);
      if (listMatch) {
        const isOrdered = /^\d+\./.test(listMatch[2]);
        const items: string[] = [listMatch[3]];
        i++;
        while (i < lines.length) {
          const nextMatch = lines[i].match(/^(\s*)([-*•]|\d+\.)\s+(.+)$/);
          if (nextMatch) {
            items.push(nextMatch[3]);
            i++;
          } else {
            break;
          }
        }
        parsed.push({ type: "list", items, ordered: isOrdered });
        continue;
      }

      // 7. Paragraph
      parsed.push({ type: "paragraph", text: trimmed.length > 0 ? line : "" });
      i++;
    }

    return parsed;
  }, [content]);

  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  return (
    <div className="space-y-2 text-xs leading-relaxed max-w-full overflow-hidden">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "table":
            return (
              <div
                key={idx}
                className="my-3 overflow-x-auto rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-xs max-w-full"
              >
                <table className="w-full text-right border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100/90 dark:bg-muted text-foreground dark:text-muted-foreground font-bold border-b border-border dark:border-border">
                      {block.headers.map((hdr, hIdx) => (
                        <th
                          key={hIdx}
                          className={`px-3 py-2 text-${block.alignments[hIdx] || "right"} whitespace-nowrap font-semibold tracking-wider`}
                        >
                          {renderInline(hdr)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-border">
                    {block.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="even:bg-slate-50/60 dark:even:bg-slate-800/30 hover:bg-primary/50 dark:hover:bg-muted transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-3 py-2 text-${block.alignments[cIdx] || "right"} whitespace-nowrap text-foreground dark:text-muted-foreground`}
                          >
                            {renderTableCellContent(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "heading": {
            if (block.level === 1) {
              return (
                <h3 key={idx} className="text-sm font-black text-foreground dark:text-white pt-2 pb-1 border-b border-border dark:border-border flex items-center gap-1.5">
                  {renderInline(block.text)}
                </h3>
              );
            }
            if (block.level === 2) {
              return (
                <h4 key={idx} className="text-xs font-bold text-primary dark:text-primary pt-1.5 pb-0.5">
                  {renderInline(block.text)}
                </h4>
              );
            }
            return (
              <h5 key={idx} className="text-[11px] font-bold text-foreground dark:text-muted-foreground pt-1">
                {renderInline(block.text)}
              </h5>
            );
          }

          case "list": {
            const ListTag = block.ordered ? "ol" : "ul";
            return (
              <ListTag
                key={idx}
                className={`space-y-1 my-1.5 pe-4 text-foreground dark:text-muted-foreground ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-snug">
                    {renderInline(item)}
                  </li>
                ))}
              </ListTag>
            );
          }

          case "quote":
            return (
              <blockquote key={idx} className="border-r-2 border-primary pe-3 py-1 my-1.5 bg-primary/40 dark:bg-primary/30 rounded-l text-foreground dark:text-muted-foreground italic">
                {renderInline(block.text)}
              </blockquote>
            );

          case "divider":
            return <hr key={idx} className="my-2 border-border dark:border-border" />;

          case "code":
            return (
              <pre key={idx} className="p-2.5 rounded-xl bg-muted text-muted-foreground font-mono text-[10px] overflow-x-auto my-2 border border-border">
                <code>{block.code}</code>
              </pre>
            );

          case "paragraph":
          default:
            return block.text === "" ? (
              <div key={idx} className="h-1" />
            ) : (
              <p key={idx} className="text-slate-800 dark:text-muted-foreground">
                {renderInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
};
