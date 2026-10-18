import {
  User,
  TimeSlot,
  Task,
  Homework,
  StudyMaterial,
  ExamTopicProgress,
  ExamNumberProgress,
  InformalNote,
  ExamVariant,
  XPReward,
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'tutor-roman',
    name: 'Мальцев Роман Михайлович',
    email: 'roman.maltsev@booktutor.ru',
    password: 'tutor',
    role: 'tutor',
    notes: 'Преподаватель. Эксперт ЕГЭ/ОГЭ по математике, физике, информатике и русскому языку. Стаж более 10 лет.',
  },
  {
    id: 'student-1',
    name: 'Алексей Смирнов',
    email: 'alexey.smirnov@mail.ru',
    password: 'student',
    role: 'student',
    grade: '11 класс',
    targetExam: 'ЕГЭ',
    examKind: 'ege',
    targetScore: 92,
    parentName: 'Смирнова Елена Викторовна',
    parentPhone: '+7 (916) 234-56-78',
    notes: 'Мотивированный ученик, нацелен на МФТИ / ВШЭ (ФКН). Отлично решает параметры, шлифуем стереометрию.',
    subjects: ['math', 'cs', 'physics'],
  },
  {
    id: 'student-2',
    name: 'Екатерина Васильева',
    email: 'ekaterina.v@yandex.ru',
    password: 'student',
    role: 'student',
    grade: '10 класс',
    targetExam: 'ЕГЭ',
    examKind: 'ege',
    targetScore: 85,
    parentName: 'Васильев Игорь Сергеевич',
    parentPhone: '+7 (925) 345-67-89',
    notes: 'Готовится к ЕГЭ по физике и профильной математике.',
    subjects: ['physics', 'math'],
  },
];

export const INITIAL_SLOTS: TimeSlot[] = [
  {
    id: 'slot-window-mon',
    date: '2026-10-19',
    startTime: '19:00',
    endTime: '23:00',
    subject: 'math',
    tutorId: 'tutor-roman',
    isBooked: false,
    isWindow: true,
    topic: 'Свободное время для индивидуальных разборов (запись с любой темой)',
    meetingLink: 'https://telemost.yandex.ru/j/84920193857102',
    status: 'available',
  },
  {
    id: 'slot-1',
    date: '2026-10-20',
    startTime: '18:00',
    endTime: '19:30',
    subject: 'math',
    tutorId: 'tutor-roman',
    isBooked: false,
    topic: 'Параметры в ЕГЭ: графический метод и ромб',
    meetingLink: 'https://telemost.yandex.ru/j/84920193857102',
    status: 'available',
    homeworkId: 'hw-1',
    homeworkTitle: 'Домашняя работа №1: Параметры и тригонометрия',
    materialIds: ['mat-math-1'],
    materialTitles: ['Конспект: Тригонометрические формулы и методы решения параметров'],
  },
  {
    id: 'slot-2',
    date: '2026-10-21',
    startTime: '17:00',
    endTime: '18:30',
    subject: 'physics',
    tutorId: 'tutor-roman',
    isBooked: false,
    topic: 'Электромагнитная индукция и колебательный контур',
    meetingLink: 'https://telemost.yandex.ru/j/73918294719201',
    status: 'available',
    materialIds: ['mat-phys-1'],
    materialTitles: ['Справочник формул: Электромагнетизм и постоянный ток'],
  },
  {
    id: 'slot-3',
    date: '2026-10-22',
    startTime: '18:00',
    endTime: '19:30',
    subject: 'cs',
    tutorId: 'tutor-roman',
    isBooked: false,
    topic: 'Информатика КЕГЭ: Решение задач 26 и 27 на Python',
    meetingLink: 'https://telemost.yandex.ru/j/91028471928475',
    status: 'available',
    materialIds: ['mat-cs-1'],
    materialTitles: ['Памятка КЕГЭ: Шаблоны решения задач 24-27 на Python'],
  },
];

export const INITIAL_TASKS: Task[] = [
  // MATH
  {
    id: 'task-math-1',
    subject: 'math',
    topic: 'Уравнения с параметрами',
    examNumber: 'ЕГЭ №18',
    difficulty: 'hard',
    title: 'Графический метод с ромбом и окружностью',
    description: 'Найдите все значения $a$, при каждом из которых система уравнений имеет ровно 4 различных решения:\n$$\\begin{cases} |x| + |y| = 4 \\\\ (x - a)^2 + (y - a)^2 = 4 \\end{cases}$$',
    formula: '|x| + |y| = 4',
    hints: [
      'Первое уравнение задаёт квадрат с вершинами в (±4; 0) и (0; ±4).',
      'Второе уравнение задаёт окружность радиуса R=2 с центром на прямой y = x в точке (a; a).',
      'Найдите касания окружности со сторонами квадрата.'
    ],
    correctAnswer: '[-2√2; 2√2]',
    fullSolution: '1) Первое уравнение задаёт границу квадрата с вершинами (4,0), (0,4), (-4,0), (0,-4). Стороны квадрата лежат на прямых x + y = 4, x - y = 4 и т.д.\n2) Второе уравнение — окружность радиуса R=2 с центром C(a, a).\n3) Центр лежит на диагонали y = x. Расстояние от (a, a) до стороны x + y = 4 равно d = |a + a - 4| / √2 = |2a - 4| / √2.\n4) Ровно 4 точки пересечения достигаются при внутренних касаниях и пересечениях в диапазоне a ∈ [-2√2; 2√2].',
    createdAt: '2026-09-20',
  },
  {
    id: 'task-math-2',
    subject: 'math',
    topic: 'Стереометрия',
    examNumber: 'ЕГЭ №14',
    difficulty: 'medium',
    title: 'Расстояние между скрещивающимися прямыми',
    description: 'В правильной треугольной призме $ABCA_1B_1C_1$, все рёбра которой равны 2, найдите расстояние между скрещивающимися прямыми $AB_1$ и $BC_1$.',
    formula: 'd(AB_1, BC_1) = \\frac{2\\sqrt{21}}{7}',
    hints: [
      'Постройте плоскость, параллельную одной прямой и содержащую другую прямую.',
      'Или используйте метод координат: выберите начало координат в вершине A.'
    ],
    correctAnswer: '2√21/7',
    fullSolution: 'Введём декартову систему координат с началом в точке B. Найдём направляющие векторы прямых и составим уравнение расстояния как высоты параллелепипеда, натянутого на векторы. Результат d = 2√21 / 7.',
    createdAt: '2026-09-22',
  },
  {
    id: 'task-math-3',
    subject: 'math',
    topic: 'Тригонометрические уравнения',
    examNumber: 'ЕГЭ №13',
    difficulty: 'easy',
    title: 'Отбор корней на единичном круге',
    description: 'а) Решите уравнение $2\\cos^2 x - 3\\sin x = 0$.\nб) Укажите корни, принадлежащие отрезку $[\\pi; \\frac{5\\pi}{2}]$.',
    formula: '2(1 - \\sin^2 x) - 3\\sin x = 0',
    hints: [
      'Замените $\\cos^2 x$ на $1 - \\sin^2 x$.',
      'Получите квадратное уравнение относительно $t = \\sin x$, учитывая $|t| \\le 1$.'
    ],
    correctAnswer: 'π/6 + 2πk; 5π/6 + 2πk',
    fullSolution: 'а) 2(1 - sin²x) - 3sinx = 0 => 2sin²x + 3sinx - 2 = 0. t = 1/2 или t = -2 (нет реш). sin x = 1/2 => x = π/6 + 2πk, x = 5π/6 + 2πk.\nб) На отрезке [π; 5π/2]: корни 13π/6 и 17π/6.',
    createdAt: '2026-09-24',
  },

  // PHYSICS
  {
    id: 'task-phys-1',
    subject: 'physics',
    topic: 'Электромагнитная индукция',
    examNumber: 'ЕГЭ №16',
    difficulty: 'medium',
    title: 'ЭДС индукции в движущемся проводнике',
    description: 'Проводник длиной $L = 0.5$ м движется со скоростью $v = 10$ м/с в однородном магнитном поле с индукцией $B = 0.4$ Тл перпендикулярно линиям индукции. Найдите разность потенциалов на концах проводника.',
    formula: '\\mathcal{E} = B v L \\sin \\alpha',
    hints: [
      'Используйте формулу для ЭДС индукции в движущемся проводнике: $\\mathcal{E} = B v L \\sin \\alpha$.',
      'Так как угол между скоростью и полем равен 90°, $\\sin 90^\\circ = 1$.'
    ],
    correctAnswer: '2',
    fullSolution: 'E = B * v * L * sin(90°) = 0.4 Тл * 10 м/с * 0.5 м * 1 = 2 В.',
    createdAt: '2026-09-25',
  },
  {
    id: 'task-phys-2',
    subject: 'physics',
    topic: 'МКТ и Термодинамика',
    examNumber: 'ЕГЭ №12',
    difficulty: 'hard',
    title: 'КПД тепловой машины и работа газа',
    description: 'Одноатомный идеальный газ в количестве $\\nu = 2$ моль совершает циклический процесс $1 \\to 2 \\to 3 \\to 1$. В процессе $1-2$ давление линейно растёт с объёмом от $P_1 = 10^5$ Па, $V_1 = 20$ л до $P_2 = 3 \\cdot 10^5$ Па, $V_2 = 60$ л. Процесс $2-3$ изохорный, $3-1$ изобарный. Найдите работу газа за цикл.',
    formula: 'A_{цикла} = \\frac{1}{2} (P_2 - P_1)(V_2 - V_1)',
    hints: [
      'Работа за цикл численно равна площади фигуры на диаграмме P-V.',
      'Фигура представляет собой прямоугольный треугольник.'
    ],
    correctAnswer: '4000',
    fullSolution: 'A = 1/2 * (P2 - P1) * (V2 - V1) = 0.5 * (3e5 - 1e5) Па * (60 - 20) * 1e-3 м³ = 0.5 * 200000 * 0.04 = 4000 Дж = 4 кДж.',
    createdAt: '2026-09-26',
  },

  // CS
  {
    id: 'task-cs-1',
    subject: 'cs',
    topic: 'Обработка символьных строк',
    examNumber: 'КЕГЭ №24',
    difficulty: 'medium',
    title: 'Максимальная длина последовательности гласных',
    description: 'Текстовый файл состоит из заглавных букв латинского алфавита. Определите максимальное количество идущих подряд символов, среди которых нет согласных букв (буквы A, E, I, O, U, Y считаются гласными).',
    hints: [
      'Считайте строку и заменяйте все гласные на единый символ, например "1", а согласные на пробел.',
      'Либо используйте алгоритм скользящего окна.'
    ],
    correctAnswer: '19',
    fullSolution: 'with open("24.txt") as f:\n    s = f.read().strip()\nvowels = set("AEIOUY")\nmax_c = cur_c = 0\nfor ch in s:\n    if ch in vowels:\n        cur_c += 1\n        max_c = max(max_c, cur_c)\n    else:\n        cur_c = 0\nprint(max_c)',
    language: 'python',
    starterCode: `# КЕГЭ Задание 24
sample_data = "ABCEIOUYKLMNOPQRAEIOUUYYZ"

vowels = set("AEIOUY")
cur_len = max_len = 0

for ch in sample_data:
    if ch in vowels:
        cur_len += 1
        max_len = max(max_len, cur_len)
    else:
        cur_len = 0

print("Максимальная длина:", max_len)`,
    createdAt: '2026-09-27',
  },
  {
    id: 'task-cs-2',
    subject: 'cs',
    topic: 'Рекурсивные функции',
    examNumber: 'КЕГЭ №16',
    difficulty: 'easy',
    title: 'Вычисление рекурсии с мемоизацией',
    description: 'Алгоритм вычисления функции $F(n)$ задан соотношениями:\n$F(n) = 1$ при $n = 1$;\n$F(n) = n + F(n - 1)$, если $n$ чётно;\n$F(n) = 2 \\cdot F(n - 2)$, если $n > 1$ нечётно.\nЧему равно значение $F(26)$?',
    hints: [
      'Напишите рекурсивную функцию на Python с декоратором @lru_cache.',
      'Убедитесь, что глубина рекурсии sys.setrecursionlimit достаточна.'
    ],
    correctAnswer: '4128',
    fullSolution: 'from functools import lru_cache\n\n@lru_cache(None)\ndef F(n):\n    if n == 1: return 1\n    if n % 2 == 0: return n + F(n - 1)\n    return 2 * F(n - 2)\n\nprint(F(26))',
    language: 'python',
    starterCode: `from functools import lru_cache

@lru_cache(None)
def F(n):
    if n == 1:
        return 1
    if n % 2 == 0:
        return n + F(n - 1)
    return 2 * F(n - 2)

print("Ответ:", F(26))`,
    createdAt: '2026-09-28',
  },

  // RUSSIAN
  {
    id: 'task-rus-1',
    subject: 'russian',
    topic: 'Орфоэпические нормы (ударения)',
    examNumber: 'ЕГЭ №4',
    difficulty: 'easy',
    title: 'Нормы постановки ударения ФИПИ',
    description: 'Укажите варианты ответов, в которых верно выделена буква, обозначающая ударный гласный звук. Запишите номера ответов.\n\n1) тОрты\n2) закупОренный\n3) звонИт\n4) красИвее\n5) бухгАлтеров',
    hints: [
      'Вспомните орфоэпический словник ФИПИ.',
      'Глагол «звонить» имеет неподвижное ударение на окончание во всех формах: звонИшь, звонИт.'
    ],
    correctAnswer: '1345',
    fullSolution: '1) тОрты — верно (мн. ч. от тОрт).\n2) закУпоренный — неверно (ударение на У).\n3) звонИт — верно.\n4) красИвее — верно (сравнит. степень от красИвый).\n5) бухгАлтеров — верно (неподвижное на корень).\nОтвет: 1345.',
    createdAt: '2026-09-29',
  },
  {
    id: 'task-rus-2',
    subject: 'russian',
    topic: 'Пунктуация в сложном предложении',
    examNumber: 'ЕГЭ №16',
    difficulty: 'medium',
    title: 'Знаки препинания в ССП и при однородных членах',
    description: 'Расставьте знаки препинания. Укажите предложения, в которых нужно поставить ОДНУ запятую. Запишите номера этих предложений.\n\n1) На рассвете подул холодный ветер и по верхушкам сосен побежала рябь.\n2) Солнце грело жарко но ласково и ветерок шевелил молодую траву.\n3) В саду росли как яблони так и груши.\n4) Мы долго бродили по лесу и собирали грибы и ягоды.\n5) Ветер выл в трубе и за окном шумела метель.',
    hints: [
      'Обратите внимание на наличие общего второстепенного члена (например, обстоятельства «На рассвете»), отменяющего запятую между частями ССП.',
      'Проверьте двойные союзы «как..., так и...».'
    ],
    correctAnswer: '23',
    fullSolution: '1) «На рассвете» — общий второстепенный член для обеих основ, запятая не ставится (0 запятых).\n2) Противительный союз «но» разделяет однородные: «жарко, но ласково» (1 запятая).\n3) Двойной союз «как..., так и...» требует запятой перед второй частью: «как яблони, так и груши» (1 запятая).\n4) Разные группы однородных (бродили и собирали; грибы и ягоды) — 0 запятых.\n5) Две грамматические основы без общего члена, нужна запятая (1 запятая). Но в ряде вариантов 2, 3.\nОтвет: 23.',
    createdAt: '2026-09-30',
  },
];

export const INITIAL_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat-rus-1',
    subject: 'russian',
    title: 'Полный орфоэпический словник и паронимы ФИПИ 2026',
    topic: 'Задания 4 и 5 ЕГЭ: правила ударений и различия паронимов',
    type: 'cheat_sheet',
    content: 'Ключевые слова-ловушки с ударениями:\n• Глаголы: бралА, взялА, добралАсь, дождалАсь, звонИт, клАла, крАлась, полилА, послАла.\n• Существительные: аэропОрты, бАнты, бОроду, бухгАлтеров, вероисповЕдание, граждАнство, дефИс, диспансЕр, договОр, докумЕнт, жалюзИ, каталОг, квартАл, кремЕнь, столЯр, тОрты, шАрфы, экспЕрт.\n• Причастия: баловАнный, включЁнный, довезЁнный, заселЁнный, кормпЯщий, кровоточАщий, начАвший, понЯвший.\n\nПаронимы:\n• Абонент (человек) / Абонемент (право пользования)\n• Вздох (вдох-выдох) / Вдох (только забор воздуха)\n• Глинистый (с глиной) / Глиняный (из глины)\n• Экономичный (выгодный) / Экономический (относящийся к экономике)',
    keyFormulas: [
      'тОрты, но шарфЫ',
      'звонИт, звонИшь, звонЯт',
      'жалюзИ, каталОг, экспЕрт'
    ],
    readTimeMinutes: 12,
  },
  {
    id: 'mat-math-1',
    subject: 'math',
    title: 'Шпаргалка: Все формулы тригонометрии и параметры',
    topic: 'Тригонометрия и графический метод с параметром',
    type: 'formula_pack',
    content: 'Основные тождества и формулы сложения:\n$\\sin(x \\pm y) = \\sin x \\cos y \\pm \\cos x \\sin y$\n$\\cos(x \\pm y) = \\cos x \\cos y \\mp \\sin x \\sin y$\nДвойной угол: $\\cos 2x = \\cos^2 x - \\sin^2 x = 2\\cos^2 x - 1 = 1 - 2\\sin^2 x$.\n\nГрафические приёмы в параметрах:\n1) Плоскость $(x; y)$: окружность $(x-a)^2 + (y-b)^2 = R^2$, ромб $|x| + |y| = R$, уголок $y = a|x - x_0| + y_0$.\n2) Плоскость $(x; a)$: пучки прямых $a = kx + b$, ветви парабол $a = x^2 + px + q$.',
    keyFormulas: [
      '\\sin^2 x + \\cos^2 x = 1',
      '\\sin 2x = 2\\sin x \\cos x',
      '(x - a)^2 + (y - b)^2 = R^2'
    ],
    readTimeMinutes: 15,
  },
  {
    id: 'mat-phys-1',
    subject: 'physics',
    title: 'Справочник формул: Электромагнетизм и постоянный ток',
    topic: 'Электростатика, законы Ома и электромагнитная индукция',
    type: 'formula_pack',
    content: 'Закон Кулона: $F = k \\frac{|q_1 q_2|}{r^2}$, где $k = \\frac{1}{4\\pi \\varepsilon_0} \\approx 9 \\cdot 10^9$ Н·м²/Кл².\nЗакон Ома для полной цепи: $I = \\frac{\\mathcal{E}}{R + r}$.\nЗакон Фарадея: $\\mathcal{E}_i = -\\frac{\\Delta \\Phi}{\\Delta t}$, где $\\Phi = B S \\cos \\alpha$.\nИндуктивность и энергия магнитного поля: $W_M = \\frac{L I^2}{2}$.\nФормула Томсона для периода колебаний: $T = 2\\pi \\sqrt{L C}$.',
    keyFormulas: [
      'I = \\frac{\\mathcal{E}}{R + r}',
      '\\mathcal{E}_i = -\\frac{\\Delta \\Phi}{\\Delta t}',
      'T = 2\\pi \\sqrt{L C}',
      'W = \\frac{L I^2}{2}'
    ],
    readTimeMinutes: 10,
  },
  {
    id: 'mat-cs-1',
    subject: 'cs',
    title: 'Памятка КЕГЭ: Шаблоны решения задач 24-27 на Python',
    topic: 'Алгоритмы, динамическое программирование и обработка файлов',
    type: 'code_sample',
    content: 'Быстрое чтение файла:\nwith open("file.txt") as f:\n    data = [int(x) for x in f]\n\nСортировка с ключом:\nsorted_arr = sorted(items, key=lambda x: (-x[0], x[1]))\n\nПрефиксные суммы для делимости на K (Задание 27):\nmod_map = {0: 0}\ncur_sum = 0\nfor i, x in enumerate(data, 1):\n    cur_sum += x\n    r = cur_sum % K\n    if r in mod_map: max_len = max(max_len, i - mod_map[r])\n    else: mod_map[r] = i',
    keyFormulas: [
      '\\text{lru\\_cache(None)}',
      'O(N) \\text{ префиксные суммы}',
      '\\text{set.intersection()}'
    ],
    readTimeMinutes: 8,
  },
];

export const INITIAL_EXAM_VARIANTS: ExamVariant[] = [
  {
    id: 'var-cs-1',
    title: 'КЕГЭ 2026: Тренировочный вариант №1 по информатике (Kompege style)',
    subject: 'cs',
    examType: 'ЕГЭ',
    timeLimitMinutes: 235,
    description: 'Полный тренировочный вариант компьютерного ЕГЭ с мгновенной проверкой ответов и встроенной IDE-песочницей на Python.',
    maxPrimaryScore: 29,
    createdAt: '2026-09-28',
    assignedStudentIds: [],
    tasks: [
      {
        number: 1,
        title: 'Задание 1: Анализ графов и весовых таблиц',
        description: 'На рисунке схема дорог изображена в виде графа, в таблице звёздочками обозначено наличие дорог между пунктами. Определите длину дороги из пункта А в пункт Д.',
        maxScore: 1,
        correctAnswer: '46',
      },
      {
        number: 2,
        title: 'Задание 2: Таблицы истинности логических выражений',
        description: 'Миша заполнял таблицу истинности функции $(x \\land \\neg y) \\lor (x \\equiv z) \\lor \\neg w$. Определите, какому столбцу соответствует каждая из переменных $x, y, z, w$.',
        maxScore: 1,
        correctAnswer: 'yzwx',
      },
      {
        number: 14,
        title: 'Задание 14: Позиционные системы счисления',
        description: 'Операнды арифметического выражения записаны в системе счисления с основанием 19:\n$$98x79_{19} + 3x492_{19}$$\nОпределите наименьшее значение $x$, при котором значение выражения кратно 18. Для найденного $x$ вычислите частное от деления значения выражения на 18.',
        maxScore: 1,
        correctAnswer: '12495',
        starterCode: `# Решение Задания 14 на Python
for x in range(19):
    val = (9*19**4 + 8*19**3 + x*19**2 + 7*19 + 9) + (3*19**4 + x*19**3 + 4*19**2 + 9*19 + 2)
    if val % 18 == 0:
        print("x =", x, "частное =", val // 18)
        break`,
      },
      {
        number: 16,
        title: 'Задание 16: Вычисление рекурсивной функции',
        description: 'Алгоритм вычисления функции $F(n)$:\n$F(n) = 1$ при $n = 1$;\n$F(n) = n + F(n - 1)$, если $n$ чётно;\n$F(n) = 2 \\cdot F(n - 2)$, если $n > 1$ нечётно.\nЧему равно значение $F(26)$?',
        maxScore: 1,
        correctAnswer: '4128',
        starterCode: `from functools import lru_cache

@lru_cache(None)
def F(n):
    if n == 1: return 1
    if n % 2 == 0: return n + F(n - 1)
    return 2 * F(n - 2)

print(F(26))`,
      },
      {
        number: 24,
        title: 'Задание 24: Обработка текстового файла',
        description: 'Текстовый файл содержит строку из символов A, B, C, D, E. Найдите длину самой длинной подстроки, не содержащей подстроки "AB". Для тестовых данных: sample = "ABCABABDEEABAB"',
        maxScore: 1,
        correctAnswer: '7',
        starterCode: `sample = "ABCABABDEEABAB"
# напишите решение
s = sample.replace("AB", "A B")
parts = s.split()
print(max(len(p) for p in parts))`,
      },
      {
        number: 26,
        title: 'Задание 26: Обработка числовой последовательности',
        description: 'В файле записано количество коробок и их размеры. Найдите максимальное количество коробок, которые можно вложить друг в друга (каждая следующая должна быть минимум на 3 единицы больше).',
        maxScore: 2,
        correctAnswer: '12 870',
      },
      {
        number: 27,
        title: 'Задание 27: Анализ последовательностей чисел (Часть B)',
        description: 'Дана последовательность целых положительных чисел. Найдите максимальную длину непрерывной подпоследовательности, сумма элементов которой кратна 43.',
        maxScore: 2,
        correctAnswer: '482',
        starterCode: `# Задание 27 на Python
test_arr = [12, 43, 86, 14, 29, 43, 7, 36]
K = 43
# решение через словарь остатков
mod_map = {0: 0}
cur_s = 0
ans = 0
for i, x in enumerate(test_arr, 1):
    cur_s += x
    r = cur_s % K
    if r in mod_map:
        ans = max(ans, i - mod_map[r])
    else:
        mod_map[r] = i
print("Ответ:", ans)`,
      },
    ],
  },
  {
    id: 'var-math-1',
    title: 'ЕГЭ 2026: Пробный вариант по математике (Профиль)',
    subject: 'math',
    examType: 'ЕГЭ',
    timeLimitMinutes: 235,
    description: 'Официальная структура КИМ ФИПИ: 12 заданий первой части с краткой записью ответа и задачи второй части (13, 14, 15, 18) с критериями самооценки.',
    maxPrimaryScore: 32,
    createdAt: '2026-09-29',
    assignedStudentIds: [],
    tasks: [
      {
        number: 1,
        title: 'Задание 1: Планиметрия',
        description: 'В треугольнике $ABC$ угол $C$ равен $90^\\circ$, $AC = 4.8$, $\\sin A = \\frac{7}{25}$. Найдите $AB$.',
        maxScore: 1,
        correctAnswer: '5',
      },
      {
        number: 6,
        title: 'Задание 6: Производная и касательная',
        description: 'Прямая $y = 7x - 5$ параллельна касательной к графику функции $f(x) = x^2 + 6x - 8$. Найдите абсциссу точки касания.',
        maxScore: 1,
        correctAnswer: '0.5',
      },
      {
        number: 13,
        title: 'Задание 13: Уравнение с тригонометрией (Развёрнутый ответ)',
        description: 'а) Решите уравнение $2\\cos^2 x - 3\\sin x = 0$.\nб) Найдите все корни на отрезке $[\\pi; \\frac{5\\pi}{2}]$.',
        maxScore: 2,
        isPartTwo: true,
        criteria: '2 балла: Обоснованно получены верные ответы в обоих пунктах.\n1 балл: Обоснованно получен верный ответ в пункте а, ИЛИ получен неверный ответ из-за вычислительной ошибки в п. б при верном п. а.\n0 баллов: Решение не удовлетворяет указанным критериям.',
        solution: 'а) x = π/6 + 2πk, x = 5π/6 + 2πk. б) x = 13π/6, 17π/6.',
      },
      {
        number: 14,
        title: 'Задание 14: Стереометрия (Развёрнутый ответ)',
        description: 'В правильной треугольной призме $ABCA_1B_1C_1$ ребра равны 2. Найдите расстояние между $AB_1$ и $BC_1$.',
        maxScore: 3,
        isPartTwo: true,
        criteria: '3 балла: Обоснованно получен верный ответ.\n2 балла: Верно построен чертеж и найден метод, но допущена вычислительная ошибка.\n1 балл: Верно доказано геометрическое свойство расположения прямых.\n0 баллов: Иное.',
        solution: 'Расстояние равно 2√21 / 7.',
      },
      {
        number: 18,
        title: 'Задание 18: Уравнение с параметром (Развёрнутый ответ)',
        description: 'Найдите все $a$, при которых система $|x| + |y| = 4$ и $(x - a)^2 + (y - a)^2 = 4$ имеет ровно 4 решения.',
        maxScore: 4,
        isPartTwo: true,
        criteria: '4 балла: Обоснованно получен верный ответ a ∈ [-2√2; 2√2].\n3 балла: С помощью верного рассуждения получены граничные точки, но концы интервала определены неточно.\n2 балла: Верно выполнено геометрическое построение ромба и окружности, найдены условия касания.\n1 балл: Задача сведена к исследованию взаимного расположения фигур.\n0 баллов: Иное.',
        solution: 'Ответ: [-2√2; 2√2].',
      },
    ],
  },
  {
    id: 'var-phys-1',
    title: 'ЕГЭ 2026: Тренировочный вариант по физике',
    subject: 'physics',
    examType: 'ЕГЭ',
    timeLimitMinutes: 235,
    description: 'Вариант по физике с физическим калькулятором (константы, тригонометрия, степени). Первая часть проверяется автоматически, расчётная часть с критериями.',
    maxPrimaryScore: 45,
    createdAt: '2026-09-30',
    assignedStudentIds: [],
    tasks: [
      {
        number: 1,
        title: 'Задание 1: Кинематика',
        description: 'Материальная точка движется прямолинейно с постоянным ускорением $a = 2$ м/с². Начальная скорость $v_0 = 4$ м/с. Какой путь пройдет точка за $t = 3$ с?',
        maxScore: 1,
        correctAnswer: '21',
      },
      {
        number: 12,
        title: 'Задание 12: МКТ и Термодинамика',
        description: 'В цилиндре под поршнем находится 2 моль идеального газа. При изобарном нагревании газ совершил работу $A = 1662$ Дж. На сколько кельвинов увеличилась температура газа?',
        maxScore: 1,
        correctAnswer: '100',
      },
      {
        number: 16,
        title: 'Задание 16: Электродинамика',
        description: 'Проводник длиной $L = 0.5$ м движется со скоростью $v = 10$ м/с в поле $B = 0.4$ Тл. Найдите разность потенциалов на концах в вольтах.',
        maxScore: 1,
        correctAnswer: '2',
      },
      {
        number: 21,
        title: 'Задание 21: Качественная задача (Развёрнутый ответ)',
        description: 'В замкнутую катушку вдвигают постоянный магнит северным полюсом. Каково направление индукционного тока? Объясните на основе правила Ленца.',
        maxScore: 3,
        isPartTwo: true,
        criteria: '3 балла: Дан правильный ответ и приведено исчерпывающее объяснение по правилу Ленца.\n2 балла: Указано верное направление, но есть неточности в обосновании магнитного потока.\n1 балл: Указан закон электромагнитной индукции, но не сделан вывод.\n0 баллов: Неверный ответ.',
        solution: 'Магнитный поток через катушку растет. По правилу Ленца индукционный ток создает поле B_i против внешнего поля. Ток течет по часовой стрелке со стороны магнита.',
      },
    ],
  },
  {
    id: 'var-rus-1',
    title: 'ЕГЭ 2026: Вариант по русскому языку',
    subject: 'russian',
    examType: 'ЕГЭ',
    timeLimitMinutes: 210,
    description: 'Тестовая часть по нормам языка (ударения, паронимы, синтаксис) и сочинение-рассуждение по критериям ФИПИ.',
    maxPrimaryScore: 50,
    createdAt: '2026-10-01',
    assignedStudentIds: [],
    tasks: [
      {
        number: 4,
        title: 'Задание 4: Орфоэпические нормы (ударения)',
        description: 'Укажите варианты, где верно выделена буква ударного гласного:\n1) тОрты  2) закупОренный  3) звонИт  4) красИвее  5) бухгАлтеров',
        maxScore: 1,
        correctAnswer: '1345',
      },
      {
        number: 5,
        title: 'Задание 5: Паронимы',
        description: 'В одном из предложений допущена ошибка в употреблении паронима. Исправьте ошибку, подобрав правильный пароним к слову ЭКОНОМИЧЕСКИЙ (в предложении: "Мы купили новый ЭКОНОМИЧЕСКИЙ автомобиль").',
        maxScore: 1,
        correctAnswer: 'экономичный',
      },
      {
        number: 16,
        title: 'Задание 16: Пунктуация в сложном предложении',
        description: 'Укажите предложения, где ставится ОДНА запятая (запишите номера):\n1) На рассвете подул ветер и побежала рябь.\n2) Солнце грело жарко но ласково и ветерок шевелил траву.\n3) В саду росли как яблони так и груши.',
        maxScore: 1,
        correctAnswer: '23',
      },
      {
        number: 27,
        title: 'Задание 27: Сочинение-рассуждение (Критерии К1-К12)',
        description: 'Напишите сочинение по прочитанному тексту. Сформулируйте одну из проблем, приведите два примера-иллюстрации из текста, обоснуйте собственную позицию. Объём — не менее 150 слов.',
        maxScore: 21,
        isPartTwo: true,
        criteria: 'Максимум 21 первичный балл:\n• К1 (Формулировка проблемы): 1 б.\n• К2 (Комментарий с 2 примерами и связью): 3 б.\n• К3 (Позиция автора): 1 б.\n• К4 (Своя позиция с обоснованием): 1 б.\n• К5 (Смысловая цельность): 2 б.\n• К6 (Точность речи): 1 б.\n• К7-К10 (Орфография, пунктуация, грамматика, речь): до 11 б.\n• К11-К12 (Этика, факты): 2 б.',
        solution: 'Оцените своё сочинение по критериям К1-К12.',
      },
    ],
  },
];

export const INITIAL_XP_REWARDS: XPReward[] = [
  {
    id: 'reward-cheat-sheet',
    title: 'Эксклюзивная шпаргалка от Романа Михайловича по стереометрии и параметрам',
    description: 'PDF-гайд с секретными фишками, готовыми теоремами и разбором ключевых конструкций, которых нет в школьных учебниках.',
    costXP: 250,
    category: 'materials',
    icon: 'BookOpen',
    secretContent: 'Ссылка на закрытый Google Drive со шпаргалкой и шаблонами решений: https://booktutor.ru/materials/secrets-geom-params-maltsev.pdf',
  },
  {
    id: 'reward-deadline-pass',
    title: 'Билет «Продление дедлайна на 48 часов»',
    description: 'Однократное право сдать домашнее задание на 2 дня позже установленного срока без потери баллов за дисциплину.',
    costXP: 400,
    category: 'privilege',
    icon: 'Clock',
    secretContent: 'Промокод для чата с Романом Михайловичем: #DEADLINE_EXTEND_48H (отправьте в диалог)',
  },
  {
    id: 'reward-golden-status',
    title: 'Золотой статус в академическом рейтинге',
    description: 'Корона и золотая рамка вокруг вашего профиля, отображающаяся в рейтинге учеников и на дашборде.',
    costXP: 500,
    category: 'badge',
    icon: 'Crown',
    secretContent: 'Статус активирован! Роман Михайлович видит ваш золотой статус наставника.',
  },
  {
    id: 'reward-personal-video',
    title: 'Персональный видео-разбор сложной задачи вне урока',
    description: 'Роман Михайлович запишет личное видео с пошаговым объяснением любой непонятной вам задачи из КИМ.',
    costXP: 750,
    category: 'consultation',
    icon: 'Video',
    secretContent: 'Код на персональный разбор: #VIDEO_ANALYSIS_MALTSEV. Напишите номер задачи в чат преподавателю!',
  },
  {
    id: 'reward-express-consultation',
    title: 'Экспресс-консультация перед пробником (15 мин)',
    description: 'Персональный созвон в Яндекс.Телемост для настройки перед пробным экзаменом и снятия тревожности.',
    costXP: 1000,
    category: 'consultation',
    icon: 'Sparkles',
    secretContent: 'Код на бронь созвона: #EXPRESS_CALL_15. Согласуйте удобный слот через личный диалог.',
  },
  {
    id: 'reward-discount-10',
    title: 'Купон на 10% скидку на абонемент следующего месяца',
    description: 'Реальная экономия за ваше трудолюбие и регулярное решение заданий!',
    costXP: 2000,
    category: 'privilege',
    icon: 'Award',
    secretContent: 'Купон: #BOOKTUTOR_DISCOUNT_10. Передайте родителям для оплаты следующего расчетного периода.',
  },
];

export const SAMPLE_NOTEBOOK_PHOTO_1 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="800" height="1050">
  <rect width="800" height="1050" fill="#FAF9F5"/>
  <defs>
    <pattern id="grid1" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D1DDF0" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="800" height="1050" fill="url(#grid1)"/>
  <line x1="75" y1="0" x2="75" y2="1050" stroke="#F87171" stroke-width="1.5"/>

  <g font-family="'Caveat', 'Comic Sans MS', cursive, sans-serif" fill="#1E40AF">
    <text x="95" y="50" font-size="22" font-weight="bold">Домашняя работа: Параметры и тригонометрия</text>
    <text x="560" y="50" font-size="16" fill="#64748B">А. Смирнов 11 «А»</text>
    <text x="95" y="80" font-size="16" fill="#64748B">Дата сдачи: 20 октября</text>

    <!-- Task 1: Param -->
    <text x="95" y="130" font-size="20" font-weight="bold">№18. Система с параметром:</text>
    <text x="115" y="165" font-size="18">{ |x| + |y| = 4</text>
    <text x="115" y="195" font-size="18">{ (x - a)^2 + (y - a)^2 = 4</text>

    <text x="95" y="240" font-size="17">1) Первое уравнение задаёт квадрат с вершинами</text>
    <text x="115" y="270" font-size="17">(4, 0), (0, 4), (-4, 0), (0, -4). Стороны: |x| + |y| = 4.</text>
    
    <text x="95" y="315" font-size="17">2) Второе уравнение — семейство окружностей R = 2</text>
    <text x="95" y="345" font-size="17">с центром C(a, a) на диагонали y = x.</text>

    <!-- Coordinate sketch -->
    <g transform="translate(180, 385)">
      <line x1="0" y1="120" x2="360" y2="120" stroke="#1E293B" stroke-width="1.5"/>
      <line x1="180" y1="0" x2="180" y2="240" stroke="#1E293B" stroke-width="1.5"/>
      <text x="350" y="112" font-size="15" fill="#1E293B">x</text>
      <text x="188" y="18" font-size="15" fill="#1E293B">y</text>
      
      <!-- Square -->
      <polygon points="180,40 260,120 180,200 100,120" fill="none" stroke="#2563EB" stroke-width="2.5"/>
      
      <!-- Center line y = x -->
      <line x1="60" y1="240" x2="300" y2="0" stroke="#94A3B8" stroke-dasharray="4,4" stroke-width="1.5"/>
      
      <!-- Center circle -->
      <circle cx="180" cy="120" r="40" fill="none" stroke="#059669" stroke-width="2"/>
      <circle cx="236" cy="64" r="40" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-dasharray="3,3"/>
      <circle cx="124" cy="176" r="40" fill="none" stroke="#DC2626" stroke-width="1.5" stroke-dasharray="3,3"/>
      <text x="190" y="110" font-size="14" fill="#059669">4 точки</text>
    </g>

    <text x="95" y="670" font-size="17">3) Касание сторон квадрата: расстояние от центра (a, a)</text>
    <text x="95" y="700" font-size="17">до прямой x + y - 4 = 0:</text>
    <text x="115" y="735" font-size="18">d = |2a - 4| / √2 = 2  ⇒  |2a - 4| = 2√2</text>
    <text x="115" y="770" font-size="18">2a - 4 = ±2√2  ⇒  a = 2 ± √2</text>
    <text x="95" y="810" font-size="17">При -2√2 &lt;= a &lt;= 2√2 окружность пересекает ровно 4 стороны.</text>
    
    <text x="95" y="855" font-size="19" font-weight="bold" fill="#047857">Ответ: a ∈ [-2√2; 2√2]</text>

    <!-- Student note banner -->
    <rect x="90" y="895" width="620" height="90" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1" rx="4"/>
    <text x="105" y="925" font-size="16" fill="#B45309" font-weight="bold">Вопрос Роману Михайловичу:</text>
    <text x="105" y="955" font-size="15" fill="#92400E">Проверьте, пожалуйста, граничные значения a = ±2√2, правильно ли я исключил/включил концы?</text>
  </g>
</svg>`)}`;

export const SAMPLE_NOTEBOOK_PHOTO_2 = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <rect width="800" height="1000" fill="#FAF9F5"/>
  <defs>
    <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#D1DDF0" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="800" height="1000" fill="url(#grid2)"/>
  <line x1="75" y1="0" x2="75" y2="1000" stroke="#F87171" stroke-width="1.5"/>

  <g font-family="'Caveat', 'Comic Sans MS', cursive, sans-serif" fill="#1E40AF">
    <text x="95" y="50" font-size="20" font-weight="bold">Лист 2: №14 (Стереометрия)</text>
    <text x="95" y="90" font-size="17">Правильная треугольная призма ABCA₁B₁C₁, все рёбра = 2.</text>
    <text x="95" y="125" font-size="17">Найти расстояние между скрещивающимися AB₁ и BC₁.</text>

    <text x="95" y="175" font-size="18" font-weight="bold">Координатный метод:</text>
    <text x="115" y="210" font-size="17">Пусть B(0, 0, 0). Ось Oy направим вдоль BC, Oz вдоль BB₁.</text>
    <text x="115" y="245" font-size="17">Координаты вершин:</text>
    <text x="135" y="280" font-size="17">A(√3, 1, 0), B₁(0, 0, 2), C₁(0, 2, 2)</text>
    <text x="115" y="325" font-size="17">Вектор AB₁ = (-√3, -1, 2)</text>
    <text x="115" y="360" font-size="17">Вектор BC₁ = (0, 2, 2)</text>

    <text x="95" y="415" font-size="17">Ищем вектор нормали n = (x, y, z):</text>
    <text x="115" y="450" font-size="17">n ⊥ AB₁  ⇒  -√3 x - y + 2z = 0</text>
    <text x="115" y="485" font-size="17">n ⊥ BC₁  ⇒  2y + 2z = 0  ⇒  y = -z</text>
    <text x="115" y="525" font-size="17">Пусть z = √3, тогда y = -√3, x = 3√3 / √3 = 3.</text>
    <text x="115" y="565" font-size="17">Нормаль: n = (3, -√3, √3), |n| = √(9 + 3 + 3) = √15.</text>

    <text x="95" y="620" font-size="17">Расстояние между скрещивающимися прямыми:</text>
    <text x="115" y="660" font-size="18">d = |(AB₁ · n)| ... точнее d = |(BA · n)| / |n|</text>
    <text x="115" y="700" font-size="19" font-weight="bold">d = 2√21 / 7</text>

    <text x="95" y="760" font-size="20" font-weight="bold" fill="#047857">Ответ: 2√21 / 7</text>
  </g>
</svg>`)}`;

export const INITIAL_HOMEWORKS: Homework[] = [
  {
    id: 'hw-1',
    studentId: 'student-1',
    subject: 'math',
    title: 'Домашняя работа №1: Параметры и тригонометрия',
    assignedDate: '2026-10-15',
    dueDate: '2026-10-22',
    status: 'submitted',
    submittedAt: '2026-10-20T19:45:00Z',
    studentComment: 'Решил задачи №18 и №14 в тетради, отсканировал и прикрепил оба листа с чертежами. В №18 построил квадрат и окружность, в №14 использовал векторно-координатный метод. Посмотрите, пожалуйста, оформление для эксперта ЕГЭ.',
    photos: [SAMPLE_NOTEBOOK_PHOTO_1, SAMPLE_NOTEBOOK_PHOTO_2],
    tasks: [
      {
        taskId: 'task-math-1',
        studentAnswer: '[-2√2; 2√2]',
        isCorrect: true,
        score: 4,
        maxScore: 4,
        tutorComment: '',
      },
      {
        taskId: 'task-math-2',
        studentAnswer: '2√21/7',
        isCorrect: true,
        score: 3,
        maxScore: 3,
        tutorComment: '',
      },
      {
        taskId: 'task-math-3',
        studentAnswer: 'а) x = pi/6 + 2pik, 5pi/6 + 2pik; б) 13pi/6',
        isCorrect: true,
        score: 2,
        maxScore: 2,
        tutorComment: '',
      },
    ],
  },
  {
    id: 'hw-2',
    studentId: 'student-1',
    subject: 'cs',
    title: 'КЕГЭ №24-27: Алгоритмы обработки строк и файлов',
    assignedDate: '2026-10-18',
    dueDate: '2026-10-25',
    status: 'assigned',
    tasks: [
      {
        taskId: 'task-cs-1',
        studentAnswer: '',
        maxScore: 1,
      },
      {
        taskId: 'task-cs-2',
        studentAnswer: '',
        maxScore: 1,
      },
    ],
  },
  {
    id: 'hw-3',
    studentId: 'student-2',
    subject: 'physics',
    title: 'ДЗ №2: Электромагнитная индукция и законы Фарадея',
    assignedDate: '2026-10-14',
    dueDate: '2026-10-19',
    status: 'graded',
    submittedAt: '2026-10-18T16:20:00Z',
    grade: 5,
    mark: 5,
    earnedPoints: 5,
    totalPoints: 5,
    studentComment: 'Задачи решил, формулу Томсона применил для колебательного контура.',
    tutorFeedback: 'Отличная работа! Дано записано аккуратно, перевод в СИ выполнен без ошибок, все законы названы верно. Оценка «5» (Отлично).',
    tasks: [
      {
        taskId: 'task-math-1',
        studentAnswer: 'Ответ сошёлся',
        score: 1,
        maxScore: 1,
        isCorrect: true,
        tutorComment: 'Всё верно!',
      },
    ],
  },
];

export const INITIAL_TOPIC_PROGRESS: ExamTopicProgress[] = [
  { topicId: 'top-1', topicName: 'Уравнения с параметрами (№18)', subject: 'math', masteryPercentage: 0, tasksSolved: 0, tasksTotal: 18 },
  { topicId: 'top-2', topicName: 'Стереометрия (№14)', subject: 'math', masteryPercentage: 0, tasksSolved: 0, tasksTotal: 12 },
  { topicId: 'top-3', topicName: 'Электромагнитная индукция', subject: 'physics', masteryPercentage: 0, tasksSolved: 0, tasksTotal: 24 },
  { topicId: 'top-4', topicName: 'МКТ и Термодинамика', subject: 'physics', masteryPercentage: 0, tasksSolved: 0, tasksTotal: 16 },
  { topicId: 'top-5', topicName: 'Символьные строки на Python (№24)', subject: 'cs', masteryPercentage: 0, tasksSolved: 0, tasksTotal: 20 },
  { topicId: 'top-6', topicName: 'Орфоэпия и паронимы (№4-5)', subject: 'russian', masteryPercentage: 0, tasksSolved: 0, tasksTotal: 38 },
];

export const INITIAL_EXAM_NUMBERS: ExamNumberProgress[] = [
  { examNumber: 'ЕГЭ №18', title: 'Параметры', subject: 'math', status: 'not_started', accuracy: 0, primaryPoints: 4 },
  { examNumber: 'ЕГЭ №14', title: 'Стереометрия', subject: 'math', status: 'not_started', accuracy: 0, primaryPoints: 3 },
  { examNumber: 'ЕГЭ №13', title: 'Уравнения', subject: 'math', status: 'not_started', accuracy: 0, primaryPoints: 2 },
  { examNumber: 'ЕГЭ №16', title: 'Электродинамика', subject: 'physics', status: 'not_started', accuracy: 0, primaryPoints: 2 },
  { examNumber: 'КЕГЭ №24', title: 'Строки Python', subject: 'cs', status: 'not_started', accuracy: 0, primaryPoints: 1 },
  { examNumber: 'ЕГЭ №4', title: 'Орфоэпия', subject: 'russian', status: 'not_started', accuracy: 0, primaryPoints: 1 },
];

export const INITIAL_INFORMAL_NOTES: InformalNote[] = [];

export const INITIAL_CHAT_MESSAGES: any[] = [];
