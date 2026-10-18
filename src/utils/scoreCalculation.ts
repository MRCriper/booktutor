import { ExamNumberProgress, ExamTopicProgress, Subject, ExamKind } from '../types';

export interface ScoreSectionBreakdown {
  sectionName: string;
  primaryScore: number;
  maxPrimaryScore: number;
  percentage: number;
  tasksCovered: string;
}

export interface PredictedScoreResult {
  hasData: boolean;
  primaryScore: number;
  maxPrimaryScore: number;
  secondaryScore: number; // 0-100 for ЕГЭ, or grade 2-5 for ОГЭ
  examKind: ExamKind;
  gradeEquivalent?: number; // for ОГЭ: 2, 3, 4, 5
  gradeLabel?: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  breakdown: ScoreSectionBreakdown[];
}

/**
 * Official conversion scales from primary points to test score (ЕГЭ) or grade (ОГЭ)
 */
export function convertPrimaryToSecondaryEGE(subject: Subject, primary: number, maxPrimary: number): number {
  if (primary <= 0) return 0;
  if (primary >= maxPrimary) return 100;

  // Approximate official FIPI monotonic curves
  switch (subject) {
    case 'math': {
      // Math Profile 2026/2027: 32 primary points
      // 0-5: 0-27 (порог 6 primary = 34)
      // 6-12 (part 1): 34 - 64
      // 13-16 (basic part 2): 66 - 78
      // 17-22: 80 - 92
      // 23-27: 94 - 98
      // 28+: 100
      if (primary <= 5) return Math.round(primary * 5.4);
      if (primary <= 12) return Math.round(34 + (primary - 6) * 5.0);
      if (primary <= 16) return Math.round(66 + (primary - 13) * 3.5);
      if (primary <= 22) return Math.round(80 + (primary - 17) * 2.2);
      if (primary <= 28) return Math.round(92 + (primary - 23) * 1.5);
      return 100;
    }
    case 'cs': {
      // CS КЕГЭ 2026/2027: 29 primary points
      // Порог 6 primary = 40
      if (primary <= 5) return Math.round(primary * 6.5);
      if (primary <= 12) return Math.round(40 + (primary - 6) * 3.0);
      if (primary <= 18) return Math.round(60 + (primary - 13) * 3.0);
      if (primary <= 24) return Math.round(76 + (primary - 19) * 2.8);
      if (primary <= 28) return Math.round(90 + (primary - 25) * 2.5);
      return 100;
    }
    case 'physics': {
      // Physics 2026/2027: 45 primary points
      // Порог 11 primary = 39
      if (primary <= 10) return Math.round(primary * 3.8);
      if (primary <= 20) return Math.round(39 + (primary - 11) * 1.8);
      if (primary <= 30) return Math.round(57 + (primary - 21) * 1.6);
      if (primary <= 38) return Math.round(73 + (primary - 31) * 2.0);
      if (primary <= 44) return Math.round(89 + (primary - 39) * 2.0);
      return 100;
    }
    case 'russian': {
      // Russian 2026/2027: 50 primary points
      // Порог 16 primary = 40
      if (primary <= 15) return Math.round(primary * 2.6);
      if (primary <= 25) return Math.round(40 + (primary - 16) * 1.8);
      if (primary <= 35) return Math.round(58 + (primary - 26) * 1.5);
      if (primary <= 44) return Math.round(73 + (primary - 36) * 1.8);
      if (primary <= 49) return Math.round(89 + (primary - 45) * 2.2);
      return 100;
    }
    default: {
      const ratio = primary / maxPrimary;
      return Math.round(ratio * 100);
    }
  }
}

export function convertPrimaryToGradeOGE(subject: Subject, primary: number): { grade: number; label: string } {
  switch (subject) {
    case 'math': {
      // 0-7: 2, 8-14: 3, 15-21: 4, 22-31: 5
      if (primary < 8) return { grade: 2, label: 'Неудовлетворительно (2)' };
      if (primary < 15) return { grade: 3, label: 'Удовлетворительно (3)' };
      if (primary < 22) return { grade: 4, label: 'Хорошо (4)' };
      return { grade: 5, label: 'Отлично (5)' };
    }
    case 'cs': {
      // 0-4: 2, 5-10: 3, 11-16: 4, 17-19: 5
      if (primary < 5) return { grade: 2, label: 'Неудовлетворительно (2)' };
      if (primary < 11) return { grade: 3, label: 'Удовлетворительно (3)' };
      if (primary < 17) return { grade: 4, label: 'Хорошо (4)' };
      return { grade: 5, label: 'Отлично (5)' };
    }
    case 'physics': {
      // 0-10: 2, 11-22: 3, 23-34: 4, 35-45: 5
      if (primary < 11) return { grade: 2, label: 'Неудовлетворительно (2)' };
      if (primary < 23) return { grade: 3, label: 'Удовлетворительно (3)' };
      if (primary < 35) return { grade: 4, label: 'Хорошо (4)' };
      return { grade: 5, label: 'Отлично (5)' };
    }
    case 'russian': {
      // 0-14: 2, 15-22: 3, 23-28: 4, 29-33: 5
      if (primary < 15) return { grade: 2, label: 'Неудовлетворительно (2)' };
      if (primary < 23) return { grade: 3, label: 'Удовлетворительно (3)' };
      if (primary < 29) return { grade: 4, label: 'Хорошо (4)' };
      return { grade: 5, label: 'Отлично (5)' };
    }
    default: {
      return { grade: 4, label: 'Хорошо (4)' };
    }
  }
}

/**
 * Calculates predicted exam score based on detailed topics and exam numbers progress
 */
export function calculatePredictedScore(
  examNumbers: ExamNumberProgress[],
  topics: ExamTopicProgress[],
  selectedSubject: Subject | 'all' = 'all',
  selectedExamKind: ExamKind | 'all' = 'all'
): PredictedScoreResult {
  // Filter relevant items
  const filteredNums = examNumbers.filter((n) => {
    const matchSubj = selectedSubject === 'all' || n.subject === selectedSubject;
    const matchExam = selectedExamKind === 'all' || n.examKind === selectedExamKind;
    return matchSubj && matchExam;
  });

  const filteredTopics = topics.filter((t) => {
    const matchSubj = selectedSubject === 'all' || t.subject === selectedSubject;
    const matchExam = selectedExamKind === 'all' || t.examKind === selectedExamKind;
    return matchSubj && matchExam;
  });

  // Check if brand new account with zero data
  const totalSolvedInTopics = filteredTopics.reduce((acc, t) => acc + (t.tasksSolved || 0), 0);
  const totalMasteredInNums = filteredNums.filter((n) => n.status !== 'not_started').length;
  const hasAnyProgress = totalSolvedInTopics > 0 || totalMasteredInNums > 0;

  const targetExamKind: ExamKind = selectedExamKind === 'oge' ? 'oge' : 'ege';

  if (!hasAnyProgress || filteredNums.length === 0) {
    return {
      hasData: false,
      primaryScore: 0,
      maxPrimaryScore: filteredNums.reduce((acc, n) => acc + (n.primaryPoints || 1), 0),
      secondaryScore: 0,
      examKind: targetExamKind,
      confidenceLevel: 'low',
      breakdown: [],
    };
  }

  // Calculate primary score from task accuracy and primaryPoints
  let calculatedPrimary = 0;
  let totalMaxPrimary = 0;

  filteredNums.forEach((item) => {
    const maxPts = item.primaryPoints || 1;
    totalMaxPrimary += maxPts;

    // Weight accuracy into earned points
    let effectiveRatio = 0;
    if (item.status === 'mastered') {
      effectiveRatio = Math.max(0.85, (item.accuracy || 100) / 100);
    } else if (item.status === 'in_progress') {
      effectiveRatio = Math.max(0.4, (item.accuracy || 60) / 100);
    } else {
      // not_started: check if associated topics have progress
      const relatedTopic = filteredTopics.find(
        (t) => t.subject === item.subject && t.examNumbersCovered?.includes(item.examNumber)
      );
      if (relatedTopic && relatedTopic.masteryPercentage > 0) {
        effectiveRatio = (relatedTopic.masteryPercentage / 100) * 0.7;
      }
    }

    calculatedPrimary += effectiveRatio * maxPts;
  });

  const roundedPrimary = Math.min(totalMaxPrimary, Math.round(calculatedPrimary));

  // Determine subject for conversion: if 'all', pick dominant or math
  const dominantSubject: Subject = selectedSubject !== 'all' ? selectedSubject : 'math';

  let secondaryScore = 0;
  let gradeEquivalent: number | undefined;
  let gradeLabel: string | undefined;

  if (targetExamKind === 'oge') {
    const ogeRes = convertPrimaryToGradeOGE(dominantSubject, roundedPrimary);
    gradeEquivalent = ogeRes.grade;
    gradeLabel = ogeRes.label;
    secondaryScore = gradeEquivalent;
  } else {
    secondaryScore = convertPrimaryToSecondaryEGE(dominantSubject, roundedPrimary, totalMaxPrimary);
  }

  // Calculate breakdown by logical topic blocks
  const breakdown: ScoreSectionBreakdown[] = [];

  // Group by logical sections
  const groupMap: Record<string, { earned: number; max: number; tasks: string[] }> = {};

  filteredNums.forEach((n) => {
    let groupName = 'Часть 1: Базовые задания';
    const numMatch = n.examNumber.match(/\d+/);
    const numVal = numMatch ? parseInt(numMatch[0], 10) : 1;

    if (n.subject === 'math') {
      if (targetExamKind === 'ege') {
        if (numVal <= 12) groupName = 'Часть 1: Краткий ответ (№1–12)';
        else if (numVal <= 16) groupName = 'Часть 2: Алгебра и уравнения (№13, 15, 16)';
        else if (numVal === 14 || numVal === 17) groupName = 'Часть 2: Геометрия (№14, 17)';
        else groupName = 'Часть 2: Олимпиадный блок (№18, 19)';
      } else {
        if (numVal <= 19) groupName = 'Часть 1: Базовая математика (№1–19)';
        else groupName = 'Часть 2: Повышенная сложность (№20–25)';
      }
    } else if (n.subject === 'cs') {
      if (targetExamKind === 'ege') {
        if (numVal <= 18) groupName = 'Блок 1: Алгоритмы и вычисления (№1–18)';
        else if (numVal <= 23) groupName = 'Блок 2: Теория игр и процессы (№19–23)';
        else groupName = 'Блок 3: Сложное программирование (№24–27)';
      } else {
        if (numVal <= 10) groupName = 'Теория и логика (№1–10)';
        else groupName = 'Практика на компьютере (№11–15)';
      }
    } else if (n.subject === 'physics') {
      if (targetExamKind === 'ege') {
        if (numVal <= 20) groupName = 'Часть 1: Тестовая часть (№1–20)';
        else groupName = 'Часть 2: Развернутые задачи (№21–26)';
      } else {
        if (numVal <= 18) groupName = 'Часть 1: Базовая физика (№1–18)';
        else groupName = 'Часть 2: Эксперимент и задачи (№19–22)';
      }
    } else if (n.subject === 'russian') {
      if (targetExamKind === 'ege') {
        if (numVal <= 26) groupName = 'Часть 1: Нормы, орфография, пунктуация (№1–26)';
        else groupName = 'Часть 2: Сочинение-рассуждение (№27)';
      } else {
        if (numVal === 1) groupName = 'Часть 1: Сжатое изложение (№1)';
        else if (numVal <= 12) groupName = 'Часть 2: Языковой анализ (№2–12)';
        else groupName = 'Часть 3: Сочинение (№13)';
      }
    }

    if (!groupMap[groupName]) {
      groupMap[groupName] = { earned: 0, max: 0, tasks: [] };
    }

    const maxPts = n.primaryPoints || 1;
    groupMap[groupName].max += maxPts;
    groupMap[groupName].tasks.push(n.examNumber);

    let effectiveRatio = 0;
    if (n.status === 'mastered') effectiveRatio = Math.max(0.85, (n.accuracy || 100) / 100);
    else if (n.status === 'in_progress') effectiveRatio = Math.max(0.4, (n.accuracy || 60) / 100);

    groupMap[groupName].earned += effectiveRatio * maxPts;
  });

  Object.entries(groupMap).forEach(([name, data]) => {
    const earnedRound = Math.round(data.earned);
    breakdown.push({
      sectionName: name,
      primaryScore: earnedRound,
      maxPrimaryScore: data.max,
      percentage: data.max > 0 ? Math.round((earnedRound / data.max) * 100) : 0,
      tasksCovered: data.tasks.slice(0, 5).join(', ') + (data.tasks.length > 5 ? '...' : ''),
    });
  });

  const confidenceLevel =
    totalSolvedInTopics > 15 || totalMasteredInNums > 8
      ? 'high'
      : totalSolvedInTopics > 3 || totalMasteredInNums > 2
      ? 'medium'
      : 'low';

  return {
    hasData: true,
    primaryScore: roundedPrimary,
    maxPrimaryScore: totalMaxPrimary,
    secondaryScore,
    examKind: targetExamKind,
    gradeEquivalent,
    gradeLabel,
    confidenceLevel,
    breakdown,
  };
}
