import React, { useState, useMemo } from 'react';
import {
  Calculator,
  X,
  RotateCcw,
  Copy,
  Check,
  History,
  BookOpen,
  ArrowRight,
  Divide,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface ScientificCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertValue?: (val: string) => void;
}

interface ConstantItem {
  symbol: string;
  name: string;
  value: number;
  unit: string;
}

const CONSTANTS: ConstantItem[] = [
  { symbol: 'g', name: 'Ускорение свободного падения (ЕГЭ/ОГЭ)', value: 10, unit: 'м/с²' },
  { symbol: 'g_точное', name: 'Точное стандартное ускорение', value: 9.80665, unit: 'м/с²' },
  { symbol: 'c', name: 'Скорость света в вакууме', value: 3e8, unit: 'м/с' },
  { symbol: 'G', name: 'Гравитационная постоянная', value: 6.67e-11, unit: 'Н·м²/кг²' },
  { symbol: 'h', name: 'Постоянная Планка', value: 6.63e-34, unit: 'Дж·с' },
  { symbol: 'k_B', name: 'Постоянная Больцмана', value: 1.38e-23, unit: 'Дж/К' },
  { symbol: 'e', name: 'Элементарный заряд', value: 1.6e-19, unit: 'Кл' },
  { symbol: 'm_e', name: 'Масса электрона', value: 9.11e-31, unit: 'кг' },
  { symbol: 'm_p', name: 'Масса протона', value: 1.67e-27, unit: 'кг' },
  { symbol: 'N_A', name: 'Постоянная Авогадро', value: 6.02e23, unit: 'моль⁻¹' },
  { symbol: 'R', name: 'Универсальная газовая постоянная', value: 8.31, unit: 'Дж/(моль·К)' },
  { symbol: 'ε_0', name: 'Электрическая постоянная', value: 8.85e-12, unit: 'Ф/м' },
  { symbol: 'k_кулон', name: 'Коэффициент закона Кулона (1/4πε₀)', value: 9e9, unit: 'Н·м²/Кл²' },
  { symbol: 'σ', name: 'Постоянная Стефана-Больцмана', value: 5.67e-8, unit: 'Вт/(м²·К⁴)' },
  { symbol: 'c_воды', name: 'Удельная теплоёмкость воды', value: 4200, unit: 'Дж/(кг·К)' },
  { symbol: 'λ_льда', name: 'Удельная теплота плавления льда', value: 3.3e5, unit: 'Дж/кг' },
  { symbol: 'L_пара', name: 'Удельная теплота парообразования', value: 2.3e6, unit: 'Дж/кг' },
];

const PHYSICS_PRESETS = [
  { name: 'Кинетическая энергия: E = m*v²/2', template: '((m * v^2) / 2)' },
  { name: 'Закон тяготения Ньютона: F = G*m1*m2/r²', template: '((6.67e-11 * m1 * m2) / (r^2))' },
  { name: 'Закон Кулона: F = k*q1*q2/r²', template: '((9e9 * q1 * q2) / (r^2))' },
  { name: 'Период маятника: T = 2π√(L/g)', template: '2 * π * sqrt((L / 10))' },
  { name: 'Период пружинного маятника: T = 2π√(m/k)', template: '2 * π * sqrt((m / k))' },
  { name: 'ЭДС индукции: E = B*v*L*sin(α)', template: 'B * v * L * sin(90)' },
  { name: 'КПД тепловой машины: η = (T1 - T2)/T1', template: '((T1 - T2) / T1) * 100' },
  { name: 'Формула Томсона: T = 2π√(L*C)', template: '2 * π * sqrt(L * C)' },
  { name: 'Закон Ома для полной цепи: I = E/(R+r)', template: '((E) / (R + r))' },
  { name: 'Давление жидкости: p = ρ*g*h', template: '1000 * 10 * h' },
];

// Convert decimal to simplified fraction (e.g. 0.75 -> 3/4)
function toFractionString(val: number): string | null {
  if (isNaN(val) || !isFinite(val) || Math.abs(val) > 1e6 || Math.abs(val) < 1e-4) return null;
  const tolerance = 1.0e-6;
  let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
  let b = val;
  do {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;
    b = 1 / (b - a);
  } while (Math.abs(val - h1 / k1) > val * tolerance && k1 < 10000);

  if (k1 === 1) return null; // already an integer
  if (k1 > 10000) return null;
  return `${h1}/${k1}`;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  isOpen,
  onClose,
  onInsertValue,
}) => {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [history, setHistory] = useState<{ expr: string; res: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showConstants, setShowConstants] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showFractionBuilder, setShowFractionBuilder] = useState(false);
  const [fracNum, setFracNum] = useState('');
  const [fracDen, setFracDen] = useState('');
  const [copied, setCopied] = useState(false);

  // Convert raw formula expression to LaTeX for live 2-story fraction preview
  const liveKatexPreview = useMemo(() => {
    if (!expr.trim()) return '';
    try {
      let latex = expr
        .replace(/×/g, ' \\cdot ')
        .replace(/\*/g, ' \\cdot ')
        .replace(/÷/g, ' / ')
        .replace(/π/g, '\\pi ')
        .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
        .replace(/cbrt\(([^)]+)\)/g, '\\sqrt[3]{$1}');

      // Convert ((num)/(den)) or (num)/(den) into \frac{num}{den}
      latex = latex.replace(/\(\(([^\/]+)\)\s*\/\s*\(([^\/]+)\)\)/g, '\\frac{$1}{$2}');
      latex = latex.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
      latex = latex.replace(/\(([^()]+)\)\s*\/\s*([0-9a-zA-Z_]+)/g, '\\frac{$1}{$2}');
      latex = latex.replace(/([0-9a-zA-Z_]+)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');

      return latex;
    } catch {
      return expr;
    }
  }, [expr]);

  const fractionResult = useMemo(() => {
    if (!result) return null;
    const num = parseFloat(result);
    return toFractionString(num);
  }, [result]);

  if (!isOpen) return null;

  const evaluateExpression = (input: string): string => {
    if (!input.trim()) return '';

    let parsed = input
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\^/g, '**');

    // Handle DEG vs RAD in trig
    if (angleMode === 'DEG') {
      parsed = parsed.replace(/sin\(([^)]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
      parsed = parsed.replace(/cos\(([^)]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
      parsed = parsed.replace(/tan\(([^)]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
      parsed = parsed.replace(/asin\(([^)]+)\)/g, '(Math.asin($1) * 180 / Math.PI)');
      parsed = parsed.replace(/acos\(([^)]+)\)/g, '(Math.acos($1) * 180 / Math.PI)');
      parsed = parsed.replace(/atan\(([^)]+)\)/g, '(Math.atan($1) * 180 / Math.PI)');
    } else {
      parsed = parsed.replace(/sin\(/g, 'Math.sin(');
      parsed = parsed.replace(/cos\(/g, 'Math.cos(');
      parsed = parsed.replace(/tan\(/g, 'Math.tan(');
      parsed = parsed.replace(/asin\(/g, 'Math.asin(');
      parsed = parsed.replace(/acos\(/g, 'Math.acos(');
      parsed = parsed.replace(/atan\(/g, 'Math.atan(');
    }

    parsed = parsed
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/cbrt\(/g, 'Math.cbrt(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/abs\(/g, 'Math.abs(');

    // Safe execution check
    if (/[^0-9+\-*/().,MathPIEasincoqrtblg **e\-]/i.test(parsed)) {
      throw new Error('Недопустимый символ в выражении');
    }

    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${parsed});`);
    const val = fn();

    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error('Не число (NaN)');
    }
    if (!isFinite(val)) {
      throw new Error('Бесконечность (деление на ноль)');
    }

    if (Math.abs(val) >= 1e10 || (Math.abs(val) < 1e-4 && val !== 0)) {
      return val.toExponential(6);
    }
    return parseFloat(val.toFixed(8)).toString();
  };

  const handleCalculate = () => {
    try {
      setError(null);
      const res = evaluateExpression(expr);
      setResult(res);
      if (res && expr.trim()) {
        setHistory((prev) => [{ expr, res }, ...prev.slice(0, 19)]);
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка в формуле');
      setResult('');
    }
  };

  const append = (txt: string) => {
    setExpr((prev) => prev + txt);
    setError(null);
  };

  const insertFractionTemplate = () => {
    // Inserts compound fraction template with brackets: ((чиcлитель)/(знаменатель))
    append('(( ) / ( ))');
  };

  const handleApplyFractionBuilder = () => {
    if (!fracNum.trim() || !fracDen.trim()) return;
    append(`((${fracNum.trim()}) / (${fracDen.trim()}))`);
    setFracNum('');
    setFracDen('');
    setShowFractionBuilder(false);
  };

  const handleClear = () => {
    setExpr('');
    setResult('');
    setError(null);
  };

  const handleBackspace = () => {
    setExpr((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleCopyResult = () => {
    const textToCopy = result || expr;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] shadow-2xl flex flex-col max-h-[94vh] text-xs font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F8F7F4] dark:bg-[#1A1C24] border-b border-[#1B1B19] dark:border-[#323642]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block" />
            <h3 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1.5">
              Научный калькулятор физика <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">(Дроби / Wolfram)</span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setAngleMode(angleMode === 'DEG' ? 'RAD' : 'DEG')}
              className="px-2 py-1 border border-[#1B1B19] dark:border-[#323642] bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] text-[10px] font-bold uppercase transition"
              title="Переключить градусы / радианы"
            >
              {angleMode}
            </button>
            <button
              onClick={() => {
                setShowPresets(!showPresets);
                setShowConstants(false);
                setShowHistory(false);
                setShowFractionBuilder(false);
              }}
              className={`px-2 py-1 border text-[10px] font-bold uppercase transition ${
                showPresets
                  ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316]'
                  : 'bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19] dark:border-[#323642]'
              }`}
            >
              Формулы
            </button>
            <button
              onClick={() => {
                setShowConstants(!showConstants);
                setShowPresets(false);
                setShowHistory(false);
                setShowFractionBuilder(false);
              }}
              className={`px-2 py-1 border text-[10px] font-bold uppercase transition ${
                showConstants
                  ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316]'
                  : 'bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19] dark:border-[#323642]'
              }`}
            >
              Константы
            </button>
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                setShowConstants(false);
                setShowPresets(false);
                setShowFractionBuilder(false);
              }}
              className={`px-2 py-1 border text-[10px] font-bold uppercase transition ${
                showHistory
                  ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316]'
                  : 'bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19] dark:border-[#323642]'
              }`}
            >
              <History className="w-3 h-3 inline mr-1" /> История
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-[#F8F7F4] dark:bg-[#121316] border-b border-[#1B1B19] dark:border-[#323642] flex flex-col gap-2">
          {/* Top visual 2-story fraction preview */}
          {liveKatexPreview && (
            <div className="p-2.5 bg-white/70 dark:bg-[#1A1C24]/80 border border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between overflow-x-auto min-h-[42px]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] shrink-0">Вид формулы:</span>
                <span className="text-sm text-[#1B1B19] dark:text-[#F3F3EE]">
                  <MathRenderer content={`$${liveKatexPreview}$`} />
                </span>
              </div>
              <span className="text-[10px] text-[#1B1B19]/40 dark:text-gray-500 font-mono">LaTeX / KaTeX</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#1B1B19]/50 dark:text-gray-400">
            <span>Ввод сложного составного выражения</span>
            {error && <span className="text-rose-600 dark:text-rose-400 font-bold">{error}</span>}
          </div>

          <div className="relative">
            <input
              type="text"
              value={expr}
              onChange={(e) => {
                setExpr(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCalculate();
              }}
              placeholder="Пример: ((6.67e-11 * 5.97e24 * 70) / (6.37e6)^2)"
              className="w-full text-base sm:text-lg bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] p-3 border border-[#1B1B19] dark:border-[#323642] focus:outline-none focus:border-[#D4AF37] font-mono shadow-inner"
            />
          </div>

          {/* Result bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1B1B19]/60 dark:text-gray-400">=</span>
              {fractionResult && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#D4AF37]/20 border border-[#D4AF37] text-[#1B1B19] dark:text-[#E5C048]">
                  Дробь: {fractionResult}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-[#1B1B19] dark:text-[#E5C048]">
                {result || '0'}
              </span>
              {result && (
                <button
                  onClick={handleCopyResult}
                  className="p-1.5 bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-[#1B1B19] hover:text-white transition cursor-pointer"
                  title="Скопировать ответ"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
              {result && onInsertValue && (
                <button
                  onClick={() => {
                    onInsertValue(result);
                    onClose();
                  }}
                  className="px-2 py-1 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  Вставить <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fraction Builder Overlay */}
        {showFractionBuilder && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border-b border-[#1B1B19] dark:border-[#323642] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1.5">
                <Divide className="w-4 h-4 text-[#D4AF37]" /> Конструктор двухэтажной дроби:
              </span>
              <button
                onClick={() => setShowFractionBuilder(false)}
                className="text-xs text-gray-500 hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                  Числитель (верх):
                </label>
                <input
                  type="text"
                  value={fracNum}
                  onChange={(e) => setFracNum(e.target.value)}
                  placeholder="Например: 6.67e-11 * 5.97e24"
                  className="w-full p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/30 dark:border-[#323642] text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                  Знаменатель (низ):
                </label>
                <input
                  type="text"
                  value={fracDen}
                  onChange={(e) => setFracDen(e.target.value)}
                  placeholder="Например: (6.37e6)^2"
                  className="w-full p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/30 dark:border-[#323642] text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFractionBuilder(false)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-xs"
              >
                Отмена
              </button>
              <button
                onClick={handleApplyFractionBuilder}
                className="px-3.5 py-1.5 bg-[#1B1B19] text-white dark:bg-[#E5C048] dark:text-black font-bold text-xs uppercase"
              >
                Вставить дробь в формулу
              </button>
            </div>
          </div>
        )}

        {/* Physics Formula Presets Overlay */}
        {showPresets && (
          <div className="p-3 bg-white dark:bg-[#16181F] border-b border-[#1B1B19] dark:border-[#323642] max-h-48 overflow-y-auto space-y-1.5">
            <div className="label-academic mb-1">Готовые формулы КИМ (с шаблонами дробей):</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {PHYSICS_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    append(p.template);
                    setShowPresets(false);
                  }}
                  className="p-2 bg-[#F8F7F4] dark:bg-[#1A1C24] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] border border-[#1B1B19]/20 dark:border-[#323642] text-left transition text-[11px]"
                >
                  <div className="font-bold truncate">{p.name}</div>
                  <div className="text-[10px] opacity-70 truncate font-mono mt-0.5">{p.template}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Constants Overlay */}
        {showConstants && (
          <div className="p-3 bg-white dark:bg-[#16181F] border-b border-[#1B1B19] dark:border-[#323642] max-h-48 overflow-y-auto space-y-1.5">
            <div className="label-academic mb-1">Справочник физических величин:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {CONSTANTS.map((c) => (
                <button
                  key={c.symbol}
                  onClick={() => {
                    append(c.value.toString());
                    setShowConstants(false);
                  }}
                  className="p-1.5 bg-[#F8F7F4] dark:bg-[#1A1C24] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] border border-[#1B1B19]/30 dark:border-[#323642] text-left transition flex items-center justify-between group"
                >
                  <div className="truncate">
                    <span className="font-bold text-[#D4AF37] mr-1.5">{c.symbol}</span>
                    <span className="text-[10px] opacity-75">{c.name}</span>
                  </div>
                  <span className="font-bold text-[10px] ml-2 shrink-0">{c.value.toExponential(2)} {c.unit}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History Drawer */}
        {showHistory && (
          <div className="p-3 bg-white dark:bg-[#16181F] border-b border-[#1B1B19] dark:border-[#323642] max-h-48 overflow-y-auto space-y-1.5">
            <div className="label-academic mb-1">История вычислений:</div>
            {history.length === 0 ? (
              <div className="text-center py-4 text-gray-500">История пуста</div>
            ) : (
              history.map((h, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setExpr(h.res);
                    setShowHistory(false);
                  }}
                  className="p-1.5 bg-[#F8F7F4] dark:bg-[#1A1C24] hover:border-[#1B1B19] border border-transparent cursor-pointer flex justify-between items-center text-xs"
                >
                  <span className="text-gray-600 dark:text-gray-400 truncate">{h.expr}</span>
                  <span className="font-bold text-[#1B1B19] dark:text-[#E5C048] shrink-0 ml-3">{h.res}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Keypad Grid */}
        <div className="p-4 grid grid-cols-6 gap-1.5 sm:gap-2 bg-white dark:bg-[#16181F]">
          {/* Row 1: Fractions & composite operators */}
          <button
            onClick={() => setShowFractionBuilder(true)}
            className="p-2 border border-[#1B1B19] dark:border-[#E5C048] bg-amber-50 dark:bg-amber-950/30 text-[#1B1B19] dark:text-[#E5C048] font-bold text-xs uppercase hover:bg-amber-100 transition"
            title="Конструктор дробей с числителем и знаменателем"
          >
            a/b Дробь
          </button>
          <button onClick={() => append('(( ) / ( ))')} className="p-2 border border-[#1B1B19]/30 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#1A1C24] font-bold text-xs hover:border-[#1B1B19]">
            (□)/(□)
          </button>
          <button onClick={() => append('sin(')} className="calc-btn-fn">sin</button>
          <button onClick={() => append('cos(')} className="calc-btn-fn">cos</button>
          <button onClick={() => append('tan(')} className="calc-btn-fn">tan</button>
          <button onClick={() => append('^')} className="calc-btn-fn font-bold">xʸ</button>

          {/* Row 2: Roots, powers, scientific notation */}
          <button onClick={() => append('*10^')} className="p-2 border border-[#1B1B19]/30 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#1A1C24] font-bold text-xs hover:border-[#1B1B19] text-[#D4AF37]">
            ×10ⁿ
          </button>
          <button onClick={() => append('^2')} className="calc-btn-fn">x²</button>
          <button onClick={() => append('sqrt(')} className="calc-btn-fn">√x</button>
          <button onClick={() => append('cbrt(')} className="calc-btn-fn">³√x</button>
          <button onClick={() => append('(')} className="calc-btn-fn">(</button>
          <button onClick={() => append(')')} className="calc-btn-fn">)</button>

          {/* Row 3: Numbers & operators */}
          <button onClick={() => append('ln(')} className="calc-btn-fn">ln</button>
          <button onClick={() => append('7')} className="calc-btn-num">7</button>
          <button onClick={() => append('8')} className="calc-btn-num">8</button>
          <button onClick={() => append('9')} className="calc-btn-num">9</button>
          <button onClick={() => append('÷')} className="calc-btn-op">÷</button>
          <button onClick={handleBackspace} className="calc-btn-ctrl">⌫</button>

          {/* Row 4 */}
          <button onClick={() => append('log(')} className="calc-btn-fn">lg</button>
          <button onClick={() => append('4')} className="calc-btn-num">4</button>
          <button onClick={() => append('5')} className="calc-btn-num">5</button>
          <button onClick={() => append('6')} className="calc-btn-num">6</button>
          <button onClick={() => append('×')} className="calc-btn-op">×</button>
          <button onClick={handleClear} className="calc-btn-ctrl text-rose-600 dark:text-rose-400 font-bold">C</button>

          {/* Row 5 */}
          <button onClick={() => append('π')} className="calc-btn-fn">π</button>
          <button onClick={() => append('1')} className="calc-btn-num">1</button>
          <button onClick={() => append('2')} className="calc-btn-num">2</button>
          <button onClick={() => append('3')} className="calc-btn-num">3</button>
          <button onClick={() => append('-')} className="calc-btn-op">−</button>
          <button onClick={() => append('e')} className="calc-btn-fn">e</button>

          {/* Row 6 */}
          <button onClick={() => append('e-')} className="calc-btn-fn font-bold">10⁻ⁿ</button>
          <button onClick={() => append('0')} className="calc-btn-num">0</button>
          <button onClick={() => append('.')} className="calc-btn-num">.</button>
          <button onClick={() => append('+')} className="calc-btn-op">+</button>
          <button
            onClick={handleCalculate}
            className="col-span-2 p-2 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold text-base hover:opacity-90 transition cursor-pointer border border-[#1B1B19] dark:border-[#E5C048]"
          >
            = Вычислить
          </button>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#F8F7F4] dark:bg-[#1A1C24] border-t border-[#1B1B19] dark:border-[#323642] flex justify-between items-center text-[10px] text-[#1B1B19]/60 dark:text-gray-400">
          <span>Режим: {angleMode} • Дроби: a/b, (A)/(B) • Степени: ×10ⁿ, ^</span>
          <span>Wolfram Physics Engine BookTutor</span>
        </div>
      </div>
    </div>
  );
};
