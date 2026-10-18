import React, { useState } from 'react';
import { X, Code2, BookOpen, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { AttachedFile } from '../../types';

interface CodeSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTaskTitle?: string;
  initialCode?: string;
  initialFiles?: AttachedFile[];
}

const DEFAULT_SAMPLE_FILES: AttachedFile[] = [
  {
    name: '24.txt',
    size: '1.4 КБ',
    content: 'ABBAABCDEFGHIKLMNOPAABBABBAABCFEDCBABCDAABBCCDDABBAABCCDEEFAABBAABBCCXXYYZZABBAABCFEDCBAABBAABCCDDABBAABCCDEEFAABBAABBCC',
  },
  {
    name: '17.txt',
    size: '0.9 КБ',
    content: '142\n289\n356\n412\n528\n615\n744\n850\n910\n1024\n1245\n1380\n1502\n1688\n1820\n1995\n2140\n2312\n2450\n2680',
  },
  {
    name: '26.txt',
    size: '0.7 КБ',
    content: '100 10\n15\n28\n34\n42\n50\n55\n62\n70\n85\n92',
  },
  {
    name: 'data.txt',
    size: '0.5 КБ',
    content: '15\n42\n88\n103\n256\n312\n415\n528\n630\n744\n850\n910\n1024',
  },
];

const PYTHON_TEMPLATES = [
  {
    name: 'Задание 24 (Строки из 24.txt)',
    lang: 'python' as const,
    code: `# КЕГЭ Информатика Задание 24: Обработка символьных строк из файла
# Файл 24.txt доступен во вкладке «Файлы» (можно читать напрямую через open)

with open("24.txt", "r", encoding="utf-8") as f:
    s = f.read().strip()

print(f"Всего символов в файле 24.txt: {len(s)}")

# Поиск максимальной длины цепочки без подстроки 'AB'
s_formatted = s.replace("AB", "A B")
segments = s_formatted.split()

max_len = max(len(seg) for seg in segments)
print(f"Ответ: максимальная длина подходящего фрагмента = {max_len}")
print("✓ Программа успешно выполнена на Python 3.10!")`,
  },
  {
    name: 'Задание 17 (Числовые пары из 17.txt)',
    lang: 'python' as const,
    code: `# КЕГЭ Задание 17: Обработка элементов числовой последовательности
with open("17.txt", "r", encoding="utf-8") as f:
    nums = [int(x) for x in f.read().split()]

print(f"Загружено чисел: {len(nums)}, диапазон: [{min(nums)}; {max(nums)}]")

# Найдем количество пар элементов, где хотя бы одно делится на 3
pairs_count = 0
max_sum = -float('inf')

for i in range(len(nums) - 1):
    a, b = nums[i], nums[i + 1]
    if a % 3 == 0 or b % 3 == 0:
        pairs_count += 1
        max_sum = max(max_sum, a + b)

print(f"Количество подходящих пар: {pairs_count}")
print(f"Максимальная сумма элементов в паре: {max_sum}")`,
  },
  {
    name: 'Задание 26 (Жадный выбор из 26.txt)',
    lang: 'python' as const,
    code: `# КЕГЭ Задание 26: Жадные алгоритмы и сортировка больших данных
with open("26.txt", "r", encoding="utf-8") as f:
    lines = f.read().splitlines()

s_capacity, n = map(int, lines[0].split())
files = sorted([int(x) for x in lines[1:]])

# Жадное добавление файлов наименьшего размера
stored = []
current_sum = 0

for file_size in files:
    if current_sum + file_size <= s_capacity:
        stored.append(file_size)
        current_sum += file_size
    else:
        break

count = len(stored)
print(f"Максимальное количество сохраненных файлов: {count}")

# Замена последнего файла на максимально возможный
remaining = s_capacity - (current_sum - stored[-1])
max_last_file = max(x for x in files if x <= remaining)
print(f"Размер максимального последнего файла: {max_last_file}")`,
  },
  {
    name: 'Задание 19–21 (Теория игр / Кучи)',
    lang: 'python' as const,
    code: `# КЕГЭ Задания 19–21: Теория игр (одна куча камней)
# Возможные ходы: +1, +2, *2. Победа при S >= 40

def moves(s):
    return [s + 1, s + 2, s * 2]

def game(s):
    # s: текущее количество камней
    if any(m >= 40 for m in moves(s)):
        return 'П1' # Петя побеждает за 1 ход
    if all(game(m) == 'П1' for m in moves(s)):
        return 'В1' # Ваня побеждает за 1 ход
    if any(game(m) == 'В1' for m in moves(s)):
        return 'П2' # Петя побеждает за 2 ход
    if all(game(m) in ('П1', 'П2') for m in moves(s)):
        return 'В2' # Ваня побеждает за 2 ход
    return None

results = { 'В1': [], 'П2': [], 'В2': [] }
for s in range(1, 40):
    res = game(s)
    if res in results:
        results[res].append(s)

print("№19 (В1):", results['В1'])
print("№20 (П2):", results['П2'])
print("№21 (В2):", results['В2'])`,
  },
  {
    name: 'Свободный код (Python 3.10)',
    lang: 'python' as const,
    code: `# BookTutor IDE: Python 3.10
import math
import itertools

print("Среда Python 3.10 готова к любым вычислениям!")

# Пример генерации перестановок (Задание 8 КЕГЭ)
words = set()
for p in itertools.permutations("МАТЕМ"):
    word = "".join(p)
    words.add(word)

print(f"Уникальных анаграмм слова 'МАТЕМ': {len(words)}")
print(f"НОД(144, 256) = {math.gcd(144, 256)}")`,
  },
];

export const CodeSandboxModal: React.FC<CodeSandboxModalProps> = ({
  isOpen,
  onClose,
  defaultTaskTitle,
  initialCode,
  initialFiles = [],
}) => {
  const [activeTemplateIdx, setActiveTemplateIdx] = useState<number>(() => (initialCode ? -1 : 0));

  if (!isOpen) return null;

  const isCustomMode = activeTemplateIdx === -1 && initialCode;
  const currentTpl = isCustomMode
    ? {
        name: defaultTaskTitle || 'Код текущей задачи',
        lang: 'python' as const,
        code: initialCode || '',
      }
    : PYTHON_TEMPLATES[activeTemplateIdx] || PYTHON_TEMPLATES[0];

  const filesForEditor =
    initialFiles.length > 0 ? initialFiles : DEFAULT_SAMPLE_FILES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] shadow-2xl flex flex-col max-h-[92vh] text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white dark:bg-[#1A1C24] border-b border-[#1B1B19] dark:border-[#323642]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] dark:bg-[#E5C048] inline-block shrink-0" />
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2">
                IDE Песочница Python
                <span className="font-mono text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Python 3.10 (КЕГЭ/ОГЭ)
                </span>
              </h3>
              <p className="font-mono text-[10px] text-[#1B1B19]/70 dark:text-gray-300 mt-0.5">
                {defaultTaskTitle ? `Задача: ${defaultTaskTitle}` : 'Локальное исполнение на сервере, чтение прикрепленных файлов (24.txt, 17.txt, 26.txt) и проверка алгоритмов'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white border border-[#1B1B19]/20 dark:border-[#323642] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates selector bar */}
        <div className="px-4 py-2 bg-[#F8F7F4] dark:bg-[#121316] border-b border-[#1B1B19]/15 dark:border-[#323642] flex items-center gap-2 overflow-x-auto font-mono text-[11px]">
          <span className="text-[#1B1B19]/70 dark:text-gray-300 shrink-0 flex items-center gap-1 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#E5C048]" /> Шаблоны:
          </span>

          {initialCode && (
            <button
              onClick={() => setActiveTemplateIdx(-1)}
              className={`px-2.5 py-1 border transition whitespace-nowrap cursor-pointer ${
                activeTemplateIdx === -1
                  ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] font-bold'
                  : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
              }`}
            >
              Код задачи
            </button>
          )}

          {PYTHON_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => setActiveTemplateIdx(i)}
              className={`px-2.5 py-1 border transition whitespace-nowrap cursor-pointer ${
                activeTemplateIdx === i
                  ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] font-bold'
                  : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
              }`}
            >
              {tpl.name}
            </button>
          ))}
        </div>

        {/* Editor Body */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto bg-[#F8F7F4] dark:bg-[#0E1015]">
          <CodeEditor
            key={`${currentTpl.name}-${activeTemplateIdx}`}
            initialCode={currentTpl.code}
            language="python"
            title={currentTpl.name}
            files={filesForEditor}
          />
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-2.5 bg-white dark:bg-[#1A1C24] border-t border-[#1B1B19] dark:border-[#323642] flex flex-wrap justify-between items-center gap-2 font-mono text-[11px] text-[#1B1B19]/70 dark:text-gray-300">
          <span className="hidden sm:inline">Файлы из вкладки «Файлы» открываются стандартно через open("24.txt")</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white dark:bg-[#121316] hover:bg-[#F8F7F4] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] font-bold uppercase transition cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
