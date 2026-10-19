import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Code2,
  Copy,
  Check,
  HelpCircle,
  FileCode,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, ExamVariant, Subject, VariantTask, Homework, User, StudyMaterial } from '../../types';
import { storage } from '../../services/storage';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: 'tasks' | 'variants' | 'homeworks' | 'materials' | 'all';
}

const SAMPLE_MATERIALS_TEMPLATE: Omit<StudyMaterial, 'id'>[] = [
  {
    title: 'Шпаргалка: Стереометрия и координатный метод (ЕГЭ №14)',
    subject: 'math',
    topic: 'Стереометрия и векторы',
    type: 'formula_pack',
    content: 'Координатный метод в правильной призме и пирамиде:\n1) Задайте декартову систему координат с началом в одной из вершин основания.\n2) Найдите координаты ключевых точек.\n3) Уравнение нормали к плоскости: n = (A, B, C).\n4) Формула расстояния: d = |Ax_0 + By_0 + Cz_0 + D| / sqrt(A^2 + B^2 + C^2).',
    keyFormulas: [
      'd = \\frac{|Ax_0 + By_0 + Cz_0 + D|}{\\sqrt{A^2 + B^2 + C^2}}',
      '\\cos \\varphi = \\frac{|a_1 a_2 + b_1 b_2 + c_1 c_2|}{\\sqrt{a_1^2 + b_1^2 + c_1^2}\\sqrt{a_2^2 + b_2^2 + c_2^2}}',
      'V = \\frac{1}{3} S_{осн} h'
    ],
    readTimeMinutes: 12,
    externalUrl: 'https://fipi.ru',
  },
  {
    title: 'Конспект: Законы геометрической и волновой оптики',
    subject: 'physics',
    topic: 'Оптика и линзы (№15-18 ЕГЭ)',
    type: 'lecture_notes',
    content: 'Закон преломления Снеллиуса: n1 * sin(alpha) = n2 * sin(beta).\nФормула тонкой линзы: 1/F = 1/d + 1/f (+ для собирающей, - для рассеивающей).\nОптическая сила линзы: D = 1/F (дптр).\nЛинейное увеличение: Gamma = f / d.',
    keyFormulas: [
      'n_1 \\sin \\alpha = n_2 \\sin \\beta',
      '\\pm \\frac{1}{F} = \\frac{1}{d} \\pm \\frac{1}{f}',
      'D = \\frac{1}{F}'
    ],
    readTimeMinutes: 10,
  },
  {
    title: 'Памятка: Динамическое программирование и префиксные суммы на Python',
    subject: 'cs',
    topic: 'КЕГЭ №27: Эффективная обработка последовательностей',
    type: 'code_sample',
    content: 'Поиск непрерывного отрезка с максимальной суммой, кратной K:\nmod_map = {0: 0}\ncur_sum = 0\nmax_len = 0\nfor i, x in enumerate(data, 1):\n    cur_sum += x\n    r = cur_sum % K\n    if r in mod_map:\n        max_len = max(max_len, i - mod_map[r])\n    else:\n        mod_map[r] = i',
    keyFormulas: [
      'O(N) \\text{ время}',
      'O(K) \\text{ память}',
      '\\text{lru\\_cache(None)}'
    ],
    readTimeMinutes: 15,
  },
];

const SAMPLE_TASKS_TEMPLATE: Omit<Task, 'id' | 'createdAt'>[] = [
  {
    subject: 'math',
    topic: 'Параметры и уравнения',
    examNumber: 'ЕГЭ №18',
    difficulty: 'hard',
    title: 'Система уравнений с параметром a',
    description: 'Найдите все значения a, при каждом из которых система имеет ровно 4 решения.',
    formula: '\\begin{cases} (x-a)^2 + y^2 = 9 \\\\ y = |x| - 2 \\end{cases}',
    correctAnswer: 'a in (-5; -1) U (1; 5)',
    fullSolution: 'Построим графики обоих уравнений. Первое уравнение задает семейство окружностей радиуса R=3 с центром (a, 0)...',
    hints: ['Рассмотрите геометрическую интерпретацию', 'Найдите точки касания с прямыми y = x - 2 и y = -x - 2'],
  },
  {
    subject: 'cs',
    topic: 'Обработка символьных строк из файла',
    examNumber: 'ЕГЭ №24',
    difficulty: 'medium',
    title: 'Максимальная длина цепочки символов без AB',
    description: 'Текстовый файл 24.txt содержит строку из символов A, B, C, D, E. Найдите максимальную длину подстроки, не содержащей сочетания "AB".',
    correctAnswer: '2450',
    fullSolution: 'with open("24.txt") as f:\n    s = f.read().strip()\ns = s.replace("AB", "A B")\nprint(max(len(w) for w in s.split()))',
    hints: ['Используйте replace("AB", "A B") и split()'],
  },
  {
    subject: 'physics',
    topic: 'Электромагнитная индукция',
    examNumber: 'ЕГЭ №13',
    difficulty: 'medium',
    title: 'Проводник в однородном магнитном поле',
    description: 'Прямолинейный проводник длиной 0.5 м движется со скоростью 4 м/с перпендикулярно линиям индукции магнитного поля B = 0.2 Тл. Найдите ЭДС индукции.',
    formula: '\\mathcal{E} = B \\cdot l \\cdot v',
    correctAnswer: '0.4',
    fullSolution: 'ЭДС индукции рассчитывается по закону Фарадея: E = B * l * v * sin(90°) = 0.2 * 0.5 * 4 = 0.4 В.',
    hints: ['Используйте формулу ЭДС индукции в движущемся проводнике'],
  },
];

const SAMPLE_VARIANT_TEMPLATE: Omit<ExamVariant, 'id' | 'createdAt'> = {
  title: 'Тренировочный вариант ЕГЭ 2026 №3 (Профиль)',
  subject: 'math',
  examType: 'ЕГЭ',
  timeLimitMinutes: 235,
  description: 'Комплексный вариант по спецификации ФИПИ 2026/2027 для 11 класса с полной разбалловкой.',
  maxPrimaryScore: 32,
  tasks: [
    {
      number: 1,
      title: 'Планиметрия: прямоугольный треугольник',
      topic: 'Планиметрия',
      description: 'В прямоугольном треугольнике гипотенуза равна 25, один из катетов равен 20. Найдите синус противоположного угла.',
      maxScore: 1,
      isPartTwo: false,
      correctAnswer: '0.8',
      solution: 'sin(A) = 20 / 25 = 0.8',
    },
    {
      number: 13,
      title: 'Тригонометрическое уравнение с отбором корней',
      topic: 'Уравнения',
      description: 'а) Решите уравнение 2cos^2(x) + 3sin(x) - 3 = 0.\nб) Найдите корни на отрезке [2pi; 7pi/2].',
      maxScore: 2,
      isPartTwo: true,
      criteria: '2 балла: обоснованно получены верные ответы в обоих пунктах. 1 балл: верный ответ в пункте а.',
      solution: '2(1 - sin^2 x) + 3sin x - 3 = 0. Корни: sin x = 1 или sin x = 0.5. Отбор корней на тригонометрическом круге: 5pi/2, 13pi/6, 17pi/6.',
    },
  ],
};

const SAMPLE_HOMEWORK_TEMPLATE = [
  {
    title: 'ДЗ: Параметры и системы уравнений (ЕГЭ №18)',
    subject: 'math' as const,
    studentName: 'Алексей Смирнов',
    studentEmail: 'alex@booktutor.ru',
    assignedDate: '2026-10-20',
    dueDate: '2026-10-27',
    status: 'assigned' as const,
    tutorFeedback: 'Обратить внимание на геометрический метод и раскрытие модулей',
    tasks: [
      {
        taskId: 'task-1',
        score: 4,
        tutorComment: 'Построить графики окружности и прямых',
      },
    ],
  },
  {
    title: 'ДЗ: Алгоритмы обработки строковых файлов (КЕГЭ №24)',
    subject: 'cs' as const,
    studentName: 'Мария Иванова',
    studentEmail: 'maria@booktutor.ru',
    assignedDate: '2026-10-21',
    dueDate: '2026-10-28',
    status: 'assigned' as const,
    tasks: [
      {
        taskId: 'task-2',
        score: 1,
        tutorComment: 'Написать программу на Python с обработкой файла 24.txt',
      },
    ],
  },
];

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'template'>('upload');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [parsedTasks, setParsedTasks] = useState<Task[]>([]);
  const [parsedVariants, setParsedVariants] = useState<ExamVariant[]>([]);
  const [parsedHomeworks, setParsedHomeworks] = useState<Homework[]>([]);
  const [parsedMaterials, setParsedMaterials] = useState<StudyMaterial[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [sampleType, setSampleType] = useState<'materials' | 'homeworks' | 'tasks' | 'variants' | 'universal'>(
    defaultMode === 'homeworks' ? 'homeworks' : defaultMode === 'materials' ? 'materials' : 'universal'
  );

  if (!isOpen) return null;

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTasksTemplate = () => {
    downloadFile(JSON.stringify(SAMPLE_TASKS_TEMPLATE, null, 2), 'tasks_template.json');
  };

  const handleDownloadVariantTemplate = () => {
    downloadFile(JSON.stringify(SAMPLE_VARIANT_TEMPLATE, null, 2), 'variant_template.json');
  };

  const handleDownloadHomeworkTemplate = () => {
    downloadFile(JSON.stringify(SAMPLE_HOMEWORK_TEMPLATE, null, 2), 'homework_template.json');
  };

  const handleDownloadMaterialsTemplate = () => {
    downloadFile(JSON.stringify({ materials: SAMPLE_MATERIALS_TEMPLATE }, null, 2), 'materials_template.json');
  };

  const handleDownloadUniversalTemplate = () => {
    const universal = {
      materials: SAMPLE_MATERIALS_TEMPLATE,
      homeworks: SAMPLE_HOMEWORK_TEMPLATE,
      tasks: SAMPLE_TASKS_TEMPLATE,
      variants: [SAMPLE_VARIANT_TEMPLATE],
    };
    downloadFile(JSON.stringify(universal, null, 2), 'universal_import_template.json');
  };

  const validateAndParse = (rawText: string) => {
    setParseError(null);
    setValidationWarnings([]);
    setParsedTasks([]);
    setParsedVariants([]);
    setParsedHomeworks([]);
    setParsedMaterials([]);

    const trimmed = rawText.trim();
    if (!trimmed) {
      setParseError('Текст или файл пуст. Пожалуйста, предоставьте валидный JSON.');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e: any) {
      setParseError(`Синтаксическая ошибка JSON: ${e.message}`);
      return;
    }

    const tasksToImport: Task[] = [];
    const variantsToImport: ExamVariant[] = [];
    const homeworksToImport: Homework[] = [];
    const materialsToImport: StudyMaterial[] = [];
    const warnings: string[] = [];

    // 1. Universal object { tasks?: [], variants?: [], homeworks?: [], materials?: [] }
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      (parsed.tasks || parsed.variants || parsed.homeworks || parsed.materials)
    ) {
      if (Array.isArray(parsed.materials)) {
        parsed.materials.forEach((item: any, idx: number) => {
          const res = sanitizeMaterial(item, idx, warnings);
          if (res) materialsToImport.push(res);
        });
      }
      if (Array.isArray(parsed.tasks)) {
        parsed.tasks.forEach((item: any, idx: number) => {
          const res = sanitizeTask(item, idx, warnings);
          if (res) tasksToImport.push(res);
        });
      }
      if (Array.isArray(parsed.variants)) {
        parsed.variants.forEach((item: any, idx: number) => {
          const res = sanitizeVariant(item, idx, warnings);
          if (res) variantsToImport.push(res);
        });
      }
      if (Array.isArray(parsed.homeworks)) {
        parsed.homeworks.forEach((item: any, idx: number) => {
          const resList = sanitizeHomeworkList(item, idx, warnings);
          homeworksToImport.push(...resList);
        });
      }
    }
    // 2. Direct Array
    else if (Array.isArray(parsed)) {
      parsed.forEach((item: any, idx: number) => {
        // Detect if Study Material item
        if (
          item.readTimeMinutes !== undefined ||
          item.keyFormulas ||
          item.type === 'cheat_sheet' ||
          item.type === 'formula_pack' ||
          item.type === 'lecture_notes' ||
          item.type === 'code_sample' ||
          (item.content && (item.topic || item.subject) && !item.correctAnswer && !item.dueDate)
        ) {
          const res = sanitizeMaterial(item, idx, warnings);
          if (res) materialsToImport.push(res);
        }
        // Detect if Homework item
        else if (
          item.dueDate ||
          item.assignedDate ||
          item['на какую дату'] ||
          item.deadline ||
          (item.studentName || item.studentEmail || item.studentId || item['кому'] || item.student)
        ) {
          const resList = sanitizeHomeworkList(item, idx, warnings);
          homeworksToImport.push(...resList);
        }
        // Detect if Variant item
        else if (item.tasks && Array.isArray(item.tasks) && (item.examType || item.timeLimitMinutes)) {
          const res = sanitizeVariant(item, idx, warnings);
          if (res) variantsToImport.push(res);
        }
        // Otherwise treat as Task
        else {
          const res = sanitizeTask(item, idx, warnings);
          if (res) tasksToImport.push(res);
        }
      });
    }
    // 3. Single Object
    else if (parsed && typeof parsed === 'object') {
      if (
        parsed.readTimeMinutes !== undefined ||
        parsed.keyFormulas ||
        parsed.type === 'cheat_sheet' ||
        parsed.type === 'formula_pack' ||
        parsed.type === 'lecture_notes' ||
        parsed.type === 'code_sample' ||
        (parsed.content && (parsed.topic || parsed.subject) && !parsed.correctAnswer && !parsed.dueDate)
      ) {
        const res = sanitizeMaterial(parsed, 0, warnings);
        if (res) materialsToImport.push(res);
      } else if (
        parsed.dueDate ||
        parsed.assignedDate ||
        parsed['на какую дату'] ||
        parsed.deadline ||
        parsed.studentName ||
        parsed.student ||
        parsed['кому']
      ) {
        const resList = sanitizeHomeworkList(parsed, 0, warnings);
        homeworksToImport.push(...resList);
      } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
        const res = sanitizeVariant(parsed, 0, warnings);
        if (res) variantsToImport.push(res);
      } else if (parsed.title && parsed.subject) {
        const res = sanitizeTask(parsed, 0, warnings);
        if (res) tasksToImport.push(res);
      } else {
        setParseError('Не удалось распознать формат JSON. Предоставьте конспекты, задания, вариант или домашнее задание.');
        return;
      }
    } else {
      setParseError('Не удалось распознать формат. Предоставьте массив объектов или пакет { materials, homeworks, tasks, variants }.');
      return;
    }

    if (
      tasksToImport.length === 0 &&
      variantsToImport.length === 0 &&
      homeworksToImport.length === 0 &&
      materialsToImport.length === 0
    ) {
      setParseError('Не найдено ни одного корректного элемента для импорта.');
      return;
    }

    setParsedTasks(tasksToImport);
    setParsedVariants(variantsToImport);
    setParsedHomeworks(homeworksToImport);
    setParsedMaterials(materialsToImport);
    setValidationWarnings(warnings);
  };

  const sanitizeMaterial = (raw: any, idx: number, warnings: string[]): StudyMaterial | null => {
    if (!raw || typeof raw !== 'object') {
      warnings.push(`Материал #${idx + 1} пропущен: не является объектом.`);
      return null;
    }

    const title = String(raw.title || raw.название || `Учебный конспект #${idx + 1}`);
    const validSubjects: Subject[] = ['math', 'physics', 'cs', 'russian'];
    const subjectRaw = raw.subject || raw.предмет;
    let subject: Subject = 'math';
    if (subjectRaw) {
      const lower = String(subjectRaw).toLowerCase();
      if (lower.includes('физ') || lower === 'physics') subject = 'physics';
      else if (lower.includes('инф') || lower === 'cs') subject = 'cs';
      else if (lower.includes('рус') || lower === 'russian') subject = 'russian';
      else if (lower.includes('мат') || lower === 'math') subject = 'math';
    }

    const validTypes = ['cheat_sheet', 'formula_pack', 'lecture_notes', 'code_sample'];
    let type: StudyMaterial['type'] = 'lecture_notes';
    if (validTypes.includes(raw.type)) {
      type = raw.type;
    } else if (raw.keyFormulas && Array.isArray(raw.keyFormulas) && raw.keyFormulas.length > 0) {
      type = 'formula_pack';
    }

    const keyFormulas: string[] = Array.isArray(raw.keyFormulas || raw.формулы)
      ? (raw.keyFormulas || raw.формулы).map(String)
      : [];

    return {
      id: raw.id || `imported-mat-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      subject,
      topic: String(raw.topic || raw.тема || 'Общая теория'),
      type,
      content: String(raw.content || raw.конспект || raw.текст || ''),
      keyFormulas,
      externalUrl: raw.externalUrl || raw.ссылка ? String(raw.externalUrl || raw.ссылка) : undefined,
      readTimeMinutes: typeof raw.readTimeMinutes === 'number' ? raw.readTimeMinutes : 10,
    };
  };

  const sanitizeTask = (raw: any, idx: number, warnings: string[]): Task | null => {
    if (!raw || typeof raw !== 'object') {
      warnings.push(`Задание #${idx + 1} пропущено: не является объектом.`);
      return null;
    }

    const title = String(raw.title || `Задание #${idx + 1}`);
    const validSubjects: Subject[] = ['math', 'physics', 'cs', 'russian'];
    const subject: Subject = validSubjects.includes(raw.subject) ? raw.subject : 'math';

    if (!validSubjects.includes(raw.subject)) {
      warnings.push(`Задание "${title}": предмет "${raw.subject}" неизвестен, установлен "math".`);
    }

    const validDifficulties = ['easy', 'medium', 'hard', 'olympiad'];
    const difficulty = validDifficulties.includes(raw.difficulty) ? raw.difficulty : 'medium';

    return {
      id: raw.id || `imported-task-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      subject,
      topic: raw.topic || 'Общая тема',
      examNumber: raw.examNumber,
      difficulty: difficulty as any,
      title,
      description: String(raw.description || ''),
      formula: raw.formula ? String(raw.formula) : undefined,
      correctAnswer: String(raw.correctAnswer ?? ''),
      fullSolution: String(raw.fullSolution || ''),
      hints: Array.isArray(raw.hints) ? raw.hints.map(String) : [],
      starterCode: raw.starterCode ? String(raw.starterCode) : undefined,
      createdAt: raw.createdAt || new Date().toISOString().split('T')[0],
    };
  };

  const sanitizeVariant = (raw: any, idx: number, warnings: string[]): ExamVariant | null => {
    if (!raw || typeof raw !== 'object') {
      warnings.push(`Вариант #${idx + 1} пропущен: не является объектом.`);
      return null;
    }

    const title = String(raw.title || `Импортированный вариант #${idx + 1}`);
    const validSubjects: Subject[] = ['math', 'physics', 'cs', 'russian'];
    const subject: Subject = validSubjects.includes(raw.subject) ? raw.subject : 'math';
    const examType = raw.examType === 'ОГЭ' ? 'ОГЭ' : 'ЕГЭ';

    const tasksList: VariantTask[] = Array.isArray(raw.tasks)
      ? raw.tasks.map((t: any, tIdx: number) => ({
          number: typeof t.number === 'number' ? t.number : tIdx + 1,
          title: String(t.title || `Задание ${tIdx + 1}`),
          topic: t.topic ? String(t.topic) : undefined,
          description: String(t.description || ''),
          formula: t.formula ? String(t.formula) : undefined,
          maxScore: typeof t.maxScore === 'number' ? t.maxScore : 1,
          isPartTwo: Boolean(t.isPartTwo),
          correctAnswer: t.correctAnswer !== undefined ? String(t.correctAnswer) : undefined,
          criteria: t.criteria ? String(t.criteria) : undefined,
          solution: t.solution ? String(t.solution) : undefined,
        }))
      : [];

    const maxPrimaryScore =
      typeof raw.maxPrimaryScore === 'number'
        ? raw.maxPrimaryScore
        : tasksList.reduce((acc, t) => acc + (t.maxScore || 1), 0);

    return {
      id: raw.id || `imported-variant-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      subject,
      examType,
      timeLimitMinutes: typeof raw.timeLimitMinutes === 'number' ? raw.timeLimitMinutes : 235,
      description: raw.description ? String(raw.description) : undefined,
      tasks: tasksList,
      maxPrimaryScore,
      createdAt: raw.createdAt || new Date().toISOString().split('T')[0],
    };
  };

  const sanitizeHomeworkList = (raw: any, idx: number, warnings: string[]): Homework[] => {
    if (!raw || typeof raw !== 'object') {
      warnings.push(`ДЗ #${idx + 1} пропущено: не является объектом.`);
      return [];
    }

    const students = storage.getStudents();
    const who = String(
      raw.studentName ||
      raw.student ||
      raw['кому'] ||
      raw.studentEmail ||
      raw.studentId ||
      raw.recipient ||
      ''
    ).trim();

    const isAll =
      who.toLowerCase() === 'все' ||
      who.toLowerCase() === 'всем' ||
      who.toLowerCase() === 'all' ||
      who.toLowerCase() === 'группа';

    // Normalize subject
    const rawSubj = String(raw.subject || raw['предмет'] || 'math').toLowerCase();
    let subject: Subject = 'math';
    if (rawSubj.includes('инф') || rawSubj === 'cs' || rawSubj.includes('комп')) {
      subject = 'cs';
    } else if (rawSubj.includes('физ') || rawSubj === 'physics') {
      subject = 'physics';
    } else if (rawSubj.includes('рус') || rawSubj === 'russian') {
      subject = 'russian';
    } else {
      subject = 'math';
    }

    // Normalize dates
    const parseDateStr = (d?: any): string => {
      if (!d) return '';
      const str = String(d).trim();
      if (str.includes('.')) {
        const parts = str.split('.');
        if (parts.length === 3) {
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return str;
    };

    let dueDate = parseDateStr(raw.dueDate || raw['на какую дату'] || raw.deadline || raw.date);
    if (!dueDate) {
      dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    }

    let assignedDate = parseDateStr(raw.assignedDate || raw['дата выдачи']);
    if (!assignedDate) {
      assignedDate = new Date().toISOString().split('T')[0];
    }

    let targetStudents: User[] = [];
    if (isAll) {
      targetStudents = students.length > 0 ? students : [{ id: 'student-1', name: 'Все ученики' } as User];
    } else if (who) {
      const matched = students.find(
        (s) =>
          s.id === who ||
          s.email.toLowerCase() === who.toLowerCase() ||
          s.name.toLowerCase().includes(who.toLowerCase())
      );
      if (matched) {
        targetStudents = [matched];
      } else {
        const defaultStudent = students[0] || ({ id: 'student-1', name: 'Ученик' } as User);
        warnings.push(
          `ДЗ #${idx + 1} ("${raw.title || 'ДЗ'}"): ученик "${who}" не найден среди зарегистрированных, привязано к "${defaultStudent.name}".`
        );
        targetStudents = [defaultStudent];
      }
    } else {
      const defaultStudent = students[0] || ({ id: 'student-1', name: 'Ученик' } as User);
      warnings.push(`ДЗ #${idx + 1}: получатель не указан, назначено на "${defaultStudent.name}".`);
      targetStudents = [defaultStudent];
    }

    const title = String(
      raw.title ||
      raw['название'] ||
      raw['тема'] ||
      `Домашнее задание (${subject === 'math' ? 'Математика' : subject === 'cs' ? 'Информатика' : subject === 'physics' ? 'Физика' : 'Русский язык'})`
    );

    const tutorFeedback = raw.tutorFeedback || raw.comment || raw['комментарий'] || raw.description || undefined;

    return targetStudents.map((st, subIdx) => ({
      id: raw.id
        ? `${raw.id}-${st.id}`
        : `imported-hw-${Date.now()}-${idx}-${subIdx}-${Math.random().toString(36).slice(2, 6)}`,
      studentId: st.id,
      subject,
      title,
      assignedDate,
      dueDate,
      status: raw.status === 'graded' || raw.status === 'submitted' ? raw.status : 'assigned',
      tasks: Array.isArray(raw.tasks)
        ? raw.tasks.map((t: any, tIdx: number) => ({
            taskId: String(t.taskId || t.id || `task-${tIdx + 1}`),
            studentAnswer: t.studentAnswer ? String(t.studentAnswer) : undefined,
            studentCode: t.studentCode ? String(t.studentCode) : undefined,
            tutorComment: t.tutorComment || t.comment || undefined,
            score: typeof t.score === 'number' ? t.score : undefined,
            maxScore: typeof t.maxScore === 'number' ? t.maxScore : undefined,
          }))
        : [],
      tutorFeedback: tutorFeedback ? String(tutorFeedback) : undefined,
      grade: typeof raw.grade === 'number' ? raw.grade : undefined,
      mark: [5, 4, 3, 2].includes(Number(raw.mark || raw.grade))
        ? (Number(raw.mark || raw.grade) as 5 | 4 | 3 | 2)
        : undefined,
      studentComment: raw.studentComment || raw.comment || raw.notes || undefined,
      submittedAt: raw.submittedAt || (raw.status === 'submitted' ? new Date().toISOString() : undefined),
      photos: Array.isArray(raw.photos) ? raw.photos : undefined,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      validateAndParse(content);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    setFileName(null);
    if (val.trim()) {
      validateAndParse(val);
    } else {
      setParsedTasks([]);
      setParsedVariants([]);
      setParsedHomeworks([]);
      setParsedMaterials([]);
      setParseError(null);
      setValidationWarnings([]);
    }
  };

  const handleExecuteImport = () => {
    if (
      parsedTasks.length === 0 &&
      parsedVariants.length === 0 &&
      parsedHomeworks.length === 0 &&
      parsedMaterials.length === 0
    ) {
      return;
    }

    if (parsedMaterials.length > 0) {
      storage.batchAddStudyMaterials(parsedMaterials);
    }
    if (parsedTasks.length > 0) {
      storage.batchAddTasks(parsedTasks);
    }
    if (parsedVariants.length > 0) {
      storage.batchAddExamVariants(parsedVariants);
    }
    if (parsedHomeworks.length > 0) {
      storage.batchAddHomeworks(parsedHomeworks);
    }

    confetti({ particleCount: 60, spread: 70 });
    onSuccess?.();
    onClose();
  };

  const handleCopySample = () => {
    let sampleData: any;
    if (sampleType === 'materials') {
      sampleData = { materials: SAMPLE_MATERIALS_TEMPLATE };
    } else if (sampleType === 'homeworks') {
      sampleData = { homeworks: SAMPLE_HOMEWORK_TEMPLATE };
    } else if (sampleType === 'tasks') {
      sampleData = { tasks: SAMPLE_TASKS_TEMPLATE };
    } else if (sampleType === 'variants') {
      sampleData = { variants: [SAMPLE_VARIANT_TEMPLATE] };
    } else {
      sampleData = {
        materials: SAMPLE_MATERIALS_TEMPLATE,
        homeworks: SAMPLE_HOMEWORK_TEMPLATE,
        tasks: SAMPLE_TASKS_TEMPLATE.slice(0, 1),
        variants: [SAMPLE_VARIANT_TEMPLATE],
      };
    }
    navigator.clipboard.writeText(JSON.stringify(sampleData, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const totalImportCount =
    parsedTasks.length + parsedVariants.length + parsedHomeworks.length + parsedMaterials.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] shadow-2xl flex flex-col max-h-[90vh] text-left"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white dark:bg-[#1A1C24] border-b border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] dark:bg-[#E5C048] inline-block shrink-0" />
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2">
                Пакетный импорт заданий, вариантов и ДЗ
                <span className="text-[11px] font-mono text-[#D4AF37] dark:text-[#E5C048] border border-[#D4AF37]/30 dark:border-[#E5C048]/30 px-2 py-0.5">
                  JSON формат
                </span>
              </h3>
              <p className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">
                Загружайте пачками авторские задания, полные варианты КИМ и индивидуальные домашние задания
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white border border-[#1B1B19]/20 dark:border-[#323642] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Bar */}
        <div className="px-5 py-2.5 bg-[#F8F7F4] dark:bg-[#121316] border-b border-[#1B1B19]/15 dark:border-[#323642] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#1B1B19]/70 dark:text-gray-300">
            <Download className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#E5C048]" />
            <span className="font-bold">Шаблоны файлов для заполнения:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTasksTemplate}
              className="px-2.5 py-1 bg-white dark:bg-[#1A1C24] hover:bg-[#1B1B19] hover:text-white dark:hover:bg-[#E5C048] dark:hover:text-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <FileCode className="w-3 h-3 text-[#D4AF37]" />
              Задания (.json)
            </button>
            <button
              onClick={handleDownloadVariantTemplate}
              className="px-2.5 py-1 bg-white dark:bg-[#1A1C24] hover:bg-[#1B1B19] hover:text-white dark:hover:bg-[#E5C048] dark:hover:text-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3 h-3 text-blue-500" />
              Вариант (.json)
            </button>
            <button
              onClick={handleDownloadHomeworkTemplate}
              className="px-2.5 py-1 bg-white dark:bg-[#1A1C24] hover:bg-[#1B1B19] hover:text-white dark:hover:bg-[#E5C048] dark:hover:text-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-emerald-500" />
              Домашние задания (.json)
            </button>
            <button
              onClick={handleDownloadUniversalTemplate}
              className="px-2.5 py-1 bg-white dark:bg-[#1A1C24] hover:bg-[#1B1B19] hover:text-white dark:hover:bg-[#E5C048] dark:hover:text-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3 h-3 text-purple-500" />
              Все в одном (.json)
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 pt-3 border-b border-[#1B1B19]/15 dark:border-[#323642] flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-[#1B1B19] dark:border-[#E5C048] text-[#1B1B19] dark:text-[#F3F3EE]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Загрузить файл
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-[#1B1B19] dark:border-[#E5C048] text-[#1B1B19] dark:text-[#F3F3EE]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> Вставить текст JSON
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'template'
                ? 'border-[#1B1B19] dark:border-[#E5C048] text-[#1B1B19] dark:text-[#F3F3EE]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Схема и документация
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19] dark:hover:border-[#E5C048] p-8 text-center flex flex-col items-center justify-center gap-3 bg-[#F8F7F4]/50 dark:bg-[#121316]/50 cursor-pointer transition">
                <Upload className="w-8 h-8 text-[#D4AF37] dark:text-[#E5C048]" />
                <div className="space-y-1">
                  <span className="font-serif text-base font-bold text-[#1B1B19] dark:text-[#F3F3EE] block">
                    Выберите файл .json с заданиями, вариантами или ДЗ
                  </span>
                  <span className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400 block">
                    Или перетащите файл сюда. Поддерживается кодировка UTF-8.
                  </span>
                </div>
                {fileName && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Загружен: {fileName}
                  </div>
                )}
                <input
                  type="file"
                  accept=".json,.txt,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#1B1B19]/70 dark:text-gray-300">
                <span>Вставьте JSON-структуру (массив объектов заданий, вариантов или ДЗ):</span>
                {jsonText && (
                  <button
                    onClick={() => {
                      setJsonText('');
                      setParsedTasks([]);
                      setParsedVariants([]);
                      setParsedHomeworks([]);
                    }}
                    className="text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Очистить
                  </button>
                )}
              </div>
              <textarea
                value={jsonText}
                onChange={handleTextChange}
                placeholder={`{\n  "homeworks": [\n    {\n      "title": "ДЗ: Производная (№8, 12)",\n      "subject": "math",\n      "studentName": "Алексей Смирнов",\n      "dueDate": "2026-10-25"\n    }\n  ]\n}`}
                rows={12}
                className="w-full font-mono text-xs p-3 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] focus:outline-none focus:border-[#1B1B19] dark:focus:border-[#E5C048] resize-none"
              />
            </div>
          )}

          {activeTab === 'template' && (
            <div className="space-y-4 text-xs font-mono leading-relaxed">
              {/* Type Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/15 dark:border-[#323642]">
                <button
                  type="button"
                  onClick={() => setSampleType('materials')}
                  className={`px-3 py-1.5 transition font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
                    sampleType === 'materials'
                      ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]'
                      : 'text-[#1B1B19]/70 dark:text-gray-300 hover:text-[#1B1B19]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Теория и Конспекты
                </button>
                <button
                  type="button"
                  onClick={() => setSampleType('homeworks')}
                  className={`px-3 py-1.5 transition font-bold text-xs cursor-pointer ${
                    sampleType === 'homeworks'
                      ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]'
                      : 'text-[#1B1B19]/70 dark:text-gray-300 hover:text-[#1B1B19]'
                  }`}
                >
                  Домашние задания (ДЗ)
                </button>
                <button
                  type="button"
                  onClick={() => setSampleType('tasks')}
                  className={`px-3 py-1.5 transition font-bold text-xs cursor-pointer ${
                    sampleType === 'tasks'
                      ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]'
                      : 'text-[#1B1B19]/70 dark:text-gray-300 hover:text-[#1B1B19]'
                  }`}
                >
                  Задачи в банк
                </button>
                <button
                  type="button"
                  onClick={() => setSampleType('variants')}
                  className={`px-3 py-1.5 transition font-bold text-xs cursor-pointer ${
                    sampleType === 'variants'
                      ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]'
                      : 'text-[#1B1B19]/70 dark:text-gray-300 hover:text-[#1B1B19]'
                  }`}
                >
                  Экзаменационный вариант
                </button>
                <button
                  type="button"
                  onClick={() => setSampleType('universal')}
                  className={`px-3 py-1.5 transition font-bold text-xs cursor-pointer ${
                    sampleType === 'universal'
                      ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]'
                      : 'text-[#1B1B19]/70 dark:text-gray-300 hover:text-[#1B1B19]'
                  }`}
                >
                  Универсальный пакет
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2">
                <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                  {sampleType === 'materials'
                    ? 'Шаблон JSON для теории и конспектов (шпаргалки, формулы):'
                    : sampleType === 'homeworks'
                    ? 'Шаблон JSON для домашних заданий:'
                    : sampleType === 'tasks'
                    ? 'Шаблон JSON для банка задач:'
                    : sampleType === 'variants'
                    ? 'Шаблон JSON для экзаменационного варианта:'
                    : 'Универсальный JSON (Теория + ДЗ + Задачи + Вариант):'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (sampleType === 'materials') handleDownloadMaterialsTemplate();
                      else if (sampleType === 'homeworks') handleDownloadHomeworkTemplate();
                      else if (sampleType === 'tasks') handleDownloadTasksTemplate();
                      else if (sampleType === 'variants') handleDownloadVariantTemplate();
                      else handleDownloadUniversalTemplate();
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-[#202430] border border-[#1B1B19]/30 dark:border-[#383C4A] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1 font-bold cursor-pointer text-[11px]"
                    title="Скачать файл шаблона .json"
                  >
                    <Download className="w-3 h-3 text-[#D4AF37]" /> Скачать .json
                  </button>
                  <button
                    onClick={handleCopySample}
                    className="px-2.5 py-1 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] flex items-center gap-1 font-bold cursor-pointer text-[11px]"
                  >
                    {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {isCopied ? 'Скопировано!' : 'Копировать'}
                  </button>
                </div>
              </div>

              <pre className="p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/15 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] overflow-x-auto max-h-60 text-[11px]">
{JSON.stringify(
  sampleType === 'materials'
    ? { materials: SAMPLE_MATERIALS_TEMPLATE }
    : sampleType === 'homeworks'
    ? { homeworks: SAMPLE_HOMEWORK_TEMPLATE }
    : sampleType === 'tasks'
    ? { tasks: SAMPLE_TASKS_TEMPLATE }
    : sampleType === 'variants'
    ? { variants: [SAMPLE_VARIANT_TEMPLATE] }
    : {
        materials: SAMPLE_MATERIALS_TEMPLATE.slice(0, 1),
        homeworks: SAMPLE_HOMEWORK_TEMPLATE,
        tasks: SAMPLE_TASKS_TEMPLATE.slice(0, 1),
        variants: [SAMPLE_VARIANT_TEMPLATE],
      },
  null,
  2
)}
              </pre>

              {sampleType === 'materials' ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-600/30 text-amber-900 dark:text-amber-200 text-xs font-sans space-y-1.5">
                  <strong>Параметры структуры теории (конспектов):</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li><code>title</code> (или <code>название</code>) — заголовок конспекта или шпаргалки</li>
                    <li><code>subject</code> (или <code>предмет</code>) — <code>'math'</code> | <code>'physics'</code> | <code>'cs'</code> | <code>'russian'</code></li>
                    <li><code>topic</code> (или <code>тема</code>) — тема КИМ (например: <em>«Стереометрия и координаты»</em>)</li>
                    <li><code>type</code> — тип материала: <code>'formula_pack'</code> (пакет формул), <code>'lecture_notes'</code> (конспект), <code>'cheat_sheet'</code> (шпаргалка), <code>'code_sample'</code> (пример кода)</li>
                    <li><code>content</code> (или <code>текст</code> / <code>конспект</code>) — подробный текст с объяснением правил, алгоритмов и теорем</li>
                    <li><code>keyFormulas</code> (опционально) — массив ключевых формул в формате LaTeX (например: <code>{"['d = \\\\frac{|Ax_0+By_0+Cz_0+D|}{\\\\sqrt{A^2+B^2+C^2}}']"}</code>)</li>
                    <li><code>readTimeMinutes</code> (опционально) — примерное время чтения в минутах (по умолчанию 10)</li>
                    <li><code>externalUrl</code> (опционально) — ссылка на методичку, ФИПИ или персональную доску Miro</li>
                  </ul>
                </div>
              ) : sampleType === 'homeworks' ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-600/30 text-amber-900 dark:text-amber-200 text-xs font-sans space-y-1.5">
                  <strong>Параметры структуры домашнего задания (ДЗ):</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li><code>title</code> (или <code>название</code>) — заголовок домашней работы</li>
                    <li><code>studentName</code> (или <code>кому</code> / <code>studentEmail</code>) — имя ученика (например, <em>"Алексей Смирнов"</em>), либо <em>"все"</em> для назначения всей группе</li>
                    <li><code>subject</code> (или <code>предмет</code>) — <code>'math'</code> | <code>'physics'</code> | <code>'cs'</code> | <code>'russian'</code> (также распознаются <em>"математика"</em>, <em>"информатика"</em>, <em>"физика"</em>, <em>"русский"</em>)</li>
                    <li><code>dueDate</code> (или <code>на какую дату</code> / <code>дедлайн</code>) — срок сдачи (ГГГГ-ММ-ДД или ДД.ММ.ГГГГ, например <em>"2026-10-28"</em> или <em>"28.10.2026"</em>)</li>
                    <li><code>tutorFeedback</code> (или <code>комментарий</code>) — методические указания или напутствие преподавателя</li>
                    <li><code>tasks</code> (опционально) — массив прикрепленных номеров задач или объектов <code>{'[{"taskId": "task-1", "score": 2, "tutorComment": "Решить аналитически"}]'}</code></li>
                  </ul>
                </div>
              ) : sampleType === 'tasks' ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-600/30 text-amber-900 dark:text-amber-200 text-xs font-sans space-y-1">
                  <strong>Параметры для банка задач:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li><code>title</code> — краткое название задания</li>
                    <li><code>subject</code> — предмет ('math' | 'physics' | 'cs' | 'russian')</li>
                    <li><code>examNumber</code> — привязка к КИМ (например, "ЕГЭ №18", "ОГЭ №21")</li>
                    <li><code>formula</code> — формула в формате LaTeX</li>
                    <li><code>correctAnswer</code> — правильный краткий ответ</li>
                    <li><code>fullSolution</code> — подробное методическое решение</li>
                    <li><code>hints</code> — массив подсказок для ученика</li>
                  </ul>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-600/30 text-amber-900 dark:text-amber-200 text-xs font-sans space-y-1">
                  <strong>Универсальный пакет:</strong>
                  <p>Поддерживает одновременную пакетную загрузку теории и конспектов (<code>materials</code>), заданий в банк (<code>tasks</code>), готовых вариантов КИМ (<code>variants</code>) и персональных домашних работ (<code>homeworks</code>).</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-600 dark:border-rose-700 text-rose-900 dark:text-rose-200 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Ошибка валидации JSON:</strong>
                <p className="mt-0.5 font-sans">{parseError}</p>
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-600/30 text-amber-900 dark:text-amber-200 text-xs font-mono space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Предупреждения валидатора ({validationWarnings.length}):
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-24 overflow-y-auto">
                {validationWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Section */}
          {(parsedTasks.length > 0 ||
            parsedVariants.length > 0 ||
            parsedHomeworks.length > 0 ||
            parsedMaterials.length > 0) && (
            <div className="space-y-3 pt-2 border-t border-[#1B1B19]/15 dark:border-[#323642]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] dark:text-[#E5C048]" />
                  <span className="font-serif text-sm font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                    Предпросмотр данных для импорта
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  {parsedMaterials.length > 0 && (
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/30 font-bold">
                      Конспектов: {parsedMaterials.length}
                    </span>
                  )}
                  {parsedHomeworks.length > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                      ДЗ: {parsedHomeworks.length}
                    </span>
                  )}
                  {parsedTasks.length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 dark:text-[#E5C048] border border-amber-500/30 font-bold">
                      Заданий: {parsedTasks.length}
                    </span>
                  )}
                  {parsedVariants.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/30 font-bold">
                      Вариантов: {parsedVariants.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Parsed Materials List */}
              {parsedMaterials.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-[#1B1B19]/15 dark:border-[#323642] p-2 bg-[#F8F7F4]/60 dark:bg-[#121316]/60">
                  <div className="text-[10px] font-mono text-purple-900 dark:text-purple-300 uppercase font-bold px-1 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Теория и конспекты ({parsedMaterials.length}):
                  </div>
                  {parsedMaterials.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/10 dark:border-[#323642] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-purple-700 text-white font-bold shrink-0">
                          {m.subject.toUpperCase()}
                        </span>
                        <span className="font-serif font-semibold text-[#1B1B19] dark:text-[#F3F3EE] truncate">
                          {m.title}
                        </span>
                        <span className="text-[11px] font-mono text-[#1B1B19]/60 dark:text-gray-400 shrink-0">
                          ({m.topic})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                        {m.keyFormulas && m.keyFormulas.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                            ∑ {m.keyFormulas.length} формул
                          </span>
                        )}
                        <span className="text-[#1B1B19]/60 dark:text-gray-400">
                          {m.readTimeMinutes} мин
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Parsed Homeworks List */}
              {parsedHomeworks.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-[#1B1B19]/15 dark:border-[#323642] p-2 bg-[#F8F7F4]/60 dark:bg-[#121316]/60">
                  <div className="text-[10px] font-mono text-[#1B1B19]/60 dark:text-gray-400 uppercase font-bold px-1 mb-1">
                    Домашние задания ({parsedHomeworks.length}):
                  </div>
                  {parsedHomeworks.map((h, idx) => {
                    const studentObj = storage.getStudents().find((s) => s.id === h.studentId);
                    return (
                      <div
                        key={idx}
                        className="p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/10 dark:border-[#323642] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-emerald-600 text-white font-bold shrink-0">
                            ДЗ
                          </span>
                          <span className="font-serif font-semibold text-[#1B1B19] dark:text-[#F3F3EE] truncate">
                            {h.title}
                          </span>
                          <span className="text-[11px] font-mono text-[#1B1B19]/60 dark:text-gray-400 shrink-0">
                            (Кому: {studentObj?.name || h.studentId})
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-amber-700 dark:text-[#E5C048] shrink-0 font-bold">
                          Срок: {h.dueDate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Parsed Tasks List */}
              {parsedTasks.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-[#1B1B19]/15 dark:border-[#323642] p-2 bg-[#F8F7F4]/60 dark:bg-[#121316]/60">
                  <div className="text-[10px] font-mono text-[#1B1B19]/60 dark:text-gray-400 uppercase font-bold px-1 mb-1">
                    Задания ({parsedTasks.length}):
                  </div>
                  {parsedTasks.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/10 dark:border-[#323642] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#1B1B19] text-white dark:bg-[#E5C048] dark:text-[#121316] font-bold shrink-0">
                          {t.examNumber || `#${idx + 1}`}
                        </span>
                        <span className="font-serif font-semibold text-[#1B1B19] dark:text-[#F3F3EE] truncate">
                          {t.title}
                        </span>
                        <span className="text-[11px] font-mono text-[#1B1B19]/50 dark:text-gray-400 shrink-0">
                          ({t.subject})
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 shrink-0 font-bold">
                        Ответ: {t.correctAnswer}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Parsed Variants List */}
              {parsedVariants.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-[#1B1B19]/15 dark:border-[#323642] p-2 bg-[#F8F7F4]/60 dark:bg-[#121316]/60">
                  <div className="text-[10px] font-mono text-[#1B1B19]/60 dark:text-gray-400 uppercase font-bold px-1 mb-1">
                    Варианты ({parsedVariants.length}):
                  </div>
                  {parsedVariants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/10 dark:border-[#323642] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-blue-600 text-white font-bold shrink-0">
                          {v.examType}
                        </span>
                        <span className="font-serif font-semibold text-[#1B1B19] dark:text-[#F3F3EE] truncate">
                          {v.title}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[#1B1B19]/60 dark:text-gray-400 shrink-0">
                        {v.tasks.length} заданий • макс. {v.maxPrimaryScore} б.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F8F7F4] dark:bg-[#1A1C24] border-t border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="text-[#1B1B19]/60 dark:text-gray-400">
            {totalImportCount > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                ✓ Готово к импорту: {totalImportCount} элементов
              </span>
            ) : (
              <span>Выберите файл или вставьте JSON для проверки</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] font-bold uppercase tracking-wider hover:bg-[#F8F7F4] cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={totalImportCount === 0}
              className={`px-5 py-2 font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-2xs ${
                totalImportCount > 0
                  ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] hover:bg-black cursor-pointer'
                  : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Импортировать в систему ({totalImportCount})
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
