import { User, Homework, ExamTopicProgress, ExamNumberProgress } from '../types';
import { storage } from '../services/storage';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: string;
  category: 'homework' | 'topics' | 'exams' | 'tools';
}

export interface XpBreakdownItem {
  id: string;
  label: string;
  amount: number;
  count?: number;
  description: string;
}

export interface StudentGamificationState {
  totalXp: number;
  currentLevel: number;
  levelTitle: string;
  nextLevelXp: number;
  currentLevelBaseXp: number;
  levelProgressPercent: number;
  xpNeededForNext: number;
  breakdown: XpBreakdownItem[];
  badges: Badge[];
}

export const LEVELS = [
  { level: 1, minXp: 0, maxXp: 300, title: 'Новичок' },
  { level: 2, minXp: 300, maxXp: 750, title: 'Практик' },
  { level: 3, minXp: 750, maxXp: 1500, title: 'Исследователь' },
  { level: 4, minXp: 1500, maxXp: 2600, title: 'Мастер задач' },
  { level: 5, minXp: 2600, maxXp: 4000, title: 'Эксперт КИМ' },
  { level: 6, minXp: 4000, maxXp: 6000, title: 'Претендент на максимум' },
];

export function calculateStudentGamification(
  student: User,
  homeworks: Homework[],
  topics: ExamTopicProgress[],
  examNumbers: ExamNumberProgress[]
): StudentGamificationState {
  const studentHws = homeworks.filter((h) => h.studentId === student.id);
  const gradedHws = studentHws.filter((h) => h.status === 'graded');
  const submittedHws = studentHws.filter((h) => h.status === 'submitted');
  const excellentHws = gradedHws.filter(
    (h) => (h.grade || 0) >= 90 || h.grade === 5 || h.mark === 5
  );

  const breakdown: XpBreakdownItem[] = [];
  let totalXp = 0;

  // 1. Starter bonus (only after student actually completes onboarding survey)
  if (student.onboardingCompleted) {
    const starterBonus = 50;
    totalXp += starterBonus;
    breakdown.push({
      id: 'base',
      label: 'Стартовый капитал',
      amount: starterBonus,
      description: 'Бонус за прохождение вводной анкеты и выбор предметов',
    });
  }

  // 2. Graded Homeworks (+150 each)
  const gradedAmount = gradedHws.length * 150;
  if (gradedAmount > 0) {
    totalXp += gradedAmount;
    breakdown.push({
      id: 'graded_hw',
      label: 'Проверенные домашние работы',
      amount: gradedAmount,
      count: gradedHws.length,
      description: `+150 XP за каждое из ${gradedHws.length} проверенных ДЗ`,
    });
  }

  // 3. Submitted Homeworks awaiting review (+50 each)
  const submittedAmount = submittedHws.length * 50;
  if (submittedAmount > 0) {
    totalXp += submittedAmount;
    breakdown.push({
      id: 'submitted_hw',
      label: 'Сданные ДЗ на проверке',
      amount: submittedAmount,
      count: submittedHws.length,
      description: `+50 XP за каждое из ${submittedHws.length} отправленных решений`,
    });
  }

  // 4. Excellent bonus (+75 each for 90%+)
  const excellentAmount = excellentHws.length * 75;
  if (excellentAmount > 0) {
    totalXp += excellentAmount;
    breakdown.push({
      id: 'excellent_hw',
      label: 'Бонус за отличные оценки (90%+)',
      amount: excellentAmount,
      count: excellentHws.length,
      description: `+75 XP бонус за высокое качество выполнения заданий`,
    });
  }

  // 5. Exam Variant Submissions (+100 XP + points)
  let variantSubmissionsCount = 0;
  try {
    const submissions = storage.getVariantSubmissions(student.id);
    variantSubmissionsCount = submissions.length;
    if (variantSubmissionsCount > 0) {
      const variantXp = submissions.reduce((acc, s) => acc + 100 + (s.secondaryScore || s.totalPrimaryScore || 0), 0);
      totalXp += variantXp;
      breakdown.push({
        id: 'variant_submissions',
        label: 'Решённые тренировочные варианты',
        amount: variantXp,
        count: variantSubmissionsCount,
        description: `+XP за решение ${variantSubmissionsCount} экзаменационных вариантов`,
      });
    }
  } catch {
    // fallback if storage unavailable
  }

  // 6. Mastered Exam Topics (requires tasksSolved > 0 and subject matching)
  const studentSubjects = student.subjects || [];
  const masteredTopics = topics.filter((t) => {
    const matchesSubject = studentSubjects.length === 0 || studentSubjects.includes(t.subject);
    return matchesSubject && t.masteryPercentage >= 80 && (t.tasksSolved || 0) > 0;
  });

  const topicsAmount = masteredTopics.length * 80;
  if (topicsAmount > 0) {
    totalXp += topicsAmount;
    breakdown.push({
      id: 'mastered_topics',
      label: 'Освоенные темы кодификатора',
      amount: topicsAmount,
      count: masteredTopics.length,
      description: `+80 XP за каждую тему с освоением 80%+ (${masteredTopics.length} тем)`,
    });
  }

  // 7. Mastered Exam Numbers (requires accuracy >= 80% and subject matching)
  const masteredExamNums = examNumbers.filter((n) => {
    const matchesSubject = studentSubjects.length === 0 || studentSubjects.includes(n.subject);
    return matchesSubject && n.status === 'mastered' && (n.accuracy || 0) >= 80;
  });

  const examNumsAmount = masteredExamNums.length * 50;
  if (examNumsAmount > 0) {
    totalXp += examNumsAmount;
    breakdown.push({
      id: 'mastered_exams',
      label: 'Освоенные задания КИМ',
      amount: examNumsAmount,
      count: masteredExamNums.length,
      description: `+50 XP за каждое отработанное задание КИМ (${masteredExamNums.length} номеров)`,
    });
  }

  // Determine Level from calibrated thresholds
  let currentLevelObj = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.minXp) {
      currentLevelObj = lvl;
    }
  }

  const range = currentLevelObj.maxXp - currentLevelObj.minXp;
  const currentInLevel = Math.max(0, totalXp - currentLevelObj.minXp);
  const levelProgressPercent = Math.min(100, Math.round((currentInLevel / range) * 100));
  const xpNeededForNext = Math.max(0, currentLevelObj.maxXp - totalXp);

  // Subject checks for student
  const isCsStudent = Boolean(studentSubjects.includes('cs'));
  const isMathStudent = studentSubjects.length === 0 || studentSubjects.includes('math');
  const isPhysicsStudent = Boolean(studentSubjects.includes('physics'));

  // Has student actually solved coding tasks or passed IDE test cases?
  let hasPassedCodeTests = false;
  if (isCsStudent) {
    try {
      if (typeof window !== 'undefined') {
        hasPassedCodeTests = localStorage.getItem(`booktutor_v7_code_tests_${student.id}`) === 'true';
      }
    } catch {
      // ignore
    }
    const hasCsHwWithCode = studentHws.some(
      (h) => h.subject === 'cs' && (h.status === 'graded' || h.status === 'submitted') && h.tasks.some((t) => Boolean(t.studentCode))
    );
    hasPassedCodeTests = hasPassedCodeTests || hasCsHwWithCode;
  }

  // Badges system
  const badges: Badge[] = [
    {
      id: 'first_hw',
      title: 'Первый рубеж',
      description: 'Сдано первое домашнее задание в системе',
      icon: '🚀',
      earned: gradedHws.length > 0 || submittedHws.length > 0,
      progress: `${gradedHws.length + submittedHws.length} / 1 ДЗ`,
      category: 'homework',
    },
    {
      id: 'perfect_score',
      title: 'Отличник',
      description: 'Домашняя работа оценена репетитором на высший балл — «5» (Отлично)',
      icon: '🏆',
      earned: gradedHws.some((h) => (h.grade || 0) >= 90 || h.grade === 5 || h.mark === 5),
      progress: gradedHws.some((h) => (h.grade || 0) >= 90 || h.grade === 5 || h.mark === 5) ? 'Выполнено' : 'В процессе',
      category: 'homework',
    },
    {
      id: 'hw_streak',
      title: 'Спринтер задач',
      description: 'Выполнено 3 или более домашних заданий',
      icon: '⚡',
      earned: (gradedHws.length + submittedHws.length) >= 3,
      progress: `${gradedHws.length + submittedHws.length} / 3 ДЗ`,
      category: 'homework',
    },
    {
      id: 'parameters_master',
      title: 'Параметрический гений',
      description: 'Освоена тема параметров повышенной сложности (ЕГЭ №18)',
      icon: '🧠',
      earned: isMathStudent && topics.some((t) => t.subject === 'math' && t.topicName.includes('параметр') && t.masteryPercentage >= 70 && (t.tasksSolved || 0) > 0),
      progress: isMathStudent ? '70%+ по параметрам' : 'Математика не выбрана',
      category: 'topics',
    },
    {
      id: 'electricity_master',
      title: 'Повелитель молний',
      description: 'Уверенный навык по электродинамике и закону Фарадея',
      icon: '🔋',
      earned: isPhysicsStudent && topics.some((t) => t.subject === 'physics' && t.topicName.includes('Электродинамика') && t.masteryPercentage >= 70 && (t.tasksSolved || 0) > 0),
      progress: isPhysicsStudent ? '70%+ по электродинамике' : 'Физика не выбрана',
      category: 'topics',
    },
    {
      id: 'code_master',
      title: 'Алгоритмический гуру',
      description: 'Все автоматические тесты в песочнице кода успешно пройдены',
      icon: '💻',
      earned: isCsStudent && hasPassedCodeTests,
      progress: !isCsStudent ? 'Информатика не выбрана' : hasPassedCodeTests ? 'Пройдено' : '0 / 1 программ',
      category: 'tools',
    },
    {
      id: 'topics_5',
      title: 'Энциклопедист',
      description: 'Успешно освоено 5+ тем программы кодификатора',
      icon: '📚',
      earned: masteredTopics.length >= 5,
      progress: `${masteredTopics.length} / 5 тем`,
      category: 'topics',
    },
    {
      id: 'kim_sniper',
      title: 'Снайпер КИМ',
      description: 'Отработано и освоено 3+ типа экзаменационных заданий',
      icon: '🎯',
      earned: masteredExamNums.length >= 3,
      progress: `${masteredExamNums.length} / 3 заданий`,
      category: 'exams',
    },
    {
      id: 'high_score',
      title: 'На пути к сотке',
      description: 'Прогноз баллов на экзамене превышает 75+ баллов',
      icon: '🏅',
      earned: (student.currentScore || 0) >= 75 && (gradedHws.length > 0 || submittedHws.length > 0 || variantSubmissionsCount > 0),
      progress: `${student.currentScore || 0} / 75 б.`,
      category: 'exams',
    },
    {
      id: 'miro_connected',
      title: 'Интерактивная доска',
      description: 'Привязана интерактивная онлайн-доска для совместных занятий',
      icon: '🎨',
      earned: Boolean(student.miroBoardUrl),
      progress: student.miroBoardUrl ? 'Подключено' : 'Ожидает',
      category: 'tools',
    },
  ];

  return {
    totalXp,
    currentLevel: currentLevelObj.level,
    levelTitle: currentLevelObj.title,
    nextLevelXp: currentLevelObj.maxXp,
    currentLevelBaseXp: currentLevelObj.minXp,
    levelProgressPercent,
    xpNeededForNext,
    breakdown,
    badges,
  };
}
