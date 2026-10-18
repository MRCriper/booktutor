import React, { useMemo } from 'react';
import { renderLatex } from './MathRenderer';

interface FormulaViewProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
  label?: string;
}

export const FormulaView: React.FC<FormulaViewProps> = ({
  formula,
  displayMode = false,
  className = '',
  label,
}) => {
  const html = useMemo(() => {
    let clean = formula.trim();
    if (clean.startsWith('$$') && clean.endsWith('$$')) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('$') && clean.endsWith('$')) {
      clean = clean.slice(1, -1).trim();
    }
    return renderLatex(clean, displayMode);
  }, [formula, displayMode]);

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 bg-white text-[#1B1B19] border border-[#1B1B19] shadow-2xs max-w-full overflow-x-auto ${className}`}
    >
      {label && (
        <span className="label-academic text-[9px] select-none border-r border-[#1B1B19]/20 pr-2">
          {label}
        </span>
      )}
      <div
        className="font-mono text-xs sm:text-sm tracking-wide text-[#1B1B19]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};
