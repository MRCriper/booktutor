import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  FileText,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Code2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExamVariant, Subject, User, VariantTask, AttachedFile } from '../../types';
import { storage } from '../../services/storage';
import { MathRenderer } from '../common/MathRenderer';
import { FormulaHelperBar } from '../common/FormulaHelperBar';

interface VariantBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVariantCreated: (variant: ExamVariant) => void;
  students: User[];
}

export const VariantBuilderModal: React.FC<VariantBuilderModalProps> = ({
  isOpen,
  onClose,
  onVariantCreated,
  students,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'tasks'>('settings');

  // Variant Info
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('math');
  const [examType, setExamType] = useState<'ЕГЭ' | 'ОГЭ'>('ЕГЭ');
  const [timeLimit, setTimeLimit] = useState(235);
  const [description, setDescription] = useState('');
  const [assignedStudentId, setAssignedStudentId] = useState<string>('all');

  // Tasks in Sequential Order
  const [tasks, setTasks] = useState<VariantTask[]>([
    {
      number: 1,
      title: 'Задание 1: Планиметрия',
      description: 'В прямоугольном треугольнике гипотенуза равна $c = 25$, а один из катетов $a = 15$. Найдите длину второго катета $b$.',
      maxScore: 1,
      isPartTwo: false,
      correctAnswer: '20',
    },
    {
      number: 2,
      title: 'Задание 2: Векторы и координаты',
      description: 'Даны векторы $\\vec{a}(3; 4)$ и $\\vec{b}(-1; 2)$. Найдите скалярное произведение векторов $\\vec{a} \\cdot \\vec{b}$.',
      maxScore: 1,
      isPartTwo: false,
      correctAnswer: '5',
    },
  ]);

  const [activeTaskIndex, setActiveTaskIndex] = useState<number>(0);
  const [showFormulaPreview, setShowFormulaPreview] = useState<boolean>(true);
  const [showBankPicker, setShowBankPicker] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTask = tasks[activeTaskIndex] || tasks[0];

  const handleUpdateCurrentTask = (field: keyof VariantTask, value: any) => {
    setTasks((prev) => {
      const updated = [...prev];
      if (updated[activeTaskIndex]) {
        updated[activeTaskIndex] = {
          ...updated[activeTaskIndex],
          [field]: value,
        };
      }
      return updated;
    });
  };

  const handleInsertFormula = (snippet: string) => {
    if (!currentTask) return;
    const currentDesc = currentTask.description || '';
    handleUpdateCurrentTask('description', currentDesc + ' ' + snippet);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleUpdateCurrentTask('imageUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      const isText =
        file.name.endsWith('.txt') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.md');
      const reader = new FileReader();

      if (isText) {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          let dataUrl = '';
          try {
            dataUrl = `data:text/plain;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(text)))}`;
          } catch {
            dataUrl = '';
          }
          const newAttachedFile: AttachedFile = {
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} КБ`,
            content: text,
            dataUrl,
          };
          const existingFiles = currentTask.attachedFiles || [];
          handleUpdateCurrentTask('attachedFiles', [
            ...existingFiles.filter((f) => f.name !== file.name),
            newAttachedFile,
          ]);
        };
        reader.readAsText(file);
      } else {
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const newAttachedFile: AttachedFile = {
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} КБ`,
            dataUrl,
          };
          const existingFiles = currentTask.attachedFiles || [];
          handleUpdateCurrentTask('attachedFiles', [
            ...existingFiles.filter((f) => f.name !== file.name),
            newAttachedFile,
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleImportVariantJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.subject) setSubject(parsed.subject);
        if (parsed.examType) setExamType(parsed.examType);
        if (parsed.timeLimitMinutes) setTimeLimit(parsed.timeLimitMinutes);
        if (parsed.description) setDescription(parsed.description);
        if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
          const renumbered = parsed.tasks.map((t: any, idx: number) => ({
            ...t,
            number: idx + 1,
            maxScore: t.maxScore || 1,
          }));
          setTasks(renumbered);
          setActiveTaskIndex(0);
          alert(`Успешно импортировано ${renumbered.length} заданий варианта!`);
          setActiveTab('tasks');
        }
      } catch (err: any) {
        alert('Ошибка при чтении файла варианта: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateCsExamStructure = () => {
    if (confirm('Сформировать полную структуру КЕГЭ по информатике (27 номеров ФИПИ)? Текущие задания будут заменены шаблонами.')) {
      const csStructure: VariantTask[] = [
        { number: 1, title: 'Задание 1: Анализ информационных моделей (графы и таблицы)', description: 'На рисунке схема дорог изображена в виде графа, в таблице содержатся сведения о длинах этих дорог. Определите длину дороги...', maxScore: 1, correctAnswer: '' },
        { number: 2, title: 'Задание 2: Таблицы истинности логических функций', description: 'Логическая функция задается выражением $(x \\land \\neg y) \\lor (x \\equiv z) \\lor \\neg w$. Определите, какому столбцу соответствует каждая переменная.', maxScore: 1, correctAnswer: '' },
        { number: 3, title: 'Задание 3: Базы данных и реляционные таблицы', description: 'Используя информацию из приведенной базы данных, определите...', maxScore: 1, correctAnswer: '' },
        { number: 4, title: 'Задание 4: Кодирование информации, условие Фано', description: 'По каналу связи передаются сообщения, содержащие только четыре буквы. Для передачи используется код, удовлетворяющий условию Фано.', maxScore: 1, correctAnswer: '' },
        { number: 5, title: 'Задание 5: Анализ алгоритмов для исполнителей', description: 'На вход алгоритма подается натуральное число $N$. Алгоритм строит по нему новое число $R$ следующим образом...', maxScore: 1, correctAnswer: '' },
        { number: 6, title: 'Задание 6: Исполнитель Черепаха / Кузнечик', description: 'Исполнитель Черепаха действует на плоскости с декартовой системой координат...', maxScore: 1, correctAnswer: '' },
        { number: 7, title: 'Задание 7: Кодирование изображений и звука', description: 'Для хранения растрового изображения размером 640x480 пикселей отведено 300 Кбайт памяти...', maxScore: 1, correctAnswer: '' },
        { number: 8, title: 'Задание 8: Комбинаторика и системы счисления', description: 'Определите количество пятизначных чисел в восьмеричной системе счисления, которые...', maxScore: 1, correctAnswer: '' },
        { number: 9, title: 'Задание 9: Обработка числовой информации в электронных таблицах', description: 'Откройте файл электронной таблицы. В каждой строке содержатся шесть натуральных чисел...', maxScore: 1, correctAnswer: '' },
        { number: 10, title: 'Задание 10: Поиск в текстовом редакторе', description: 'С помощью текстового редактора определите, сколько раз встречается слово...', maxScore: 1, correctAnswer: '' },
        { number: 11, title: 'Задание 11: Вычисление количества информации (пароли)', description: 'При регистрации в компьютерной системе каждому объекту сопоставляется идентификатор...', maxScore: 1, correctAnswer: '' },
        { number: 12, title: 'Задание 12: Исполнитель Редактор строк', description: 'Какая строка получится в результате применения приведенной программы к строке, состоящей из 80 единиц?', maxScore: 1, correctAnswer: '' },
        { number: 13, title: 'Задание 13: IP-адресация и маски подсетей', description: 'В терминологии сетей TCP/IP маской сети называют двоичное число...', maxScore: 1, correctAnswer: '' },
        { number: 14, title: 'Задание 14: Позиционные системы счисления', description: 'Значение арифметического выражения $4^{2026} + 2^{2026} - 15$ записали в четверичной системе счисления...', maxScore: 1, correctAnswer: '' },
        { number: 15, title: 'Задание 15: Истинность логических выражений (Отрезки и ДЕЛ)', description: 'Обозначим через ДЕЛ(n, m) утверждение «натуральное число n делится без остатка на m». Для какого наибольшего А формула тождественно истинна?', maxScore: 1, correctAnswer: '' },
        { number: 16, title: 'Задание 16: Вычисление рекуррентных соотношений', description: 'Алгоритм вычисления функции $F(n)$ задан следующими соотношениями: $F(1)=1$, $F(n)=n \\cdot F(n-1)$...', maxScore: 1, correctAnswer: '' },
        { number: 17, title: 'Задание 17: Проверка делимости элементов массива (файл 17.txt)', description: 'В файле 17.txt содержится последовательность целых чисел. Определите количество пар элементов...', maxScore: 1, correctAnswer: '' },
        { number: 18, title: 'Задание 18: Робот-сборщик монет (таблицы)', description: 'Квадрат разлинован на клетки. Исполнитель Робот может перемещаться только вправо или вниз...', maxScore: 1, correctAnswer: '' },
        { number: 19, title: 'Задание 19: Теория игр (1 куча, победа за 1 ход)', description: 'Два игрока, Петя и Ваня, играют в игру с одной кучей камней...', maxScore: 1, correctAnswer: '' },
        { number: 20, title: 'Задание 20: Теория игр (стратегия Пети)', description: 'Для игры из задания 19 найдите значения $S$, при которых у Пети есть выигрышная стратегия...', maxScore: 1, correctAnswer: '' },
        { number: 21, title: 'Задание 21: Теория игр (стратегия Вани)', description: 'Найдите значение $S$, при котором у Вани есть выигрышная стратегия, позволяющая выиграть первым или вторым ходом...', maxScore: 1, correctAnswer: '' },
        { number: 22, title: 'Задание 22: Многопроцессорные вычисления и зависимости', description: 'В файле содержится информация о совокупности $N$ процессов, которые могут выполняться параллельно или последовательно...', maxScore: 1, correctAnswer: '' },
        { number: 23, title: 'Задание 23: Динамическое программирование (Траектории)', description: 'Исполнитель преобразует число. Команды: 1. Прибавить 1, 2. Умножить на 2. Сколько существует программ из 1 в 20, содержащих 10?', maxScore: 1, correctAnswer: '' },
        { number: 24, title: 'Задание 24: Обработка символьных строк (файл 24.txt)', description: 'Текстовый файл 24.txt состоит из символов. Найдите максимальную длину подстроки, не содержащей подстроки AB.', maxScore: 1, correctAnswer: '' },
        { number: 25, title: 'Задание 25: Маски чисел и делители', description: 'Напишите программу, которая ищет среди натуральных чисел, превышающих $700\\,000$, числа, соответствующие маске...', maxScore: 1, correctAnswer: '' },
        { number: 26, title: 'Задание 26: Жадные алгоритмы и сортировка (файл 26.txt)', description: 'В файле 26.txt входные данные о размерах файлов пользователей и свободном месте на диске...', maxScore: 2, correctAnswer: '' },
        { number: 27, title: 'Задание 27: Анализ последовательностей и остатков (файлы 27A.txt и 27B.txt)', description: 'Дана последовательность целых чисел. Найдите непрерывную подпоследовательность с суммой, кратной 43...', maxScore: 2, correctAnswer: '' },
      ];
      setTasks(csStructure);
      setSubject('cs');
      setTimeLimit(235);
      if (!title) setTitle('ЕГЭ 2026: Тренировочный вариант КЕГЭ (ФИПИ)');
      setActiveTaskIndex(0);
      setActiveTab('tasks');
    }
  };

  const handleRemoveTaskFile = (fileName: string) => {
    const existing = currentTask.attachedFiles || [];
    handleUpdateCurrentTask('attachedFiles', existing.filter((f) => f.name !== fileName));
  };

  const handleAddNewTask = () => {
    const nextNumber = tasks.length + 1;
    const newTask: VariantTask = {
      number: nextNumber,
      title: `Задание ${nextNumber}: Новая задача`,
      description: 'Текст условия задачи. Поддерживаются формулы LaTeX: $x^2 + y^2 = R^2$.',
      maxScore: 1,
      isPartTwo: false,
      correctAnswer: '',
    };
    setTasks([...tasks, newTask]);
    setActiveTaskIndex(tasks.length);
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tasks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...tasks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Renumber sequentially
    const renumbered = updated.map((t, idx) => ({ ...t, number: idx + 1 }));
    setTasks(renumbered);
    setActiveTaskIndex(targetIndex);
  };

  const handleDeleteTask = (index: number) => {
    if (tasks.length <= 1) {
      alert('В варианте должно быть как минимум одно задание.');
      return;
    }
    const updated = tasks.filter((_, idx) => idx !== index);
    const renumbered = updated.map((t, idx) => ({ ...t, number: idx + 1 }));
    setTasks(renumbered);
    setActiveTaskIndex(Math.max(0, index - 1));
  };

  const handleImportFromBank = (bankTask: any) => {
    const nextNumber = tasks.length + 1;
    const newTask: VariantTask = {
      number: nextNumber,
      title: `Задание ${nextNumber}: ${bankTask.title}`,
      description: bankTask.description,
      formula: bankTask.formula,
      imageUrl: bankTask.imageUrl,
      attachedFiles: bankTask.attachedFiles,
      maxScore: 1,
      isPartTwo: false,
      correctAnswer: bankTask.correctAnswer || '',
      solution: bankTask.fullSolution,
      starterCode: bankTask.starterCode,
    };
    setTasks([...tasks, newTask]);
    setActiveTaskIndex(tasks.length);
    setShowBankPicker(false);
  };

  const calculateMaxPrimaryScore = () => {
    return tasks.reduce((sum, t) => sum + (t.maxScore || 1), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Укажите название варианта');
      setActiveTab('settings');
      return;
    }

    if (tasks.length === 0) {
      alert('Добавьте хотя бы одно задание в вариант');
      setActiveTab('tasks');
      return;
    }

    const maxPrimary = calculateMaxPrimaryScore();

    const created = storage.addExamVariant({
      title: title.trim(),
      subject,
      examType,
      timeLimitMinutes: Number(timeLimit) || 235,
      description: description.trim() || `Тренировочный вариант КИМ (${subject.toUpperCase()} ${examType})`,
      tasks,
      maxPrimaryScore: maxPrimary,
      assignedStudentIds: assignedStudentId === 'all' ? students.map((s) => s.id) : [assignedStudentId],
    });

    // If assigned to students, create Homework entry
    const targetStudentIds = assignedStudentId === 'all' ? students.map((s) => s.id) : [assignedStudentId];
    targetStudentIds.forEach((sId) => {
      storage.addHomework({
        studentId: sId,
        subject,
        title: `Экзаменационный вариант: ${created.title}`,
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'assigned',
        tasks: created.tasks.map((t) => ({ taskId: `var-${t.number}` })),
        tutorFeedback: 'Решите полный вариант с таймером в режиме симулятора экзамена.',
      });
    });

    confetti({ particleCount: 60, spread: 70 });
    onVariantCreated(created);
    onClose();
  };

  const bankTasks = storage.getTasks().filter((t) => t.subject === subject);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] shadow-2xl flex flex-col max-h-[94vh] text-xs font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#1A1C24] border-b border-[#1B1B19] dark:border-[#323642]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block" />
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2">
                Конструктор экзаменационных вариантов
              </h3>
              <p className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                Создание КИМ с последовательными заданиями, LaTeX формулами, чертежами и файлами данных
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#1B1B19]/60 dark:text-gray-400 hover:text-black dark:hover:text-white border border-[#1B1B19]/20 dark:border-[#323642]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#1B1B19] dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316] px-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#1B1B19] text-[#1B1B19] dark:border-[#E5C048] dark:text-[#E5C048]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400'
            }`}
          >
            1. Параметры варианта
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'border-[#1B1B19] text-[#1B1B19] dark:border-[#E5C048] dark:text-[#E5C048]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400'
            }`}
          >
            2. Задания по порядку ({tasks.length})
            <span className="px-1.5 py-0.2 bg-[#D4AF37] text-black font-bold text-[10px]">
              {calculateMaxPrimaryScore()} б.
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <label className="label-academic block mb-1">Название варианта *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: ЕГЭ 2026: Пробный вариант №1 (Информатика КЕГЭ)"
                  className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19] dark:border-[#323642] text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Предмет:</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19] dark:border-[#323642] text-xs focus:outline-none"
                  >
                    <option value="math">Математика</option>
                    <option value="physics">Физика</option>
                    <option value="cs">Информатика</option>
                    <option value="russian">Русский язык</option>
                  </select>
                </div>

                <div>
                  <label className="label-academic block mb-1">Тип экзамена:</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as any)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19] dark:border-[#323642] text-xs focus:outline-none"
                  >
                    <option value="ЕГЭ">ЕГЭ (11 класс)</option>
                    <option value="ОГЭ">ОГЭ (9 класс)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Лимит времени (минут):</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19] dark:border-[#323642] text-xs focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    {Math.floor(timeLimit / 60)} ч {timeLimit % 60} мин
                  </span>
                </div>

                <div>
                  <label className="label-academic block mb-1">Назначить ученикам (в ДЗ):</label>
                  <select
                    value={assignedStudentId}
                    onChange={(e) => setAssignedStudentId(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19] dark:border-[#323642] text-xs focus:outline-none"
                  >
                    <option value="all">Всем ученикам</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label-academic block mb-1">Инструкция к выполнению КИМ:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Правила оформления ответов, разрешенные справочные материалы, калькулятор..."
                  rows={3}
                  className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19] dark:border-[#323642] text-xs focus:outline-none leading-relaxed"
                />
              </div>

              {/* Fast Load & Import Tools */}
              <div className="p-3 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] space-y-2">
                <span className="label-academic text-[#D4AF37] block">Быстрая загрузка и шаблоны КИМ:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5" /> Загрузить вариант из файла (.json)
                    <input type="file" accept=".json" onChange={handleImportVariantJson} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={handleGenerateCsExamStructure}
                    className="px-3 py-1.5 bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-[#F8F7F4] border border-[#1B1B19] dark:border-[#323642] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Шаблон КЕГЭ (27 заданий)
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">
                  Вы можете загрузить готовый вариант целиком или сгенерировать официальную структуру КЕГЭ 2026.
                </p>
              </div>

              <div className="pt-3 flex justify-between items-center">
                <span className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                  В варианте сейчас: {tasks.length} заданий на {calculateMaxPrimaryScore()} баллов
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className="px-4 py-2 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] uppercase font-bold tracking-wider cursor-pointer"
                >
                  Перейти к заданиям →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Sequential Task List (1, 2, 3...) */}
              <div className="lg:col-span-4 space-y-2 border-r border-[#1B1B19]/15 dark:border-[#323642] pr-0 lg:pr-3 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-1 border-b border-[#1B1B19]/15 dark:border-[#323642]">
                  <span className="label-academic">Порядок заданий:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowBankPicker(true)}
                      className="px-1.5 py-0.5 border border-[#1B1B19]/30 dark:border-[#323642] hover:bg-black/5 dark:hover:bg-white/5 text-[10px] uppercase font-bold flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3 text-[#D4AF37]" /> Из банка
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewTask}
                      className="px-2 py-0.5 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> + Задание
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {tasks.map((t, idx) => {
                    const isSelected = idx === activeTaskIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveTaskIndex(idx)}
                        className={`p-2 border transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19] dark:border-[#E5C048]'
                            : 'bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 dark:border-[#323642] hover:border-[#1B1B19]'
                        }`}
                      >
                        <div className="truncate flex-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-xs bg-[#D4AF37] text-black flex items-center justify-center text-[10px] shrink-0 font-mono">
                              {t.number}
                            </span>
                            <span className="truncate">{t.title}</span>
                          </div>
                          <div className="text-[10px] opacity-70 truncate mt-0.5">
                            {t.isPartTwo ? 'Развёрнутый' : `Ответ: ${t.correctAnswer || 'не задан'}`} • {t.maxScore} б.
                            {t.imageUrl && ' • 🖼️'}
                            {t.attachedFiles && t.attachedFiles.length > 0 && ` • 📁 ${t.attachedFiles.length}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleMoveTask(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:text-[#D4AF37] disabled:opacity-30"
                            title="Вверх"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTask(idx, 'down')}
                            disabled={idx === tasks.length - 1}
                            className="p-1 hover:text-[#D4AF37] disabled:opacity-30"
                            title="Вниз"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(idx)}
                            className="p-1 hover:text-rose-500"
                            title="Удалить"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Active Task Editor */}
              {currentTask ? (
                <div className="lg:col-span-8 space-y-3 max-h-[60vh] overflow-y-auto pl-0 lg:pl-1">
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#1B1B19]/15 dark:border-[#323642] gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#D4AF37] text-black font-bold flex items-center justify-center text-xs">
                        №{currentTask.number}
                      </span>
                      <input
                        type="text"
                        value={currentTask.title}
                        onChange={(e) => handleUpdateCurrentTask('title', e.target.value)}
                        placeholder="Название задания"
                        className="bg-transparent font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE] border-b border-dashed border-[#1B1B19]/30 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={currentTask.isPartTwo || false}
                          onChange={(e) => handleUpdateCurrentTask('isPartTwo', e.target.checked)}
                          className="accent-[#D4AF37]"
                        />
                        <span>Часть 2 (Развёрнутый)</span>
                      </label>

                      <div className="flex items-center gap-1 text-xs">
                        <span>Балл:</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={currentTask.maxScore}
                          onChange={(e) => handleUpdateCurrentTask('maxScore', Number(e.target.value))}
                          className="w-12 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-1 border border-[#1B1B19] dark:border-[#323642] text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Task statement with LaTeX helpers */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label-academic">Текст условия задачи *</label>
                      <button
                        type="button"
                        onClick={() => setShowFormulaPreview(!showFormulaPreview)}
                        className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 font-bold"
                      >
                        {showFormulaPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showFormulaPreview ? 'Скрыть предпросмотр' : 'Показать формулы'}
                      </button>
                    </div>

                    <FormulaHelperBar onInsert={handleInsertFormula} className="mb-1.5" />

                    <textarea
                      value={currentTask.description}
                      onChange={(e) => handleUpdateCurrentTask('description', e.target.value)}
                      placeholder="Введите условие задачи. Формулы оборачивайте в $...$ для строчных или $$...$$ для блочных."
                      rows={4}
                      className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19] dark:border-[#323642] text-xs focus:outline-none font-sans leading-relaxed"
                    />

                    {/* Live LaTeX preview */}
                    {showFormulaPreview && currentTask.description.trim() && (
                      <div className="p-3 mt-1.5 bg-[#FFFDF5] dark:bg-[#12141B] border border-[#D4AF37]/50 text-xs font-sans">
                        <div className="label-academic text-[#D4AF37] mb-1">Предпросмотр отображения у ученика:</div>
                        <MathRenderer content={currentTask.description} />
                      </div>
                    )}
                  </div>

                  {/* Image and File Attachments Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Image Attachment */}
                    <div className="p-2.5 border border-[#1B1B19]/20 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <ImageIcon className="w-3.5 h-3.5 text-[#D4AF37]" /> Иллюстрация / Чертёж
                        </span>
                        <label className="px-2 py-0.5 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3" /> Загрузить
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>

                      {currentTask.imageUrl ? (
                        <div className="relative border border-[#1B1B19]/20 dark:border-[#323642] bg-white dark:bg-[#1A1C24] p-1">
                          <img
                            src={currentTask.imageUrl}
                            alt="Прикреплённый чертёж"
                            className="max-h-32 mx-auto object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCurrentTask('imageUrl', undefined)}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white hover:bg-rose-700"
                            title="Удалить картинку"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 italic">
                          Вы можете прикрепить геометрию, схему, график или скриншот.
                        </p>
                      )}
                    </div>

                    {/* Files Attachment for Informatics */}
                    <div className="p-2.5 border border-[#1B1B19]/20 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-[#D4AF37]" /> Файлы данных (Информатика)
                        </span>
                        <label className="px-2 py-0.5 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                          <Upload className="w-3 h-3" /> Прикрепить
                          <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                        </label>
                      </div>

                      {currentTask.attachedFiles && currentTask.attachedFiles.length > 0 ? (
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {currentTask.attachedFiles.map((f) => (
                            <div
                              key={f.name}
                              className="flex items-center justify-between p-1 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] text-[10px]"
                            >
                              <span className="truncate font-bold">{f.name} ({f.size || 'файл'})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTaskFile(f.name)}
                                className="text-rose-500 hover:text-rose-700 ml-1 p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 italic">
                          Файлы к заданиям 17, 24, 26, 27 (.txt, .csv, .xlsx).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Answers & Criteria */}
                  {!currentTask.isPartTwo ? (
                    <div>
                      <label className="label-academic block mb-1">
                        Правильный ответ (для автопроверки 1 части) *
                      </label>
                      <input
                        type="text"
                        required
                        value={currentTask.correctAnswer || ''}
                        onChange={(e) => handleUpdateCurrentTask('correctAnswer', e.target.value)}
                        placeholder="Например: 42 или 3.5 или ABBA"
                        className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-[#1B1B19] dark:border-[#323642] font-mono text-xs focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-600/30">
                      <div>
                        <label className="label-academic block mb-1 text-amber-900 dark:text-amber-300">
                          Критерии проверки (для оценивания 2 части):
                        </label>
                        <textarea
                          value={currentTask.criteria || ''}
                          onChange={(e) => handleUpdateCurrentTask('criteria', e.target.value)}
                          placeholder="3 балла: решение верное, все пункты обоснованы...&#10;2 балла: допущена арифметическая ошибка...&#10;0 баллов: неверно"
                          rows={2}
                          className="w-full bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-amber-600/30 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="label-academic block mb-1 text-amber-900 dark:text-amber-300">
                          Полное методическое решение:
                        </label>
                        <textarea
                          value={currentTask.solution || ''}
                          onChange={(e) => handleUpdateCurrentTask('solution', e.target.value)}
                          placeholder="Эталонное решение задания..."
                          rows={2}
                          className="w-full bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-amber-600/30 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* CS: Optional starter code */}
                  {subject === 'cs' && (
                    <div>
                      <label className="label-academic block mb-1 flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Стартовый шаблон кода на Python (опционально):
                      </label>
                      <textarea
                        value={currentTask.starterCode || ''}
                        onChange={(e) => handleUpdateCurrentTask('starterCode', e.target.value)}
                        placeholder="with open('24.txt') as f:&#10;    s = f.read().strip()&#10;    # напишите решение"
                        rows={2}
                        className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-[#1B1B19] dark:border-[#323642] font-mono text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Bank Picker Modal Overlay */}
        {showBankPicker && (
          <div className="absolute inset-0 z-20 bg-white/95 dark:bg-[#16181F]/95 backdrop-blur-xs p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1B1B19] dark:border-[#323642]">
              <div className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                Импорт задачи из банка ({subject.toUpperCase()})
              </div>
              <button
                type="button"
                onClick={() => setShowBankPicker(false)}
                className="p-1 border border-[#1B1B19]/30 text-xs"
              >
                ✕ Закрыть
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {bankTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  В банке пока нет задач по предмету {subject}. Вы можете создать их вручную.
                </div>
              ) : (
                bankTasks.map((bt) => (
                  <div
                    key={bt.id}
                    className="p-3 border border-[#1B1B19]/20 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316] flex items-center justify-between gap-3 hover:border-[#D4AF37]"
                  >
                    <div>
                      <div className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                        {bt.title} {bt.examNumber ? `(${bt.examNumber})` : ''}
                      </div>
                      <div className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400 line-clamp-2">
                        {bt.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImportFromBank(bt)}
                      className="px-3 py-1 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[10px] font-bold uppercase shrink-0"
                    >
                      + Добавить
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-5 py-3 bg-[#F8F7F4] dark:bg-[#1A1C24] border-t border-[#1B1B19] dark:border-[#323642] flex items-center justify-between">
          <div className="text-[11px] text-[#1B1B19]/70 dark:text-gray-400">
            Всего заданий: <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">{tasks.length}</span> • Макс. первичный балл:{' '}
            <span className="font-bold text-[#D4AF37]">{calculateMaxPrimaryScore()}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white dark:bg-[#16181F] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] uppercase text-xs cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-1.5 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] uppercase font-bold tracking-wider text-xs shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Опубликовать вариант
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
