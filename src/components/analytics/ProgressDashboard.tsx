import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Sliders,
  Filter,
  Layers,
  FileCheck2,
  Check,
  Circle,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { ExamTopicProgress, ExamNumberProgress, Subject, Role, ExamKind } from '../../types';
import { storage } from '../../services/storage';
import { calculatePredictedScore, PredictedScoreResult } from '../../utils/scoreCalculation';

interface ProgressDashboardProps {
  topics: ExamTopicProgress[];
  examNumbers: ExamNumberProgress[];
  currentRole: Role;
  studentName?: string;
  targetScore?: number;
  currentScore?: number;
  initialExamKind?: ExamKind;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  topics,
  examNumbers,
  currentRole,
  studentName,
  targetScore = 90,
  currentScore = 0,
  initialExamKind,
}) => {
  const [selectedExamKind, setSelectedExamKind] = useState<'all' | 'ege' | 'oge'>(
    initialExamKind || 'all'
  );
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [activeLevel, setActiveLevel] = useState<'themes' | 'exam_numbers'>('themes');
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  // Filter topics by examKind and subject
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchExam = selectedExamKind === 'all' || !t.examKind || t.examKind === selectedExamKind;
      const matchSubj = selectedSubject === 'all' || t.subject === selectedSubject;
      return matchExam && matchSubj;
    });
  }, [topics, selectedExamKind, selectedSubject]);

  // Filter numbers by examKind and subject
  const filteredNumbers = useMemo(() => {
    return examNumbers.filter((n) => {
      const matchExam = selectedExamKind === 'all' || !n.examKind || n.examKind === selectedExamKind;
      const matchSubj = selectedSubject === 'all' || n.subject === selectedSubject;
      return matchExam && matchSubj;
    });
  }, [examNumbers, selectedExamKind, selectedSubject]);

  // Topic metrics
  const totalTopics = filteredTopics.length;
  const masteredCount = filteredTopics.filter((t) => t.masteryPercentage >= 80).length;
  const avgMastery =
    totalTopics > 0
      ? Math.round(filteredTopics.reduce((acc, t) => acc + t.masteryPercentage, 0) / totalTopics)
      : 0;

  const totalSolved = filteredTopics.reduce((acc, t) => acc + (t.tasksSolved || 0), 0);

  // Dynamic predicted score calculation from topics & tasks
  const predictedScoreResult: PredictedScoreResult = useMemo(() => {
    return calculatePredictedScore(filteredNumbers, filteredTopics, selectedSubject, selectedExamKind);
  }, [filteredNumbers, filteredTopics, selectedSubject, selectedExamKind]);

  // Brand new account: explicitly no solved tasks and no score set
  const isBrandNewAccount = !predictedScoreResult.hasData && (!currentScore || currentScore === 0);

  // Effective displayed score
  const displayScore = predictedScoreResult.hasData
    ? predictedScoreResult.secondaryScore
    : currentScore > 0
    ? currentScore
    : 0;

  // Top mastered topics for side competency map
  const topTopics = [...filteredTopics]
    .filter((t) => t.masteryPercentage > 0)
    .sort((a, b) => b.masteryPercentage - a.masteryPercentage)
    .slice(0, 5);

  const handleToggleNumberStatus = (item: ExamNumberProgress) => {
    if (currentRole !== 'tutor') return;
    const nextStatus: Record<string, 'not_started' | 'in_progress' | 'mastered'> = {
      not_started: 'in_progress',
      in_progress: 'mastered',
      mastered: 'not_started',
    };
    const nextAccuracy: Record<string, number> = {
      not_started: 60,
      in_progress: 95,
      mastered: 0,
    };
    storage.updateExamNumber(item.examNumber, {
      status: nextStatus[item.status],
      accuracy: nextAccuracy[item.status],
    });
  };

  const getSubjectName = (subj: Subject) => {
    switch (subj) {
      case 'math':
        return 'Математика';
      case 'physics':
        return 'Физика';
      case 'cs':
        return 'Информатика';
      case 'russian':
        return 'Русский язык';
      default:
        return subj;
    }
  };

  const getSubjectBadge = (s: Subject) => {
    switch (s) {
      case 'math':
        return 'bg-amber-500/10 text-amber-800 dark:text-[#E5C048] border-amber-500/30';
      case 'physics':
        return 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/30';
      case 'cs':
        return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'russian':
        return 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/30';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Main Header & Horizontal Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Hero & Key Stats */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-3">
            <div className="label-academic flex items-center text-[#D4AF37] dark:text-[#E5C048]">
              <span className="marker-academic"></span>
              Аналитический трекер подготовки {studentName ? `• ${studentName}` : ''}
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#1B1B19] dark:text-[#F3F3EE] tracking-tight leading-none">
              Трекер подготовки к экзаменам
            </h1>
            <p className="text-sm sm:text-base text-[#1B1B19]/75 dark:text-gray-300 max-w-xl leading-relaxed">
              Полная детализация по всем темам и заданиям ФИПИ (ЕГЭ и ОГЭ). Прогнозный балл рассчитывается на основе статистики решений по конкретным разделам КИМ.
            </p>
          </div>

          {/* Stats Horizontal Grid (Container 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t-2 border-b-2 border-[#1B1B19] dark:border-[#323642] py-4 sm:py-6 gap-4 sm:gap-6 bg-white/40 dark:bg-[#1A1C24]/40">
            {/* Box 1: Forecast Score */}
            <div className="sm:border-r border-[#1B1B19]/15 dark:border-[#323642] pr-4">
              <div className="flex items-center justify-between mb-1">
                <span className="label-academic text-[#1B1B19]/70 dark:text-gray-400">Прогноз баллов</span>
                {predictedScoreResult.hasData && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-600/30">
                    Динамический
                  </span>
                )}
              </div>

              {isBrandNewAccount ? (
                <div>
                  <div className="font-mono text-4xl sm:text-5xl font-bold text-[#1B1B19]/40 dark:text-gray-500 leading-tight">
                    —
                    <span className="text-xs text-[#1B1B19]/50 dark:text-gray-400 font-normal ml-2">
                      цель: {targetScore || 80}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-700 dark:text-[#E5C048] mt-1.5 block font-semibold leading-tight">
                    Новый аккаунт • Диагностика не пройдена
                  </span>
                </div>
              ) : selectedExamKind === 'oge' && predictedScoreResult.gradeEquivalent ? (
                <div>
                  <div className="font-mono text-3xl sm:text-4xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] leading-tight">
                    {predictedScoreResult.gradeLabel}
                  </div>
                  <span className="font-mono text-[11px] text-[#1B1B19]/70 dark:text-gray-300 mt-1 block">
                    {predictedScoreResult.primaryScore} из {predictedScoreResult.maxPrimaryScore} первичных баллов
                  </span>
                </div>
              ) : (
                <div>
                  <div className="font-mono text-4xl sm:text-5xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] leading-tight">
                    {displayScore}
                    <span className="text-base text-[#1B1B19]/40 dark:text-gray-500 font-normal ml-1">
                      /{targetScore}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#1B1B19]/70 dark:text-gray-300 mt-1 block">
                    {predictedScoreResult.hasData
                      ? `Первичный: ${predictedScoreResult.primaryScore} из ${predictedScoreResult.maxPrimaryScore} б.`
                      : `До цели: ${Math.max(0, targetScore - displayScore)} б.`}
                  </span>
                </div>
              )}

              {predictedScoreResult.hasData && (
                <button
                  onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                  className="mt-2 text-[11px] font-mono text-[#D4AF37] dark:text-[#E5C048] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showCalculationDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Детализация расчета
                </button>
              )}
            </div>

            {/* Box 2: Mastery */}
            <div className="sm:border-r border-[#1B1B19]/15 dark:border-[#323642] sm:px-4">
              <span className="label-academic block mb-1 text-[#1B1B19]/70 dark:text-gray-400">Освоение тем</span>
              <div className="font-mono text-4xl sm:text-5xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] leading-tight">
                {avgMastery}%
              </div>
              <span className="font-mono text-[11px] text-[#1B1B19]/70 dark:text-gray-300 mt-1 block">
                {masteredCount} из {totalTopics} тем освоено
              </span>
            </div>

            {/* Box 3: Tasks solved */}
            <div className="sm:pl-4">
              <span className="label-academic block mb-1 text-[#1B1B19]/70 dark:text-gray-400">Задач решено</span>
              <div className="font-mono text-4xl sm:text-5xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] leading-tight">
                {totalSolved}
              </div>
              <span className="font-mono text-[11px] text-[#1B1B19]/70 dark:text-gray-300 mt-1 block">
                {filteredNumbers.filter((n) => n.status === 'mastered').length} номеров КИМ закрыто
              </span>
            </div>
          </div>

          {/* Collapsible Score Calculation Breakdown */}
          {showCalculationDetails && predictedScoreResult.hasData && (
            <div className="p-4 sm:p-5 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#1B1B19]/10 dark:border-[#323642] pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37] dark:text-[#E5C048]" />
                  <h4 className="font-serif text-sm font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                    Тематический расчет прогнозного балла по шкале ФИПИ
                  </h4>
                </div>
                <span className="font-mono text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                  Достоверность: {predictedScoreResult.confidenceLevel === 'high' ? 'Высокая' : predictedScoreResult.confidenceLevel === 'medium' ? 'Средняя' : 'Предварительная'}
                </span>
              </div>

              <div className="space-y-3">
                {predictedScoreResult.breakdown.map((sec, idx) => (
                  <div key={idx} className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-[#1B1B19] dark:text-[#F3F3EE]">
                      <span className="font-sans font-semibold">{sec.sectionName}</span>
                      <span className="font-bold">
                        {sec.primaryScore} / {sec.maxPrimaryScore} перв. б. ({sec.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#1B1B19]/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-[#1B1B19] dark:bg-[#E5C048] transition-all"
                        style={{ width: `${sec.percentage}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-[#1B1B19]/50 dark:text-gray-400 truncate">
                      Номера: {sec.tasksCovered}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#1B1B19]/10 dark:border-[#323642] flex items-center justify-between text-[11px] font-mono text-[#1B1B19]/70 dark:text-gray-300">
                <span>Итого первичных баллов: {predictedScoreResult.primaryScore} из {predictedScoreResult.maxPrimaryScore}</span>
                <span className="font-bold text-[#D4AF37] dark:text-[#E5C048]">
                  Прогноз: {selectedExamKind === 'oge' ? predictedScoreResult.gradeLabel : `${displayScore} / 100 б.`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Subject Mastery Card */}
        <div className="lg:col-span-4 border border-[#1B1B19]/15 dark:border-[#323642] bg-white dark:bg-[#1A1C24] p-6 sm:p-7 space-y-6 shadow-xs">
          <div className="label-academic border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2 font-bold opacity-100 flex items-center justify-between text-[#1B1B19] dark:text-[#F3F3EE]">
            <span>Карта компетенций</span>
            <span className="text-[#D4AF37] dark:text-[#E5C048]">ФИПИ 2026/2027</span>
          </div>

          <div className="space-y-4">
            {topTopics.length > 0 ? (
              topTopics.map((topic) => (
                <div key={topic.topicId} className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-serif text-sm font-semibold text-[#1B1B19] dark:text-[#F3F3EE] truncate max-w-[210px]">
                      {getSubjectName(topic.subject)} — {topic.topicName}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#1B1B19] dark:text-[#E5C048]">
                      {topic.masteryPercentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#1B1B19]/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#1B1B19] dark:bg-[#E5C048] transition-all"
                      style={{ width: `${topic.masteryPercentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/10 dark:border-[#323642] text-xs font-mono text-[#1B1B19]/70 dark:text-gray-300 space-y-2">
                <BookOpen className="w-5 h-5 text-[#D4AF37] dark:text-[#E5C048]" />
                <p className="leading-relaxed">
                  Пока нет решённых заданий. По мере выполнения домашних заданий и вариантов здесь отобразятся ваши сильные темы.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#1B1B19]/15 dark:border-[#323642]">
            <div className="label-academic opacity-100 mb-1 text-[#1B1B19]/70 dark:text-gray-400">Системная шкала</div>
            <p className="text-xs text-[#1B1B19]/70 dark:text-gray-300 leading-relaxed font-sans">
              Охватывает абсолютно все задания демоверсий ФИПИ 2026/2027 (ЕГЭ и ОГЭ): математику, физику, информатику и русский язык.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters (Container 2) */}
      <div className="space-y-5 pt-5 border-t border-[#1B1B19]/15 dark:border-[#323642]">
        {/* Row 1: Exam Type Filter & Subject Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Exam Type Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] self-start">
            <span className="font-mono text-[10px] uppercase font-bold text-[#1B1B19]/70 dark:text-gray-300 px-2">Экзамен:</span>
            {[
              { id: 'all', label: 'Все экзамены' },
              { id: 'ege', label: 'ЕГЭ (10–11 класс)' },
              { id: 'oge', label: 'ОГЭ (9 класс)' },
            ].map((ex) => (
              <button
                key={ex.id}
                onClick={() => setSelectedExamKind(ex.id as any)}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                  selectedExamKind === ex.id
                    ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold shadow-2xs'
                    : 'text-[#1B1B19]/70 dark:text-gray-300 hover:text-[#1B1B19] dark:hover:text-white'
                }`}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="label-academic mr-1 text-[#1B1B19]/70 dark:text-gray-300">Предмет:</span>
            {[
              { id: 'all', label: 'Все' },
              { id: 'math', label: 'Математика' },
              { id: 'physics', label: 'Физика' },
              { id: 'cs', label: 'Информатика' },
              { id: 'russian', label: 'Русский язык' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id as any)}
                className={`px-3 py-1.5 text-xs font-mono border transition cursor-pointer whitespace-nowrap ${
                  selectedSubject === s.id
                    ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19] dark:border-[#E5C048] font-bold shadow-2xs'
                    : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 dark:border-[#323642] hover:border-[#1B1B19] dark:hover:border-gray-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Level Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] w-fit">
          <button
            onClick={() => setActiveLevel('themes')}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
              activeLevel === 'themes'
                ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold shadow-2xs'
                : 'text-[#1B1B19]/70 dark:text-gray-300 hover:text-[#1B1B19] dark:hover:text-white'
            }`}
          >
            Уровень 1: Темы кодификатора ({filteredTopics.length})
          </button>
          <button
            onClick={() => setActiveLevel('exam_numbers')}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
              activeLevel === 'exam_numbers'
                ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold shadow-2xs'
                : 'text-[#1B1B19]/70 dark:text-gray-300 hover:text-[#1B1B19] dark:hover:text-white'
            }`}
          >
            Уровень 2: Номера заданий КИМ ({filteredNumbers.length})
          </button>
        </div>

        {/* Detailed Breakdown */}
        {activeLevel === 'themes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((item) => (
              <div
                key={item.topicId}
                className="p-5 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] space-y-3 flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 border ${getSubjectBadge(item.subject)}`}>
                      {getSubjectName(item.subject)} {item.examKind === 'oge' ? '• ОГЭ' : '• ЕГЭ'}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#1B1B19] dark:text-[#E5C048]">
                      {item.masteryPercentage}%
                    </span>
                  </div>

                  <h3 className="font-serif text-base font-semibold text-[#1B1B19] dark:text-[#F3F3EE] leading-snug">
                    {item.topicName}
                  </h3>

                  {item.examNumbersCovered && (
                    <div className="font-mono text-[11px] text-[#1B1B19]/80 dark:text-gray-200 bg-[#F8F7F4] dark:bg-[#16181F] px-2.5 py-1 border border-[#1B1B19]/10 dark:border-[#323642] flex items-center justify-between">
                      <span className="text-[#1B1B19]/60 dark:text-gray-400">Задания КИМ:</span>
                      <strong className="text-[#1B1B19] dark:text-[#F3F3EE]">{item.examNumbersCovered}</strong>
                    </div>
                  )}

                  <div className="h-2 bg-[#1B1B19]/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#1B1B19] dark:bg-[#E5C048] transition-all"
                      style={{ width: `${item.masteryPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1B1B19]/10 dark:border-[#323642] flex items-center justify-between text-[11px] font-mono text-[#1B1B19]/70 dark:text-gray-300">
                  <span>Решено: {item.tasksSolved} из {item.tasksTotal}</span>
                  <span className={item.masteryPercentage >= 80 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-[#1B1B19]/70 dark:text-gray-300'}>
                    {item.masteryPercentage >= 80 ? '✓ Освоено' : 'В процессе'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNumbers.map((item) => {
              const isMastered = item.status === 'mastered';
              const isInProgress = item.status === 'in_progress';
              return (
                <div
                  key={`${item.subject}-${item.examKind || 'ege'}-${item.examNumber}`}
                  onClick={() => handleToggleNumberStatus(item)}
                  className={`p-4 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] space-y-2.5 transition flex flex-col justify-between ${
                    currentRole === 'tutor' ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : ''
                  }`}
                  title={currentRole === 'tutor' ? 'Нажмите, чтобы переключить статус' : undefined}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]">
                        {item.examNumber}
                      </span>
                      <span className="font-mono text-[11px] text-[#1B1B19]/70 dark:text-gray-300">
                        {item.primaryPoints} {item.primaryPoints === 1 ? 'перв. балл' : item.primaryPoints < 5 ? 'перв. балла' : 'перв. баллов'}
                      </span>
                    </div>

                    <h4 className="font-serif text-sm font-semibold text-[#1B1B19] dark:text-[#F3F3EE] leading-snug">
                      {item.title}
                    </h4>

                    <div className="text-[10px] font-mono text-[#1B1B19]/60 dark:text-gray-400 uppercase">
                      {getSubjectName(item.subject)} {item.examKind === 'oge' ? '• ОГЭ' : '• ЕГЭ'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1B1B19]/10 dark:border-[#323642] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#1B1B19]/70 dark:text-gray-300">Точность: {item.accuracy}%</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold border ${
                        isMastered
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                          : isInProgress
                          ? 'bg-amber-50 text-amber-900 border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                          : 'bg-stone-100 text-stone-700 border-stone-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isMastered ? 'Освоено' : isInProgress ? 'В работе' : 'Не начато'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
