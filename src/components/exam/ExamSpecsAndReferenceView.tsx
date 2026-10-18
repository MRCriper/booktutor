import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Award,
  CheckCircle2,
  FileText,
  Sliders,
  Sparkles,
  ExternalLink,
  Search,
  ChevronRight,
  Flame,
  Scale,
  Zap,
} from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';
import { Subject, ExamKind } from '../../types';

type TabType = 'conversion' | 'criteria' | 'cheat_sheets';

// 2026 Official Primary to Secondary Score Mapping Tables
const SCORE_SCALES: Record<string, { maxPrimary: number; minPassing: number; goodScore: number; scale: Record<number, number> }> = {
  'math_ege': {
    maxPrimary: 32,
    minPassing: 27, // 6 primary
    goodScore: 70, // ~14 primary
    scale: {
      0: 0, 1: 6, 2: 11, 3: 17, 4: 22, 5: 27, 6: 34, 7: 40, 8: 46, 9: 52,
      10: 58, 11: 64, 12: 66, 13: 68, 14: 70, 15: 72, 16: 74, 17: 76, 18: 78,
      19: 80, 20: 82, 21: 84, 22: 86, 23: 88, 24: 90, 25: 92, 26: 94, 27: 95,
      28: 96, 29: 97, 30: 98, 31: 99, 32: 100,
    },
  },
  'physics_ege': {
    maxPrimary: 45,
    minPassing: 36, // ~11 primary
    goodScore: 70, // ~27 primary
    scale: {
      0: 0, 1: 4, 2: 8, 3: 12, 4: 15, 5: 19, 6: 23, 7: 26, 8: 30, 9: 33,
      10: 36, 11: 38, 12: 40, 13: 42, 14: 44, 15: 46, 16: 48, 17: 50, 18: 52,
      19: 54, 20: 56, 21: 58, 22: 60, 23: 62, 24: 64, 25: 66, 26: 68, 27: 70,
      28: 72, 29: 74, 30: 76, 31: 78, 32: 80, 33: 82, 34: 84, 35: 86, 36: 88,
      37: 90, 38: 92, 39: 94, 40: 95, 41: 96, 42: 97, 43: 98, 44: 99, 45: 100,
    },
  },
  'cs_ege': {
    maxPrimary: 29,
    minPassing: 40, // 6-7 primary
    goodScore: 72, // 16 primary
    scale: {
      0: 0, 1: 7, 2: 14, 3: 20, 4: 27, 5: 34, 6: 40, 7: 43, 8: 46, 9: 48,
      10: 51, 11: 54, 12: 56, 13: 59, 14: 62, 15: 67, 16: 72, 17: 75, 18: 78,
      19: 80, 20: 83, 21: 85, 22: 88, 23: 90, 24: 93, 25: 95, 26: 97, 27: 98,
      28: 99, 29: 100,
    },
  },
  'russian_ege': {
    maxPrimary: 50,
    minPassing: 36, // ~16 primary
    goodScore: 70, // ~34 primary
    scale: {
      0: 0, 1: 3, 2: 5, 3: 8, 4: 10, 5: 13, 6: 15, 7: 18, 8: 20, 9: 23,
      10: 25, 11: 28, 12: 30, 13: 33, 14: 35, 15: 38, 16: 40, 17: 42, 18: 43,
      19: 45, 20: 46, 21: 48, 22: 50, 23: 51, 24: 53, 25: 55, 26: 56, 27: 58,
      28: 60, 29: 61, 30: 63, 31: 65, 32: 66, 33: 68, 34: 70, 35: 72, 36: 73,
      37: 75, 38: 77, 39: 79, 40: 81, 41: 83, 42: 86, 43: 89, 44: 91, 45: 94,
      46: 97, 47: 98, 48: 99, 49: 100, 50: 100,
    },
  },
};

// OGE Grade Thresholds (2/3/4/5)
const OGE_SCALES: Record<string, { max: number; grades: { grade: number; range: string; min: number; desc: string }[] }> = {
  'math_oge': {
    max: 31,
    grades: [
      { grade: 2, range: '0–7 баллов', min: 0, desc: 'Неудовлетворительно (экзамен не сдан)' },
      { grade: 3, range: '8–14 баллов', min: 8, desc: 'Удовлетворительно (обязательно не менее 2 баллов по геометрии)' },
      { grade: 4, range: '15–21 балл', min: 15, desc: 'Хорошо (обязательно не менее 2 баллов по геометрии)' },
      { grade: 5, range: '22–31 балл', min: 22, desc: 'Отлично (обязательно не менее 2 баллов по геометрии)' },
    ],
  },
  'physics_oge': {
    max: 45,
    grades: [
      { grade: 2, range: '0–10 баллов', min: 0, desc: 'Неудовлетворительно' },
      { grade: 3, range: '11–22 балла', min: 11, desc: 'Удовлетворительно' },
      { grade: 4, range: '23–34 балла', min: 23, desc: 'Хорошо (рекомендованный ориентир в профильные классы: от 31 балла)' },
      { grade: 5, range: '35–45 баллов', min: 35, desc: 'Отлично (уверенное владение)' },
    ],
  },
  'cs_oge': {
    max: 19,
    grades: [
      { grade: 2, range: '0–4 балла', min: 0, desc: 'Неудовлетворительно' },
      { grade: 3, range: '5–10 баллов', min: 5, desc: 'Удовлетворительно' },
      { grade: 4, range: '11–16 баллов', min: 11, desc: 'Хорошо (в профильные IT-классы от 14 баллов)' },
      { grade: 5, range: '17–19 баллов', min: 17, desc: 'Отлично' },
    ],
  },
  'russian_oge': {
    max: 33,
    grades: [
      { grade: 2, range: '0–14 баллов', min: 0, desc: 'Неудовлетворительно' },
      { grade: 3, range: '15–22 балла', min: 15, desc: 'Удовлетворительно' },
      { grade: 4, range: '23–28 баллов', min: 23, desc: 'Хорошо (не менее 4 баллов за грамотность ГК1-ГК4)' },
      { grade: 5, range: '29–33 балла', min: 29, desc: 'Отлично (не менее 6 баллов за грамотность)' },
    ],
  },
};

// Part 2 Official FIPI Criteria Breakdown (Checked and verified)
const FIPI_CRITERIA_DATA = [
  {
    subject: 'math',
    exam: 'ЕГЭ (Профиль)',
    tasks: [
      {
        number: '13',
        title: 'Уравнение (тригонометрия, логарифмы, показательные)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Обоснованно получены верные ответы в обоих пунктах (а и б).' },
          { pts: 1, desc: 'Обоснованно получен верный ответ в п. а, ИЛИ получен неверный ответ из-за вычислительной ошибки в п. б при верном решении п. а.' },
          { pts: 0, desc: 'Решение не соответствует ни одному из вышеперечисленных критериев.' },
        ],
      },
      {
        number: '14',
        title: 'Стереометрическая задача (сечения, расстояния, углы в пространстве)',
        maxPts: 3,
        points: [
          { pts: 3, desc: 'Обоснованно получены верные ответы в обоих пунктах (а — доказательство, б — вычисление).' },
          { pts: 2, desc: 'Имеется верное доказательство утверждения пункта а, и при вычислении в пункте б допущена арифметическая ошибка, завершившаяся получением ответа.' },
          { pts: 1, desc: 'Имеется верное доказательство утверждения пункта а, ИЛИ обоснованно получен верный ответ в пункте б.' },
          { pts: 0, desc: 'Решение не соответствует критериям на 1, 2 или 3 балла.' },
        ],
      },
      {
        number: '15',
        title: 'Неравенство (дробно-рациональное, логарифмическое, с модулем)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Обоснованно получен верный ответ для числового множества решений.' },
          { pts: 1, desc: 'Обоснованно получен ответ, отличающийся от верного включением/исключением граничных точек, ИЛИ допущена вычислительная ошибка с верной логикой.' },
          { pts: 0, desc: 'Решение не соответствует критериям выше.' },
        ],
      },
      {
        number: '16',
        title: 'Экономическая задача (кредиты, дифференцированные платежи, вклады, оптимизация)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Обоснованно получен верный ответ, построена математическая модель, проведены вычисления.' },
          { pts: 1, desc: 'Верно построена математическая модель, решение сведено к исследованию/вычислениям, но вычисления не завершены или допущена арифметическая ошибка.' },
          { pts: 0, desc: 'Модель не построена или содержит принципиальные ошибки.' },
        ],
      },
      {
        number: '17',
        title: 'Планиметрическая задача повышенной сложности',
        maxPts: 3,
        points: [
          { pts: 3, desc: 'Обоснованно получены верные ответы в обоих пунктах (а — доказательство, б — вычисление).' },
          { pts: 2, desc: 'Верно доказан п. а, и при решении п. б допущена вычислительная ошибка.' },
          { pts: 1, desc: 'Верно выполнен п. а, ИЛИ обоснованно решён п. б с опорой на верные геометрические свойства.' },
          { pts: 0, desc: 'Решение не соответствует ни одному из критериев выше.' },
        ],
      },
      {
        number: '18',
        title: 'Задача с параметром (графический / аналитический метод)',
        maxPts: 4,
        points: [
          { pts: 4, desc: 'Обоснованно получен верный ответ для всех значений параметра $a$.' },
          { pts: 3, desc: 'С помощью верного метода получены верные значения параметра, но неверно включены/исключены граничные значения, ИЛИ допущена одна вычислительная ошибка.' },
          { pts: 2, desc: 'Верно построена геометрическая картина / аналитическая модель, найдены ключевые точки касания и критические значения.' },
          { pts: 1, desc: 'Задача сведена к исследованию условий, сделан содержательный продвинутый шаг в решении.' },
          { pts: 0, desc: 'Решение не начато или шаги не приводят к продвижению.' },
        ],
      },
      {
        number: '19',
        title: 'Числа и их свойства (дискретная математика, теория чисел)',
        maxPts: 4,
        points: [
          { pts: 4, desc: 'Обоснованно решены все пункты: а, б, в.' },
          { pts: 3, desc: 'Верно решены пункты а и в, ИЛИ пункты б и в.' },
          { pts: 2, desc: 'Верно решены пункты а и б, ИЛИ только пункт в.' },
          { pts: 1, desc: 'Верно решён только пункт а, ИЛИ только пункт б.' },
          { pts: 0, desc: 'Ответы без обоснования или неверные.' },
        ],
      },
    ],
  },
  {
    subject: 'physics',
    exam: 'ЕГЭ (Физика)',
    tasks: [
      {
        number: '21',
        title: 'Качественная задача с развёрнутым ответом',
        maxPts: 3,
        points: [
          { pts: 3, desc: 'Дан правильный ответ и приведено исчерпывающее верное физическое рассуждение с обязательным указанием законов и формул.' },
          { pts: 2, desc: 'Дан верный ответ, приведены необходимые законы, но в рассуждении есть логический пробел или неточность.' },
          { pts: 1, desc: 'Дан правильный ответ, но рассуждение неполное, ИЛИ ответ неверен при правильно указанных фундаментальных законах.' },
          { pts: 0, desc: 'Ответ неверен, законы не указаны или применены неверно.' },
        ],
      },
      {
        number: '22',
        title: 'Расчётная задача повышенного уровня (механика / МКТ)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Записаны формулы, выражающие физические законы, проведены математические преобразования, получен верный числовой ответ с единицами измерения.' },
          { pts: 1, desc: 'Правильно записаны необходимые законы, но допущена вычислительная ошибка, ИЛИ не указаны единицы измерения.' },
          { pts: 0, desc: 'Исходные законы не записаны или записаны с грубыми ошибками.' },
        ],
      },
      {
        number: '23',
        title: 'Расчётная задача повышенного уровня (электродинамика / квантовая физика)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Записаны все исходные законы, математические преобразования выполнены верно, получен числовой ответ с единицами измерения.' },
          { pts: 1, desc: 'Записаны исходные уравнения, но допущена ошибка в алгебраических преобразованиях или арифметике.' },
          { pts: 0, desc: 'Решение не начато или законы указаны неверно.' },
        ],
      },
      {
        number: '24',
        title: 'Расчётная задача высокого уровня сложности (МКТ и термодинамика)',
        maxPts: 3,
        points: [
          { pts: 3, desc: 'Записаны все формулы и законы, проведены преобразования в общем виде, получен верный числовой ответ с размерностью.' },
          { pts: 2, desc: 'Верно записаны исходные уравнения, но допущена одна ошибка в математических преобразованиях или не указаны размерности.' },
          { pts: 1, desc: 'Записаны не все необходимые уравнения, но сделан существенный содержательный шаг к решению.' },
          { pts: 0, desc: 'Иное.' },
        ],
      },
      {
        number: '25',
        title: 'Расчётная задача высокого уровня сложности (электродинамика)',
        maxPts: 3,
        points: [
          { pts: 3, desc: 'Полное верное решение: законы Ома, Фарадея, электростатики/магнетизма записаны верно, получен точный ответ.' },
          { pts: 2, desc: 'Записаны все законы, допущена арифметическая погрешность или описка в вычислениях.' },
          { pts: 1, desc: 'Записаны формулы, применимые к условию задачи, но решение не завершено.' },
          { pts: 0, desc: 'Иное.' },
        ],
      },
      {
        number: '26',
        title: 'Задача по механике с обязательным обоснованием применимости законов',
        maxPts: 4,
        points: [
          { pts: 4, desc: '3 балла за полное верное математическое решение + 1 балл за корректное физическое обоснование применимости законов Ньютона, ИСО и закона сохранения энергии/импульса.' },
          { pts: 3, desc: 'Решение задачи полностью верное, но обоснование не приведено, содержит ошибки или логические нестыковки.' },
          { pts: 2, desc: 'Обоснование приведено верно, но в расчётной части решения допущена арифметическая ошибка.' },
          { pts: 1, desc: 'Записаны исходные уравнения движения и законы сохранения, сделан начальный шаг.' },
          { pts: 0, desc: 'Иное.' },
        ],
      },
    ],
  },
  {
    subject: 'cs',
    exam: 'ЕГЭ (КЕГЭ Информатика)',
    tasks: [
      {
        number: '26',
        title: 'Обработка числовых последовательностей и жадные алгоритмы (файл 26.txt)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Получены верные числовые значения в обоих полях ответа (автоматическая проверка компьютерной системы).' },
          { pts: 1, desc: 'Верно получено только первое число ИЛИ только второе число из пары.' },
          { pts: 0, desc: 'Оба числа неверны или поле ответа пустое.' },
        ],
      },
      {
        number: '27',
        title: 'Анализ числовых последовательностей с оптимизацией по времени и памяти (27-A и 27-B)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Получены верные числовые ответы для обоих файлов входных данных (файл А и файл B).' },
          { pts: 1, desc: 'Верно решён только файл А (допускается неэффективный алгоритм перебора $O(N^2)$), но не решён файл B.' },
          { pts: 0, desc: 'Ответы для обоих файлов неверны.' },
        ],
      },
    ],
  },
  {
    subject: 'russian',
    exam: 'ЕГЭ (Русский язык)',
    tasks: [
      {
        number: '27',
        title: 'Сочинение-рассуждение по прочитанному тексту (Критерии К1–К12 ФИПИ)',
        maxPts: 21,
        points: [
          { pts: 1, desc: 'К1: Формулировка проблемы исходного текста (1 балл).' },
          { pts: 3, desc: 'К2: Комментарий к сформулированной проблеме: 2 примера-иллюстрации (по 1 б.) + анализ смысловой связи между ними (1 б.). Всего до 3 баллов.' },
          { pts: 1, desc: 'К3: Отражение позиции автора (рассказчика) исходного текста (1 балл).' },
          { pts: 1, desc: 'К4: Отношение к позиции автора по проблеме с обоснованием своей точки зрения (1 балл).' },
          { pts: 2, desc: 'К5: Смысловая цельность, речевая связность и последовательность изложения (2 балла).' },
          { pts: 1, desc: 'К6: Богатство и выразительность речи (1 балл).' },
          { pts: 3, desc: 'К7: Соблюдение орфографических норм (до 3 баллов: 0 ошибок = 3 б., 1-2 ошибки = 2 б., 3-4 ошибки = 1 б.).' },
          { pts: 3, desc: 'К8: Соблюдение пунктуационных норм (до 3 баллов: 0 ошибок = 3 б., 1-2 ошибки = 2 б., 3-4 ошибки = 1 б.).' },
          { pts: 2, desc: 'К9: Соблюдение грамматических норм (до 2 баллов: 0 ошибок = 2 б., 1-2 ошибки = 1 б.).' },
          { pts: 2, desc: 'К10: Соблюдение речевых норм (до 2 баллов: 0-1 ошибка = 2 б., 2-3 ошибки = 1 б.).' },
          { pts: 1, desc: 'К11: Соблюдение этических норм (1 балл).' },
          { pts: 1, desc: 'К12: Соблюдение фактологической точности в фоновом материале (1 балл).' },
        ],
      },
    ],
  },
  {
    subject: 'math',
    exam: 'ОГЭ (Математика, 9 класс)',
    tasks: [
      {
        number: '20',
        title: 'Алгебраические выражения, уравнения, системы уравнений',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Обоснованно получен верный ответ, приведены все необходимые преобразования.' },
          { pts: 1, desc: 'С помощью верного метода решение доведено до конца, но допущена одна арифметическая ошибка.' },
          { pts: 0, desc: 'Другие случаи, не соответствующие указанным критериям.' },
        ],
      },
      {
        number: '21',
        title: 'Текстовая задача на движение, работу или сплавы/концентрацию',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Ход решения верный, все шаги обоснованы, получен верный числовой ответ с единицами измерения.' },
          { pts: 1, desc: 'Ход решения правильный, составлено верное уравнение, но допущена вычислительная ошибка.' },
          { pts: 0, desc: 'Уравнение не составлено или составлено неверно.' },
        ],
      },
      {
        number: '22',
        title: 'Построение кусочно-заданного графика и исследование параметра $m$',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'График функции построен верно, верно найдены все значения параметра $m$.' },
          { pts: 1, desc: 'График построен верно, но значения параметра найдены неверно или не полностью.' },
          { pts: 0, desc: 'График построен неверно или отсутствует.' },
        ],
      },
      {
        number: '23',
        title: 'Геометрическая задача на вычисление (углы, отрезки, площади)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Ход рассуждений понятен, все геометрические свойства и теоремы применены верно, получен точный ответ.' },
          { pts: 1, desc: 'Ход решения верный, все шаги логичны, но допущена вычислительная ошибка.' },
          { pts: 0, desc: 'Иное.' },
        ],
      },
      {
        number: '24',
        title: 'Геометрическая задача на доказательство свойств фигур',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Доказательство верное, все шаги логически обоснованы со ссылками на теоремы.' },
          { pts: 1, desc: 'Доказательство в целом верное, но содержит негрубые логические пробелы.' },
          { pts: 0, desc: 'Доказательство не содержит верных продвижений.' },
        ],
      },
      {
        number: '25',
        title: 'Геометрическая задача повышенной сложности',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Ход решения правильный, рассуждения обоснованы, получен верный ответ.' },
          { pts: 1, desc: 'Ход решения верный, но допущена вычислительная ошибка.' },
          { pts: 0, desc: 'Иное.' },
        ],
      },
    ],
  },
  {
    subject: 'physics',
    exam: 'ОГЭ (Физика, 9 класс)',
    tasks: [
      {
        number: '17',
        title: 'Экспериментальное задание на лабораторном оборудовании',
        maxPts: 3,
        points: [
          { pts: 3, desc: 'Сделан рисунок установки, записаны формулы, проведены прямые измерения с учётом погрешности, получен верный числовой результат.' },
          { pts: 2, desc: 'Правильно выполнены 3 из 4 элементов задания.' },
          { pts: 1, desc: 'Правильно выполнены 2 элемента задания.' },
          { pts: 0, desc: 'Иное.' },
        ],
      },
      {
        number: '20-21',
        title: 'Качественные задачи по тексту физического содержания и физическим явлениям',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Дан верный ответ и приведено исчерпывающее объяснение со ссылкой на законы физики.' },
          { pts: 1, desc: 'Дан верный ответ, но объяснение неполное или содержит неточности.' },
          { pts: 0, desc: 'Ответ неверен.' },
        ],
      },
      {
        number: '22-23',
        title: 'Расчётные задачи высокого уровня с развёрнутым решением',
        maxPts: 3,
        points: [
          { pts: 3, desc: 'Записано краткое условие (Дано), необходимые законы, преобразования и получен числовой ответ с размерностью.' },
          { pts: 2, desc: 'Записаны законы, но допущена арифметическая ошибка или отсутствует перевод в СИ.' },
          { pts: 1, desc: 'Записаны только исходные формулы без полного решения.' },
          { pts: 0, desc: 'Иное.' },
        ],
      },
    ],
  },
  {
    subject: 'cs',
    exam: 'ОГЭ (Информатика, 9 класс)',
    tasks: [
      {
        number: '13',
        title: 'Создание презентации (13.1) или форматирование текста (13.2)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Файл оформлен в строгом соответствии с требованиями структуры, шрифта и макета.' },
          { pts: 1, desc: 'Допущено не более 2 ошибок в форматировании или расположении элементов.' },
          { pts: 0, desc: 'Допущены грубые нарушения структуры.' },
        ],
      },
      {
        number: '14',
        title: 'Обработка числовых массивов в электронных таблицах (Excel/Calc)',
        maxPts: 3,
        points: [
          { pts: 3, desc: 'Верно выполнены все 3 задания: вычислены 2 формулы и построена диаграмма.' },
          { pts: 2, desc: 'Верно выполнены любые 2 задания из трёх.' },
          { pts: 1, desc: 'Верно выполнено 1 задание из трёх.' },
          { pts: 0, desc: 'Все задания выполнены неверно.' },
        ],
      },
      {
        number: '15',
        title: 'Алгоритм для Исполнителя Робот (15.1) или программа на Python (15.2)',
        maxPts: 2,
        points: [
          { pts: 2, desc: 'Программа работает корректно на всех тестах, робот не разбивается.' },
          { pts: 1, desc: 'Допущена 1 ошибка (например, не закрашена одна клетка или неверный строгий знак сравнения).' },
          { pts: 0, desc: 'Программа не выполняет поставленную задачу.' },
        ],
      },
    ],
  },
  {
    subject: 'russian',
    exam: 'ОГЭ (Русский язык, 9 класс)',
    tasks: [
      {
        number: '1',
        title: 'Сжатое изложение по прослушанному тексту',
        maxPts: 7,
        points: [
          { pts: 7, desc: 'ИК1: содержание (2 б.) + ИК2: сжатие всех микротем (3 б.) + ИК3: смысловая цельность и связность (2 б.).' },
          { pts: 4, desc: 'Сжаты не все микротемы или допущены логические погрешности.' },
          { pts: 1, desc: 'Изложение с грубыми искажениями содержания.' },
          { pts: 0, desc: 'Иное.' },
        ],
      },
      {
        number: '13',
        title: 'Сочинение-рассуждение (13.1 лингвистическое, 13.2 по фразе или 13.3 на понятие)',
        maxPts: 9,
        points: [
          { pts: 9, desc: 'СК1: тезис (2 б.) + СК2: 2 аргумента-примера (3 б.) + СК3: связность (2 б.) + СК4: композиция (2 б.).' },
          { pts: 5, desc: 'Приведён только 1 аргумент или тезис не полностью доказан.' },
          { pts: 2, desc: 'Нарушена композиция и логика рассуждения.' },
          { pts: 0, desc: 'Иное.' },
        ],
      },
    ],
  },
];

// Reference Sheets Allowed during exam
const CHEAT_SHEET_DATA = [
  {
    category: 'Физика: Константы и справочные величины КИМ',
    items: [
      { label: 'Скорость света в вакууме', val: '$c = 3 \\cdot 10^8$ м/с' },
      { label: 'Гравитационная постоянная', val: '$G = 6.67 \\cdot 10^{-11}$ Н·м²/кг²' },
      { label: 'Ускорение свободного падения', val: '$g = 10$ м/с² (в КИМ ФИПИ округляется до 10)' },
      { label: 'Постоянная Планка', val: '$h = 6.63 \\cdot 10^{-34}$ Дж·с' },
      { label: 'Постоянная Больцмана', val: '$k = 1.38 \\cdot 10^{-23}$ Дж/К' },
      { label: 'Элементарный заряд', val: '$e = 1.6 \\cdot 10^{-19}$ Кл' },
      { label: 'Постоянная Авогадро', val: '$N_A = 6.02 \\cdot 10^{23}$ моль⁻¹' },
      { label: 'Газовая постоянная', val: '$R = 8.31$ Дж/(моль·К)' },
      { label: 'Электрическая постоянная', val: '$\\varepsilon_0 = 8.85 \\cdot 10^{-12}$ Ф/м' },
      { label: 'Плотность чистой воды', val: '$\\rho = 1000$ кг/м³' },
      { label: 'Удельная теплоёмкость воды', val: '$c_в = 4200$ Дж/(кг·К)' },
      { label: 'Удельная теплота плавления льда', val: '$\\lambda = 3.3 \\cdot 10^5$ Дж/кг' },
      { label: 'Удельная теплота парообразования воды', val: '$L = 2.3 \\cdot 10^6$ Дж/кг' },
    ],
  },
  {
    category: 'Математика: Официальные справочные формулы профильного ЕГЭ',
    items: [
      { label: 'Основное тригонометрическое тождество', val: '$\\sin^2 \\alpha + \\cos^2 \\alpha = 1$' },
      { label: 'Синус суммы и разности', val: '$\\sin(\\alpha \\pm \\beta) = \\sin\\alpha\\cos\\beta \\pm \\cos\\alpha\\sin\\beta$' },
      { label: 'Косинус суммы и разности', val: '$\\cos(\\alpha \\pm \\beta) = \\cos\\alpha\\cos\\beta \\mp \\sin\\alpha\\sin\\beta$' },
      { label: 'Косинус двойного угла', val: '$\\cos 2\\alpha = \\cos^2 \\alpha - \\sin^2 \\alpha = 2\\cos^2\\alpha - 1 = 1 - 2\\sin^2\\alpha$' },
      { label: 'Синус двойного угла', val: '$\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha$' },
      { label: 'Объём призмы и цилиндра', val: '$V = S_{осн} \\cdot h$' },
      { label: 'Объём пирамиды и конуса', val: '$V = \\frac{1}{3} S_{осн} \\cdot h$' },
      { label: 'Объём шара', val: '$V = \\frac{4}{3} \\pi R^3$' },
      { label: 'Площадь сферы', val: '$S = 4\\pi R^2$' },
      { label: 'Логарифм степени и произведения', val: '$\\log_a (xy) = \\log_a x + \\log_a y, \\quad \\log_a x^k = k \\log_a x$' },
    ],
  },
  {
    category: 'Русский язык: Орфоэпический минимум ФИПИ (Ключевые ловушки)',
    items: [
      { label: 'Глаголы прошедшего времени (на -А)', val: 'бралА, взялА, влилАсь, добралА, дождалАсь, занялА, заперлА, звалА, навралА, облилАсь, перелилА, понялА, рвалА. ИСКЛЮЧЕНИЯ: клАла, крАлась, послАла, слАла.' },
      { label: 'Глаголы на -ИТЬ', val: 'звонИт, звонИшь, звонЯт, включИт, вручИт, дозвонИтся, кровоточИть, накренИтся, облегчИть, ободрИть, окружИт, повторИт, сверлИт, щемИт.' },
      { label: 'Существительные с фиксированным ударением', val: 'аэропОрты, бАнты, бОроду, бухгАлтеров, вероисповЕдание, граждАнство, дефИс, диспансЕр, договОр, докумЕнт, доньзЯ, жалюзИ, каталОг, квартАл, кремЕнь, столЯр, тамОжня, тОрты, цемЕнт, шАрфы, экспЕрт.' },
      { label: 'Причастия и деепричастия', val: 'балОванный, включЁнный, довезЁнный, заселЁнный, кормпЯщий, кровоточАщий, начАвший, понЯвший, прожИвший; начАв, отдАв, поднЯв, понЯв, прибЫв.' },
    ],
  },
  {
    category: 'Информатика: Шпаргалка КЕГЭ (Шаблоны Python)',
    items: [
      { label: 'Мемоизация рекурсии (Задание 16)', val: '`from functools import lru_cache; @lru_cache(None)`' },
      { label: 'Перебор перестановок и сочетаний (Задание 8)', val: '`from itertools import product, permutations, combinations`' },
      { label: 'Чтение чисел из файла (Задания 24, 26, 27)', val: '`with open("24.txt") as f: s = f.read().strip()`' },
      { label: 'Перевод в n-ичную систему счисления (Задание 14)', val: '`def to_base(n, b): s=""; while n: s=str(n%b)+s; n//=b; return s`' },
    ],
  },
];

export const ExamSpecsAndReferenceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('conversion');
  const [selectedSubject, setSelectedSubject] = useState<'math' | 'physics' | 'cs' | 'russian'>('math');
  const [calculatorInput, setCalculatorInput] = useState<number>(18);
  const [searchFilter, setSearchFilter] = useState('');
  const [criteriaExamFilter, setCriteriaExamFilter] = useState<'all' | 'ege' | 'oge'>('all');

  const currentScale = SCORE_SCALES[`${selectedSubject}_ege`] || SCORE_SCALES['math_ege'];
  const calculatedTestScore = currentScale.scale[Math.min(currentScale.maxPrimary, Math.max(0, calculatorInput))] || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="label-academic text-[#D4AF37] mb-0.5">Официальные спецификации ФИПИ 2026</div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
            Справочник КИМ, перевод баллов и критерии проверки
          </h1>
          <p className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">
            Шкалы перевода первичных баллов в 100-балльную систему ЕГЭ и оценки ОГЭ, критерии 2-й части и официальные формулы.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] p-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('conversion')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider transition ${
              activeTab === 'conversion'
                ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]'
                : 'text-[#1B1B19]/70 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Перевод баллов
          </button>
          <button
            onClick={() => setActiveTab('criteria')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider transition ${
              activeTab === 'criteria'
                ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]'
                : 'text-[#1B1B19]/70 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Критерии ФИПИ
          </button>
          <button
            onClick={() => setActiveTab('cheat_sheets')}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider transition ${
              activeTab === 'cheat_sheets'
                ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]'
                : 'text-[#1B1B19]/70 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Справочные формулы
          </button>
        </div>
      </div>

      {/* TAB 1: SCORE CONVERSION SCALES */}
      {activeTab === 'conversion' && (
        <div className="space-y-6">
          {/* Subject Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'math', label: 'Математика (Профиль)', icon: '📐' },
              { id: 'physics', label: 'Физика', icon: '⚡' },
              { id: 'cs', label: 'Информатика (КЕГЭ)', icon: '💻' },
              { id: 'russian', label: 'Русский язык', icon: '📖' },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubject(sub.id as any);
                  const newScale = SCORE_SCALES[`${sub.id}_ege`];
                  setCalculatorInput(Math.round(newScale.maxPrimary * 0.6));
                }}
                className={`font-mono text-xs px-3.5 py-2 border transition flex items-center gap-2 ${
                  selectedSubject === sub.id
                    ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] font-bold shadow-2xs'
                    : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/25 dark:border-[#323642] hover:border-[#1B1B19]'
                }`}
              >
                <span>{sub.icon}</span>
                <span>{sub.label}</span>
              </button>
            ))}
          </div>

          {/* Interactive Calculator Card */}
          <div className="p-6 bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1B1B19]/15 dark:border-[#323642] pb-4">
              <div>
                <span className="label-academic text-[#D4AF37]">Интерактивный калькулятор</span>
                <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                  Калькулятор перевода первичных баллов в 100-балльную шкалу ЕГЭ
                </h3>
                <p className="font-mono text-xs text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">
                  Двигайте ползунок или укажите первичный балл, чтобы увидеть тестовый балл и уровень готовности
                </p>
              </div>

              {/* Big Score Display */}
              <div className="flex items-center gap-4 shrink-0 text-center">
                <div className="p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642]">
                  <span className="font-mono text-[10px] text-[#1B1B19]/60 dark:text-gray-400 block uppercase">
                    Первичный
                  </span>
                  <span className="font-mono text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                    {calculatorInput} / {currentScale.maxPrimary}
                  </span>
                </div>

                <div className="p-3 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border border-[#1B1B19] dark:border-[#E5C048]">
                  <span className="font-mono text-[10px] uppercase font-bold block opacity-80">
                    Тестовый балл
                  </span>
                  <span className="font-mono text-3xl font-bold">
                    {calculatedTestScore}
                    <span className="text-xs font-normal opacity-70"> / 100</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-xs">
                <span>0 первичных</span>
                <span className="font-bold text-[#D4AF37]">
                  Выбрано: {calculatorInput} из {currentScale.maxPrimary}
                </span>
                <span>{currentScale.maxPrimary} (максимум)</span>
              </div>
              <input
                type="range"
                min={0}
                max={currentScale.maxPrimary}
                value={calculatorInput}
                onChange={(e) => setCalculatorInput(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 accent-[#1B1B19] dark:accent-[#E5C048] cursor-pointer"
              />
            </div>

            {/* Verdict Box (Clean, objective academic thresholds without unrealistic top-university promises) */}
            <div className="p-3.5 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642] font-mono text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">Статус результата: </span>
                {calculatedTestScore < currentScale.minPassing ? (
                  <span className="text-rose-600 font-bold">Ниже минимального порога сдачи ({currentScale.minPassing} б.)</span>
                ) : calculatedTestScore < 60 ? (
                  <span className="text-amber-600 font-bold">Базовый уровень (минимальный порог сдачи пройден)</span>
                ) : calculatedTestScore < 80 ? (
                  <span className="text-emerald-600 font-bold">Хороший результат (уверенное освоение материала)</span>
                ) : (
                  <span className="text-[#D4AF37] font-bold">Высокий балл (отличный уровень подготовки)</span>
                )}
              </div>
              <span className="text-[11px] text-[#1B1B19]/50 dark:text-gray-400">
                Минимальный порог: {currentScale.minPassing} б.
              </span>
            </div>

            {/* Full Conversion Table */}
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider block text-[#1B1B19] dark:text-[#F3F3EE]">
                Полная сетка перевода (ФИПИ 2026):
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-11 gap-1 text-center font-mono text-[11px]">
                {Object.entries(currentScale.scale).map(([prim, sec]) => {
                  const isCur = Number(prim) === calculatorInput;
                  return (
                    <div
                      key={prim}
                      onClick={() => setCalculatorInput(Number(prim))}
                      className={`p-1.5 border transition cursor-pointer select-none ${
                        isCur
                          ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold border-[#1B1B19]'
                          : 'bg-[#F8F7F4] dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/15 dark:border-[#323642] hover:border-[#1B1B19]'
                      }`}
                    >
                      <div className="text-[9px] opacity-60">{prim} п.</div>
                      <div className="font-bold text-xs">{sec}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* OGE Grading Cards */}
          <div className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-sm space-y-4">
            <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-3">
              <span className="label-academic text-[#D4AF37]">Основной государственный экзамен</span>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                Шкала перевода баллов ОГЭ (9 класс) в школьные оценки (2, 3, 4, 5)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              {[
                { title: 'Математика ОГЭ', scale: OGE_SCALES['math_oge'] },
                { title: 'Физика ОГЭ', scale: OGE_SCALES['physics_oge'] },
                { title: 'Информатика ОГЭ', scale: OGE_SCALES['cs_oge'] },
                { title: 'Русский язык ОГЭ', scale: OGE_SCALES['russian_oge'] },
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642] space-y-2">
                  <div className="flex items-center justify-between border-b border-[#1B1B19]/15 dark:border-[#323642] pb-1.5">
                    <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">{item.title}</span>
                    <span className="text-[10px] text-[#D4AF37] font-bold">макс: {item.scale.max}</span>
                  </div>
                  <div className="space-y-1">
                    {item.scale.grades.map((g) => (
                      <div key={g.grade} className="flex justify-between items-center text-[11px]">
                        <span className={`font-bold ${g.grade === 5 ? 'text-emerald-700 dark:text-emerald-400' : g.grade === 4 ? 'text-blue-700 dark:text-blue-400' : g.grade === 3 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700'}`}>
                          Оценка «{g.grade}»:
                        </span>
                        <span className="font-bold">{g.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CRITERIA FOR PART 2 (EGE & OGE) */}
      {activeTab === 'criteria' && (
        <div className="space-y-6">
          <div className="p-4 bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="w-4 h-4 text-[#D4AF37]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Поиск по номеру или теме (18, параметр, механика, сочинение)..."
                className="bg-transparent text-[#1B1B19] dark:text-[#F3F3EE] focus:outline-none w-full sm:w-80 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <span className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400 mr-1">Фильтр:</span>
              <button
                onClick={() => setCriteriaExamFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-bold transition border ${
                  criteriaExamFilter === 'all'
                    ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19]'
                    : 'bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setCriteriaExamFilter('ege')}
                className={`px-2.5 py-1 text-[11px] font-bold transition border ${
                  criteriaExamFilter === 'ege'
                    ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19]'
                    : 'bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20'
                }`}
              >
                ЕГЭ
              </button>
              <button
                onClick={() => setCriteriaExamFilter('oge')}
                className={`px-2.5 py-1 text-[11px] font-bold transition border ${
                  criteriaExamFilter === 'oge'
                    ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19]'
                    : 'bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20'
                }`}
              >
                ОГЭ
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {FIPI_CRITERIA_DATA.filter((section) => {
              if (criteriaExamFilter === 'ege') return section.exam.includes('ЕГЭ');
              if (criteriaExamFilter === 'oge') return section.exam.includes('ОГЭ');
              return true;
            }).map((section, idx) => {
              const filteredTasks = section.tasks.filter((t) =>
                searchFilter
                  ? t.number.includes(searchFilter) ||
                    t.title.toLowerCase().includes(searchFilter.toLowerCase())
                  : true
              );

              if (filteredTasks.length === 0) return null;

              return (
                <div key={idx} className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-sm space-y-4">
                  <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-3 flex items-center justify-between">
                    <div>
                      <span className="label-academic text-[#D4AF37]">{section.exam}</span>
                      <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                        Критерии оценивания заданий 2-й части ({section.subject === 'math' ? 'Математика' : section.subject === 'physics' ? 'Физика' : section.subject === 'cs' ? 'Информатика' : 'Русский язык'})
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredTasks.map((t) => (
                      <div key={t.number} className="p-4 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642] space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#1B1B19] dark:text-[#F3F3EE]">
                            №{t.number}: {t.title}
                          </span>
                          <span className="px-2 py-0.5 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold text-[10px] uppercase">
                            Максимум: {t.maxPts} б.
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {t.points.map((p, pIdx) => (
                            <div key={pIdx} className="p-2.5 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/10 dark:border-[#323642] flex items-start gap-2.5">
                              <span className="w-6 h-6 shrink-0 bg-[#D4AF37]/20 border border-[#D4AF37] text-[#1B1B19] dark:text-[#E5C048] flex items-center justify-center font-bold text-xs">
                                {p.pts}
                              </span>
                              <p className="text-[11px] text-[#1B1B19]/80 dark:text-gray-300 leading-relaxed pt-0.5">
                                {p.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CHEAT SHEETS & REFERENCE FORMULAS */}
      {activeTab === 'cheat_sheets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CHEAT_SHEET_DATA.map((cat, idx) => (
              <div key={idx} className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-5 shadow-sm space-y-3 font-mono text-xs">
                <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#D4AF37]" />
                  <h3 className="font-serif text-base font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                    {cat.category}
                  </h3>
                </div>

                <div className="space-y-2">
                  {cat.items.map((it, itIdx) => (
                    <div key={itIdx} className="p-2.5 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/15 dark:border-[#323642] space-y-1">
                      <div className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 font-bold uppercase tracking-wider">
                        {it.label}
                      </div>
                      <div className="text-xs text-[#1B1B19] dark:text-[#E5C048] font-bold">
                        <MathRenderer content={it.val} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
