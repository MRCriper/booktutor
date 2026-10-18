import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Code2,
  Calculator,
  Send,
  Sparkles,
  Award,
  BookOpen,
  Pause,
  Play,
  RotateCcw,
  Check,
  Sun,
  Moon,
  Download,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExamVariant, User, VariantSubmission, AttachedFile } from '../../types';
import { storage } from '../../services/storage';
import { MathRenderer } from '../common/MathRenderer';
import { CodeSandboxModal } from '../sandbox/CodeSandboxModal';
import { ScientificCalculator } from '../common/ScientificCalculator';

interface ExamSolvingSessionProps {
  variant: ExamVariant;
  currentUser: User;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onFinish: () => void;
  onCancel: () => void;
}

export const ExamSolvingSession: React.FC<ExamSolvingSessionProps> = ({
  variant,
  currentUser,
  theme,
  onToggleTheme,
  onFinish,
  onCancel,
}) => {
  // Navigation & Answers
  const [activeTaskIdx, setActiveTaskIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentInput, setCurrentInput] = useState('');
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [partTwoScores, setPartTwoScores] = useState<Record<number, number>>({});
  const [partTwoNotes, setPartTwoNotes] = useState<Record<number, string>>({});

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState(variant.timeLimitMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Tools
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Submission State
  const [isEvaluatingPartTwo, setIsEvaluatingPartTwo] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<VariantSubmission | null>(null);

  const activeTask = variant.tasks[activeTaskIdx];

  useEffect(() => {
    if (isSubmitted || isPaused) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleInitiateFinish();
          return 0;
        }
        return prev - 1;
      });
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted, isPaused]);

  // Keep input in sync with current task
  useEffect(() => {
    if (activeTask) {
      setCurrentInput(answers[activeTask.number] || '');
    }
  }, [activeTaskIdx, activeTask]);

  const handleSaveAnswer = () => {
    if (!activeTask) return;
    setAnswers((prev) => ({
      ...prev,
      [activeTask.number]: currentInput.trim(),
    }));
  };

  const toggleFlag = (taskNum: number) => {
    setFlagged((prev) => ({
      ...prev,
      [taskNum]: !prev[taskNum],
    }));
  };

  const handleDownloadTaskFile = (file: AttachedFile) => {
    if (file.dataUrl) {
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      a.click();
    } else if (file.content) {
      const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateScores = () => {
    let primary = 0;
    const maxPrimary = variant.maxPrimaryScore || variant.tasks.reduce((acc, t) => acc + t.maxScore, 0);

    variant.tasks.forEach((t) => {
      if (!t.isPartTwo) {
        const studentAns = (answers[t.number] || '').trim().toLowerCase().replace(',', '.');
        const correctAns = (t.correctAnswer || '').trim().toLowerCase().replace(',', '.');
        if (studentAns && studentAns === correctAns) {
          primary += t.maxScore;
        }
      } else {
        primary += (partTwoScores[t.number] || 0);
      }
    });

    // Secondary score scaling formula (approximating Russian EGE curves)
    let secondary = 0;
    if (maxPrimary > 0) {
      const ratio = primary / maxPrimary;
      if (ratio <= 0.25) secondary = Math.round(ratio * 120);
      else if (ratio <= 0.5) secondary = Math.round(30 + (ratio - 0.25) * 120);
      else if (ratio <= 0.8) secondary = Math.round(60 + (ratio - 0.5) * 80);
      else secondary = Math.min(100, Math.round(84 + (ratio - 0.8) * 80));
    }

    return { primary, maxPrimary, secondary };
  };

  const handleInitiateFinish = () => {
    handleSaveAnswer();
    // If variant has Part 2 tasks, first prompt student to self-assess their Part 2 points
    if (variant.tasks.some((t) => t.isPartTwo)) {
      setIsEvaluatingPartTwo(true);
    } else {
      finalizeSubmission();
    }
  };

  const finalizeSubmission = () => {
    handleSaveAnswer();
    const { primary, maxPrimary, secondary } = calculateScores();

    const submission: VariantSubmission = storage.saveVariantSubmission({
      variantId: variant.id,
      variantTitle: variant.title,
      studentId: currentUser.id,
      studentName: currentUser.name,
      subject: variant.subject,
      answers,
      partTwoScores,
      partTwoNotes,
      timeSpentSeconds: elapsedSeconds,
      totalPrimaryScore: primary,
      maxPrimaryScore: maxPrimary,
      secondaryScore: secondary,
      status: 'completed',
    });

    // Also update any matching homework to submitted
    const homeworks = storage.getHomeworks();
    const matchingHw = homeworks.find(
      (h) => h.studentId === currentUser.id && h.title.includes(variant.title)
    );
    if (matchingHw) {
      storage.submitHomework(matchingHw.id);
    }

    setSubmissionResult(submission);
    setIsEvaluatingPartTwo(false);
    setIsSubmitted(true);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleUpdatePartTwoScore = (taskNum: number, score: number) => {
    const updatedScores = { ...partTwoScores, [taskNum]: score };
    setPartTwoScores(updatedScores);

    // If already submitted, update the submission in storage right away!
    if (submissionResult) {
      let newPrimary = 0;
      variant.tasks.forEach((t) => {
        if (!t.isPartTwo) {
          const studentAns = (answers[t.number] || '').trim().toLowerCase().replace(',', '.');
          const correctAns = (t.correctAnswer || '').trim().toLowerCase().replace(',', '.');
          if (studentAns && studentAns === correctAns) newPrimary += t.maxScore;
        } else {
          newPrimary += (updatedScores[t.number] || 0);
        }
      });
      const ratio = newPrimary / submissionResult.maxPrimaryScore;
      const newSec = Math.min(100, Math.round(ratio * 100));
      const updatedSub: VariantSubmission = {
        ...submissionResult,
        partTwoScores: updatedScores,
        totalPrimaryScore: newPrimary,
        secondaryScore: newSec,
      };
      setSubmissionResult(updatedSub);
      storage.updateVariantSubmission(updatedSub);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#0F1117] text-[#1B1B19] dark:text-[#F3F3EE] flex flex-col font-sans">
      {/* Top Header Exam Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#16181F] border-b border-[#1B1B19] dark:border-[#323642] px-4 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-1.5 border border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19] text-[#1B1B19] dark:text-[#F3F3EE] transition"
              title="Выйти из режима экзамена"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="label-academic text-[#D4AF37]">
                  {variant.subject.toUpperCase()} • {variant.examType}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[#1B1B19]/20 dark:border-[#323642]">
                  {variant.tasks.length} заданий
                </span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] leading-tight">
                {variant.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            {!isSubmitted && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 border font-mono font-bold text-sm ${
                  secondsRemaining < 600
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 animate-pulse'
                    : 'border-[#1B1B19] dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE]'
                }`}
              >
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span>{formatTime(secondsRemaining)}</span>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-1 hover:text-[#D4AF37] ml-1"
                  title={isPaused ? 'Продолжить' : 'Пауза'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Quick Tools */}
            <div className="flex items-center gap-1.5">
              {variant.subject === 'cs' && (
                <button
                  onClick={() => setIsCodeModalOpen(true)}
                  className="px-3 py-1.5 bg-white dark:bg-[#1A1C24] hover:bg-[#F8F7F4] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] font-mono text-xs font-bold uppercase transition flex items-center gap-1.5"
                  title="Открыть Python IDE"
                >
                  <Code2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>IDE Python</span>
                </button>
              )}

              <button
                onClick={() => setIsCalcOpen(true)}
                className="px-3 py-1.5 bg-white dark:bg-[#1A1C24] hover:bg-[#F8F7F4] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] font-mono text-xs font-bold uppercase transition flex items-center gap-1.5"
                title="Научный калькулятор"
              >
                <Calculator className="w-4 h-4 text-[#D4AF37]" />
                <span>Калькулятор</span>
              </button>

              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className={`px-2.5 py-1.5 border font-mono text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer select-none ${
                    theme === 'dark'
                      ? 'bg-[#1E222D] hover:bg-[#282D3C] text-[#E5C048] border-[#E5C048]'
                      : 'bg-white hover:bg-[#F8F7F4] text-[#1B1B19] border-[#1B1B19]'
                  }`}
                  title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-[#E5C048]" />
                      <span className="text-[10px] uppercase font-bold text-[#E5C048]">Светлая</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-[#1B1B19]" />
                      <span className="text-[10px] uppercase font-bold">Тёмная</span>
                    </>
                  )}
                </button>
              )}

              {!isSubmitted ? (
                <button
                  onClick={handleInitiateFinish}
                  className="px-4 py-1.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-mono text-xs font-bold uppercase tracking-wider transition shadow-2xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#D4AF37] dark:text-[#121316]" />
                  Завершить экзамен
                </button>
              ) : (
                <button
                  onClick={onFinish}
                  className="px-4 py-1.5 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-mono text-xs font-bold uppercase tracking-wider transition"
                >
                  Вернуться к списку
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center: Active Task Area or Results */}
        <div className="lg:col-span-3 space-y-4">
          {!isSubmitted ? (
            isEvaluatingPartTwo ? (
              /* Step 1: Part 2 Self-Evaluation by Criteria */
              <div className="bg-white dark:bg-[#16181F] border-2 border-[#1B1B19] dark:border-[#E5C048] p-5 sm:p-7 shadow-lg space-y-6">
                <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="label-academic text-[#D4AF37]">Шаг 1 из 2: Самопроверка по критериям ФИПИ</div>
                    <h3 className="font-serif text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                      Проверка заданий 2-й части (Развёрнутый ответ)
                    </h3>
                    <p className="font-mono text-xs text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">
                      Сверьтесь с эталоном решения и критериями. Выставьте баллы за каждый номер, затем подтвердите результат.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEvaluatingPartTwo(false)}
                    className="font-mono text-xs px-3 py-1.5 border border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19] self-start"
                  >
                    ← Вернуться к КИМ
                  </button>
                </div>

                <div className="space-y-5">
                  {variant.tasks
                    .filter((t) => t.isPartTwo)
                    .map((t) => {
                      const currentPts = partTwoScores[t.number] || 0;
                      return (
                        <div
                          key={t.number}
                          className="p-5 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19] dark:border-[#323642] space-y-4 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2">
                            <span className="font-bold text-base text-[#1B1B19] dark:text-[#F3F3EE]">
                              Задание №{t.number}: {t.title}
                            </span>
                            <span className="px-2.5 py-1 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold text-xs uppercase">
                              Максимум: {t.maxScore} б.
                            </span>
                          </div>

                          <div className="text-sm font-sans text-[#1B1B19] dark:text-[#F3F3EE] p-3.5 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] leading-relaxed">
                            <MathRenderer content={t.description} />
                          </div>

                          {t.solution && (
                            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-600/40 space-y-1">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                                Авторское решение и верный ответ:
                              </span>
                              <div className="text-emerald-950 dark:text-emerald-100">
                                <MathRenderer content={t.solution} />
                              </div>
                            </div>
                          )}

                          {t.criteria && (
                            <div className="p-3.5 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] space-y-1">
                              <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] block">
                                Критерии оценивания ФИПИ:
                              </span>
                              <div className="text-[#1B1B19]/80 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-[11px]">
                                {t.criteria}
                              </div>
                            </div>
                          )}

                          {/* Score selector */}
                          <div className="p-3 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] flex flex-wrap items-center justify-between gap-3">
                            <span className="font-bold text-xs">
                              Выставить себе первичный балл:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: t.maxScore + 1 }, (_, i) => i).map((scoreVal) => (
                                <button
                                  key={scoreVal}
                                  type="button"
                                  onClick={() => handleUpdatePartTwoScore(t.number, scoreVal)}
                                  className={`w-9 h-9 font-bold text-xs border-2 transition cursor-pointer ${
                                    currentPts === scoreVal
                                      ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] dark:border-[#E5C048] shadow-xs scale-105'
                                      : 'bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
                                  }`}
                                >
                                  {scoreVal}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="pt-4 border-t border-[#1B1B19]/15 dark:border-[#323642] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="font-mono text-xs text-[#1B1B19]/70 dark:text-gray-300">
                    Баллов за 2-ю часть:{' '}
                    <span className="font-bold text-[#1B1B19] dark:text-[#E5C048]">
                      {Object.values(partTwoScores).reduce((a, b) => a + b, 0)} б.
                    </span>
                  </div>
                  <button
                    onClick={finalizeSubmission}
                    className="w-full sm:w-auto px-6 py-3 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-mono text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] dark:text-[#121316]" />
                    Утвердить баллы и получить итоговый результат
                  </button>
                </div>
              </div>
            ) : activeTask ? (
              <div className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] shadow-2xs p-5 sm:p-7 space-y-6">
                {/* Task meta line */}
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1B1B19]/15 dark:border-[#323642] gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#D4AF37] inline-block" />
                    <h3 className="font-serif text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                      Задание №{activeTask.number}
                    </h3>
                    <span className="font-mono text-xs text-[#1B1B19]/60 dark:text-gray-400">
                      ({activeTask.maxScore} {activeTask.maxScore === 1 ? 'балл' : 'балла'})
                    </span>
                    {activeTask.isPartTwo && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#F8F7F4] dark:bg-[#1A1C24] border border-[#1B1B19]/30 dark:border-[#323642] uppercase font-bold text-[#D4AF37]">
                        Часть 2 (Развёрнутый ответ)
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleFlag(activeTask.number)}
                    className={`font-mono text-xs px-2.5 py-1 border transition flex items-center gap-1.5 ${
                      flagged[activeTask.number]
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-600'
                        : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19]/70 dark:text-gray-400 border-[#1B1B19]/25 dark:border-[#323642]'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {flagged[activeTask.number] ? 'Отмечено флажком' : 'Поставить флажок'}
                  </button>
                </div>

                {/* Task Condition Text */}
                <div className="text-sm leading-relaxed text-[#1B1B19] dark:text-[#F3F3EE] space-y-3">
                  <MathRenderer content={activeTask.description} />
                </div>

                {/* Optional Formula */}
                {activeTask.formula && (
                  <div className="p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642] flex items-center gap-3">
                    <span className="label-academic text-[#D4AF37] shrink-0 font-bold">Формула:</span>
                    <MathRenderer content={`$$${activeTask.formula.replace(/^\$+|\$+$/g, '')}$$`} />
                  </div>
                )}

                {/* Optional Task Image / Drawing for all subjects */}
                {activeTask.imageUrl && (
                  <div className="p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-[#1B1B19]/70 dark:text-gray-300">
                      <span className="font-bold flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#D4AF37]" /> Иллюстрация / Чертёж к задаче:
                      </span>
                    </div>
                    <div className="bg-white dark:bg-[#1A1C24] p-2 border border-[#1B1B19]/15 dark:border-[#323642] flex justify-center">
                      <img
                        src={activeTask.imageUrl}
                        alt={`Иллюстрация к заданию ${activeTask.number}`}
                        className="max-h-72 object-contain rounded-xs shadow-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Attached Data Files (Informatics, etc.) */}
                {activeTask.attachedFiles && activeTask.attachedFiles.length > 0 && (
                  <div className="p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#D4AF37]" /> Прикреплённые файлы данных ({activeTask.attachedFiles.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCodeModalOpen(true)}
                        className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5" /> Открыть в песочнице с файлами →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeTask.attachedFiles.map((file, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center justify-between p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] text-xs font-mono"
                        >
                          <div className="truncate mr-2">
                            <div className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] truncate flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </div>
                            <div className="text-[10px] text-[#1B1B19]/50 dark:text-gray-400">
                              {file.size || 'Файл данных'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownloadTaskFile(file)}
                            className="px-2.5 py-1 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> Скачать
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CS: Embedded starter code preview if available */}
                {variant.subject === 'cs' && activeTask.starterCode && (
                  <div className="p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19] dark:border-[#323642] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#D4AF37] flex items-center gap-1">
                        <Code2 className="w-3.5 h-3.5" /> Шаблон решения для задачи {activeTask.number}:
                      </span>
                      <button
                        onClick={() => setIsCodeModalOpen(true)}
                        className="text-[11px] underline font-bold hover:text-[#D4AF37]"
                      >
                        Запустить в IDE →
                      </button>
                    </div>
                    <pre className="font-mono text-xs bg-white dark:bg-[#1A1C24] p-3 border border-[#1B1B19]/20 dark:border-[#323642] overflow-x-auto">
                      {activeTask.starterCode}
                    </pre>
                  </div>
                )}

                {/* Answer input container */}
                <div className="pt-4 border-t border-[#1B1B19]/15 dark:border-[#323642] space-y-3">
                  {!activeTask.isPartTwo ? (
                    <div>
                      <label className="label-academic block mb-1.5">
                        Ответ к заданию №{activeTask.number} (число, слово или последовательность):
                      </label>
                      <div className="flex items-center gap-2 max-w-md">
                        <input
                          type="text"
                          value={currentInput}
                          onChange={(e) => setCurrentInput(e.target.value)}
                          onBlur={handleSaveAnswer}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveAnswer();
                              if (activeTaskIdx < variant.tasks.length - 1) {
                                setActiveTaskIdx(activeTaskIdx + 1);
                              }
                            }
                          }}
                          placeholder="Введите ваш ответ..."
                          className="flex-1 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19] dark:border-[#323642] font-mono text-sm focus:outline-none focus:bg-white dark:focus:bg-[#1A1C24]"
                        />
                        <button
                          onClick={() => {
                            handleSaveAnswer();
                            if (activeTaskIdx < variant.tasks.length - 1) {
                              setActiveTaskIdx(activeTaskIdx + 1);
                            }
                          }}
                          className="px-4 py-2.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-mono text-xs font-bold uppercase tracking-wider transition"
                        >
                          Сохранить
                        </button>
                      </div>
                      <span className="text-[11px] font-mono text-[#1B1B19]/50 dark:text-gray-400 mt-1 block">
                        Ответ сохранится автоматически при переходе к следующему номеру.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <label className="label-academic block mb-1.5">
                        Черновик / заметки к решению второй части:
                      </label>
                      <textarea
                        value={partTwoNotes[activeTask.number] || ''}
                        onChange={(e) =>
                          setPartTwoNotes({
                            ...partTwoNotes,
                            [activeTask.number]: e.target.value,
                          })
                        }
                        rows={4}
                        placeholder="Запишите ход решения или тезисы доказательства..."
                        className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-3 border border-[#1B1B19] dark:border-[#323642] font-mono text-xs focus:outline-none focus:bg-white dark:focus:bg-[#1A1C24] leading-relaxed"
                      />
                      <p className="text-[11px] font-mono text-[#1B1B19]/60 dark:text-gray-400 mt-1">
                        После нажатия «Завершить экзамен» вы сможете свериться с официальными критериями и поставить баллы.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom prev/next arrows */}
                <div className="pt-4 border-t border-[#1B1B19]/15 dark:border-[#323642] flex justify-between items-center">
                  <button
                    disabled={activeTaskIdx === 0}
                    onClick={() => {
                      handleSaveAnswer();
                      setActiveTaskIdx((prev) => Math.max(0, prev - 1));
                    }}
                    className="px-3.5 py-2 bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] font-mono text-xs uppercase disabled:opacity-30 transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Предыдущее
                  </button>

                  <span className="font-mono text-xs text-[#1B1B19]/60 dark:text-gray-400">
                    {activeTaskIdx + 1} из {variant.tasks.length}
                  </span>

                  <button
                    disabled={activeTaskIdx === variant.tasks.length - 1}
                    onClick={() => {
                      handleSaveAnswer();
                      setActiveTaskIdx((prev) => Math.min(variant.tasks.length - 1, prev + 1));
                    }}
                    className="px-3.5 py-2 bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] font-mono text-xs uppercase disabled:opacity-30 transition flex items-center gap-1.5"
                  >
                    Следующее <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : null
          ) : (
            /* Results View */
            submissionResult && (
              <div className="space-y-6">
                {/* Score card */}
                <div className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1B1B19]/15 dark:border-[#323642] pb-4 gap-3">
                    <div>
                      <span className="label-academic text-[#D4AF37]">Экзамен завершён</span>
                      <h2 className="font-serif text-3xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                        Результаты: {variant.title}
                      </h2>
                      <p className="font-mono text-xs text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">
                        Ученик: {submissionResult.studentName} • Затрачено времени: {formatTime(submissionResult.timeSpentSeconds)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-center">
                      <div className="p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19] dark:border-[#323642]">
                        <span className="label-academic block">Первичный балл</span>
                        <span className="font-mono text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                          {submissionResult.totalPrimaryScore} / {submissionResult.maxPrimaryScore}
                        </span>
                      </div>
                      <div className="p-3 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] border border-[#1B1B19] dark:border-[#E5C048]">
                        <span className="font-mono text-[10px] uppercase tracking-wider block opacity-75">
                          Вторичный балл
                        </span>
                        <span className="font-mono text-3xl font-bold">
                          {submissionResult.secondaryScore}
                          <span className="text-xs font-normal opacity-70"> / 100</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-600 text-emerald-800 dark:text-emerald-300 font-mono text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Результат сохранён в ведомость успеваемости. Преподаватель (Мальцев Роман Михайлович) видит ваши ответы и критерии. Начислено +150 XP!
                    </span>
                  </div>
                </div>

                {/* Part 2 Self-Evaluation Rubrics */}
                {variant.tasks.some((t) => t.isPartTwo) && (
                  <div className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-2xs space-y-4">
                    <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2">
                      <span className="label-academic text-[#D4AF37]">Критерии ФИПИ</span>
                      <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                        Самооценка развёрнутых заданий 2-й части
                      </h3>
                      <p className="font-mono text-xs text-[#1B1B19]/60 dark:text-gray-400">
                        Сверьтесь с авторским решением и критериями, выберите начисленные баллы:
                      </p>
                    </div>

                    <div className="space-y-4">
                      {variant.tasks
                        .filter((t) => t.isPartTwo)
                        .map((t) => {
                          const currentPts = partTwoScores[t.number] || 0;
                          return (
                            <div
                              key={t.number}
                              className="p-4 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19] dark:border-[#323642] space-y-3 text-xs font-mono"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-[#1B1B19] dark:text-[#F3F3EE]">
                                  Задание №{t.number}: {t.title}
                                </span>
                                <span className="text-xs text-[#D4AF37] font-bold">
                                  Максимум: {t.maxScore} б.
                                </span>
                              </div>

                              {t.solution && (
                                <div className="p-3 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] space-y-1">
                                  <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] block">
                                    Авторское решение:
                                  </span>
                                  <MathRenderer content={t.solution} />
                                </div>
                              )}

                              {t.criteria && (
                                <div className="text-[#1B1B19]/80 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">Критерии:</span>
                                  <br />
                                  {t.criteria}
                                </div>
                              )}

                              {/* Points selector */}
                              <div className="pt-2 flex items-center gap-2">
                                <span className="font-bold">Выставить себе балл:</span>
                                {Array.from({ length: t.maxScore + 1 }, (_, i) => i).map((scoreVal) => (
                                  <button
                                    key={scoreVal}
                                    onClick={() => handleUpdatePartTwoScore(t.number, scoreVal)}
                                    className={`w-8 h-8 font-bold border transition ${
                                      currentPts === scoreVal
                                        ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316]'
                                        : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
                                    }`}
                                  >
                                    {scoreVal}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Detailed Table of Part 1 Answers */}
                <div className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-2xs space-y-3">
                  <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2">
                    <span className="label-academic text-[#D4AF37]">Сверка ответов</span>
                    <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                      Подробный разбор заданий
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono text-left">
                      <thead className="border-b border-[#1B1B19] dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316]">
                        <tr>
                          <th className="p-2.5">№</th>
                          <th className="p-2.5">Задание</th>
                          <th className="p-2.5">Ваш ответ</th>
                          <th className="p-2.5">Правильный ответ</th>
                          <th className="p-2.5">Балл</th>
                          <th className="p-2.5">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1B1B19]/10 dark:divide-[#323642]">
                        {variant.tasks.map((t) => {
                          const studentAns = (answers[t.number] || '').trim();
                          const correctAns = (t.correctAnswer || '').trim();
                          const isCorrect =
                            !t.isPartTwo &&
                            studentAns.toLowerCase().replace(',', '.') ===
                              correctAns.toLowerCase().replace(',', '.');

                          return (
                            <tr key={t.number} className="hover:bg-[#F8F7F4] dark:hover:bg-[#1A1C24]/50">
                              <td className="p-2.5 font-bold">№{t.number}</td>
                              <td className="p-2.5 truncate max-w-xs">{t.title}</td>
                              <td className="p-2.5 font-bold">
                                {t.isPartTwo ? '(Развёрнутый)' : studentAns || '—'}
                              </td>
                              <td className="p-2.5 text-emerald-700 dark:text-emerald-400 font-bold">
                                {t.isPartTwo ? 'По критериям' : correctAns}
                              </td>
                              <td className="p-2.5 font-bold">
                                {t.isPartTwo
                                  ? `${partTwoScores[t.number] || 0} / ${t.maxScore}`
                                  : isCorrect
                                  ? `${t.maxScore} / ${t.maxScore}`
                                  : `0 / ${t.maxScore}`}
                              </td>
                              <td className="p-2.5">
                                {t.isPartTwo ? (
                                  <span className="text-amber-600 font-bold">Критерии</span>
                                ) : isCorrect ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Верно
                                  </span>
                                ) : (
                                  <span className="text-rose-700 font-bold flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5" /> Неверно
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Sidebar: Kompege/ReshuEGE style Task Navigator Grid */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2">
              <span className="label-academic">Навигация по КИМ</span>
              <span className="font-mono text-xs text-[#1B1B19]/60 dark:text-gray-400">
                {Object.keys(answers).length} / {variant.tasks.length}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 font-mono text-xs">
              {variant.tasks.map((t, idx) => {
                const isCurrent = idx === activeTaskIdx && !isSubmitted;
                const isAnswered = Boolean(answers[t.number]?.trim());
                const isFlaggedItem = Boolean(flagged[t.number]);

                let btnClass = 'bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642]';

                if (isAnswered) {
                  btnClass = 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19] font-bold';
                }
                if (isFlaggedItem) {
                  btnClass = 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-600 font-bold';
                }
                if (isCurrent) {
                  btnClass += ' ring-2 ring-[#D4AF37] ring-offset-1 font-bold';
                }

                return (
                  <button
                    key={t.number}
                    onClick={() => {
                      handleSaveAnswer();
                      setActiveTaskIdx(idx);
                    }}
                    className={`h-9 border relative flex items-center justify-center transition ${btnClass}`}
                  >
                    <span>{t.number}</span>
                    {isFlaggedItem && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#1B1B19]/15 dark:border-[#323642] space-y-1.5 text-[11px] font-mono text-[#1B1B19]/60 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#1B1B19] dark:bg-[#E5C048] inline-block" />
                <span>Ответ введён</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/30 inline-block" />
                <span>Не решено</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-100 border border-amber-600 inline-block" />
                <span>Отмечено флажком</span>
              </div>
            </div>
          </div>

          {/* System info */}
          <div className="p-4 bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] text-xs font-mono space-y-2">
            <span className="label-academic text-[#D4AF37]">BookTutor Exam Engine</span>
            <p className="text-[#1B1B19]/70 dark:text-gray-400 text-[11px] leading-relaxed">
              Шкала перевода первичных баллов откалибрована по актуальным нормативам ФИПИ 2026 года.
            </p>
          </div>
        </div>
      </main>

      {/* Floating tools modals */}
      <CodeSandboxModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        defaultTaskTitle={activeTask ? `Задание №${activeTask.number}` : undefined}
        initialCode={activeTask?.starterCode}
        initialFiles={activeTask?.attachedFiles}
      />

      <ScientificCalculator
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onInsertValue={(val) => {
          setCurrentInput(val);
          handleSaveAnswer();
        }}
      />
    </div>
  );
};
