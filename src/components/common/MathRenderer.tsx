import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Safely renders LaTeX math using KaTeX with rich fallback.
 */
export function renderLatex(rawLatex: string, displayMode = false): string {
  try {
    return katex.renderToString(rawLatex.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
    });
  } catch {
    // Elegant fallback if KaTeX fails
    const clean = rawLatex
      .replace(/\\sqrt{([^}]+)}/g, '√($1)')
      .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)')
      .replace(/\\varepsilon_i/g, 'ℰᵢ')
      .replace(/\\Phi/g, 'Φ')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\nu/g, 'ν')
      .replace(/\\alpha/g, 'α')
      .replace(/\\varphi/g, 'φ')
      .replace(/\\pi/g, 'π')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\pm/g, '±')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\cdot/g, '·')
      .replace(/\\vec{([A-Za-z0-9_]+)}/g, '$1⃗')
      .replace(/\\text{([^}]+)}/g, '$1');
    return `<span class="font-mono text-[#1B1B19] font-bold">${clean}</span>`;
  }
}

/**
 * MathRenderer parses and renders rich text containing LaTeX and academic markdown
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    const trimmed = content.trim();
    if (
      trimmed.startsWith('\\sqrt') ||
      trimmed.startsWith('\\frac') ||
      trimmed.startsWith('\\cos') ||
      trimmed.startsWith('\\sin') ||
      trimmed.startsWith('\\int') ||
      trimmed.startsWith('\\sum')
    ) {
      const html = renderLatex(trimmed, !inline);
      return (
        <div
          className={`overflow-x-auto py-1 text-[#1B1B19] ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    const lines = content.split('\n');

    return (
      <div className={`space-y-2 text-[#1B1B19] ${className}`}>
        {lines.map((line, lineIdx) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            return <div key={lineIdx} className="h-1.5" />;
          }

          // Block formula: $$...$$ or \[...\]
          const blockMatch = trimmedLine.match(/^\$\$(.+?)\$\$$/) || trimmedLine.match(/^\\\[(.+?)\\\]$/);
          if (blockMatch) {
            const html = renderLatex(blockMatch[1], true);
            return (
              <div
                key={lineIdx}
                className="my-3 p-3 bg-white border border-[#1B1B19] overflow-x-auto text-center shadow-2xs text-[#1B1B19]"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          if (
            trimmedLine.startsWith('\\sqrt') ||
            trimmedLine.startsWith('\\frac') ||
            trimmedLine.startsWith('\\varepsilon') ||
            trimmedLine.startsWith('\\Phi') ||
            trimmedLine.startsWith('\\cos') ||
            trimmedLine.startsWith('\\sin')
          ) {
            const html = renderLatex(trimmedLine, true);
            return (
              <div
                key={lineIdx}
                className="my-3 p-3 bg-white border border-[#1B1B19] overflow-x-auto text-center shadow-2xs text-[#1B1B19]"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          const isBullet = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ');
          const isNumbered = /^\d+\.\s/.test(trimmedLine);
          const tokens = parseInlineText(line);

          if (isBullet || isNumbered) {
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-1 leading-relaxed">
                <span className="text-[#D4AF37] select-none font-mono text-xs mt-0.5 shrink-0 font-bold">
                  {isBullet ? '■' : trimmedLine.match(/^\d+\./)?.[0]}
                </span>
                <div className="flex-1 text-[#1B1B19]">
                  {tokens.map((tok, tIdx) => renderToken(tok, tIdx))}
                </div>
              </div>
            );
          }

          return (
            <p key={lineIdx} className="leading-relaxed text-[#1B1B19]">
              {tokens.map((tok, tIdx) => renderToken(tok, tIdx))}
            </p>
          );
        })}
      </div>
    );
  }, [content, className, inline]);

  return <>{renderedElements}</>;
};

type TextToken =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string }
  | { type: 'code'; value: string }
  | { type: 'bold'; value: string };

function parseInlineText(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let remaining = text;

  const regex = /(\$([^\$]+)\$|`([^`]+)`|\*\*([^\*]+)\*\*)/;

  while (remaining.length > 0) {
    const match = remaining.match(regex);
    if (!match || match.index === undefined) {
      tokens.push({ type: 'text', value: remaining });
      break;
    }

    if (match.index > 0) {
      tokens.push({ type: 'text', value: remaining.substring(0, match.index) });
    }

    const fullMatch = match[0];
    if (fullMatch.startsWith('$') && fullMatch.endsWith('$')) {
      tokens.push({ type: 'math', value: match[2] });
    } else if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
      tokens.push({ type: 'code', value: match[3] });
    } else if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
      tokens.push({ type: 'bold', value: match[4] });
    }

    remaining = remaining.substring(match.index + fullMatch.length);
  }

  return tokens;
}

function renderToken(token: TextToken, key: number) {
  if (token.type === 'math') {
    const html = renderLatex(token.value, false);
    return (
      <span
        key={key}
        className="inline-block px-1 mx-0.5 bg-white text-[#1B1B19] align-baseline border border-[#1B1B19]/30 font-mono text-[12px] shadow-2xs"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (token.type === 'code') {
    return (
      <code
        key={key}
        className="px-1.5 py-0.5 bg-[#F0EEE9] border border-[#1B1B19]/25 text-[#1B1B19] font-mono text-[11px]"
      >
        {token.value}
      </code>
    );
  }

  if (token.type === 'bold') {
    return (
      <strong key={key} className="font-bold text-[#1B1B19]">
        {token.value}
      </strong>
    );
  }

  return <span key={key}>{token.value}</span>;
}
