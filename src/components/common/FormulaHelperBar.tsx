import React from 'react';

interface FormulaHelperBarProps {
  onInsert: (snippet: string) => void;
  className?: string;
}

const FORMULA_SNIPPETS = [
  { label: '$...$', snippet: '$x$', desc: 'Формула в тексте' },
  { label: 'a/b', snippet: '$\\frac{a}{b}$', desc: 'Обыкновенная дробь' },
  { label: '√x', snippet: '$\\sqrt{x}$', desc: 'Квадратный корень' },
  { label: 'x²', snippet: '$x^{2}$', desc: 'Верхний индекс / степень' },
  { label: 'x₁', snippet: '$x_{1}$', desc: 'Нижний индекс' },
  { label: 'log', snippet: '$\\log_{a}{b}$', desc: 'Логарифм' },
  { label: 'v⃗', snippet: '$\\vec{a}$', desc: 'Вектор' },
  { label: 'sin', snippet: '$\\sin(x)$', desc: 'Синус' },
  { label: 'cos', snippet: '$\\cos(x)$', desc: 'Косинус' },
  { label: '·', snippet: '$\\cdot$', desc: 'Умножение' },
  { label: '±', snippet: '$\\pm$', desc: 'Плюс-минус' },
  { label: '≠', snippet: '$\\ne$', desc: 'Не равно' },
  { label: '≤', snippet: '$\\le$', desc: 'Меньше или равно' },
  { label: '≥', snippet: '$\\ge$', desc: 'Больше или равно' },
  { label: 'π', snippet: '$\\pi$', desc: 'Число Пи' },
  { label: 'α', snippet: '$\\alpha$', desc: 'Альфа' },
  { label: 'Δ', snippet: '$\\Delta$', desc: 'Дельта' },
  { label: '∞', snippet: '$\\infty$', desc: 'Бесконечность' },
  { label: '∈', snippet: '$\\in$', desc: 'Принадлежит множеству' },
  { label: '∫', snippet: '$\\int_{a}^{b} f(x)\\,dx$', desc: 'Определенный интеграл' },
  { label: '∑', snippet: '$\\sum_{i=1}^{n} a_i$', desc: 'Сумма' },
  { label: '{система}', snippet: '$\\begin{cases} x + y = 5 \\\\ 2x - y = 1 \\end{cases}$', desc: 'Система уравнений' },
];

export const FormulaHelperBar: React.FC<FormulaHelperBarProps> = ({ onInsert, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F8F7F4] dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] text-[11px] font-mono ${className}`}>
      <span className="text-[10px] uppercase font-bold text-[#1B1B19]/50 dark:text-gray-400 mr-1 select-none">
        LaTeX:
      </span>
      {FORMULA_SNIPPETS.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onInsert(item.snippet)}
          title={item.desc}
          className="px-1.5 py-0.5 bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] border border-[#1B1B19]/30 dark:border-[#323642] text-[10px] font-bold transition cursor-pointer"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};
