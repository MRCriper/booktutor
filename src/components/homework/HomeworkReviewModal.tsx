import React, { useState, useMemo } from 'react';
import {
  Homework,
  Task,
  User,
  HomeworkTaskItem,
} from '../../types';
import { MathRenderer } from '../common/MathRenderer';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  User as UserIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Check,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HomeworkReviewModalProps {
  homework: Homework;
  student?: User;
  tasks: Task[];
  onClose: () => void;
  onSaveGrading: (updatedHomework: Homework) => void;
}

export const HomeworkReviewModal: React.FC<HomeworkReviewModalProps> = ({
  homework,
  student,
  tasks,
  onClose,
  onSaveGrading,
}) => {
  // Task scores & comments local state
  const [taskGrading, setTaskGrading] = useState<Record<string, { score: number; tutorComment: string }>>(() => {
    const map: Record<string, { score: number; tutorComment: string }> = {};
    homework.tasks.forEach((t) => {
      map[t.taskId] = {
        score: t.score !== undefined ? t.score : (t.isCorrect ? (t.maxScore || 1) : (t.maxScore || 1)),
        tutorComment: t.tutorComment || '',
      };
    });
    return map;
  });

  // Balanced 5-point school mark (5, 4, 3, 2)
  const defaultMark: 5 | 4 | 3 | 2 = useMemo(() => {
    if (homework.mark && [5, 4, 3, 2].includes(homework.mark)) {
      return homework.mark;
    }
    if (homework.grade) {
      if (homework.grade <= 5 && homework.grade >= 2) {
        return Math.round(homework.grade) as 5 | 4 | 3 | 2;
      }
      if (homework.grade >= 85) return 5;
      if (homework.grade >= 70) return 4;
      if (homework.grade >= 50) return 3;
      return 2;
    }
    return 5;
  }, [homework.mark, homework.grade]);

  const [selectedMark, setSelectedMark] = useState<5 | 4 | 3 | 2>(defaultMark);
  const [tutorFeedback, setTutorFeedback] = useState(
    homework.tutorFeedback ||
      'Отличная проработка решений! Все ключевые этапы и формулы обоснованы.'
  );
  const [returnForRevision, setReturnForRevision] = useState(false);

  // Expanded task reference solutions toggle
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  // Photo viewer lightbox state
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoRotation, setPhotoRotation] = useState(0);
  const [highContrast, setHighContrast] = useState(false);

  const photos = homework.photos || [];

  // Compute total earned points and total possible points
  const pointsSummary = useMemo(() => {
    let earned = 0;
    let total = 0;
    homework.tasks.forEach((t) => {
      const maxPts = t.maxScore || 1;
      total += maxPts;
      const currentPts = taskGrading[t.taskId]?.score !== undefined ? taskGrading[t.taskId].score : maxPts;
      earned += currentPts;
    });
    return { earned, total };
  }, [homework.tasks, taskGrading]);

  const handleScoreChange = (taskId: string, newScore: number) => {
    setTaskGrading((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        score: Math.max(0, newScore),
      },
    }));

    // Auto-suggest balanced mark based on points ratio
    const currentTotal = pointsSummary.total || 1;
    let tempEarned = 0;
    homework.tasks.forEach((t) => {
      const s = t.taskId === taskId ? newScore : (taskGrading[t.taskId]?.score ?? 1);
      tempEarned += s;
    });

    const ratio = tempEarned / currentTotal;
    if (ratio >= 0.85) setSelectedMark(5);
    else if (ratio >= 0.7) setSelectedMark(4);
    else if (ratio >= 0.5) setSelectedMark(3);
    else setSelectedMark(2);
  };

  const handleTaskCommentChange = (taskId: string, comment: string) => {
    setTaskGrading((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        tutorComment: comment,
      },
    }));
  };

  const toggleSolution = (taskId: string) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleQuickFeedback = (text: string) => {
    setTutorFeedback((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedTasks: HomeworkTaskItem[] = homework.tasks.map((t) => {
      const graded = taskGrading[t.taskId];
      const maxPts = t.maxScore || 1;
      const score = graded ? graded.score : maxPts;
      return {
        ...t,
        score,
        maxScore: maxPts,
        isCorrect: score >= maxPts,
        tutorComment: graded ? graded.tutorComment : t.tutorComment,
      };
    });

    const status = returnForRevision ? 'assigned' : 'graded';

    const updated: Homework = {
      ...homework,
      status,
      grade: selectedMark,
      mark: selectedMark,
      earnedPoints: pointsSummary.earned,
      totalPoints: pointsSummary.total,
      tutorFeedback: tutorFeedback.trim(),
      tasks: updatedTasks,
    };

    if (!returnForRevision) {
      confetti({ particleCount: 50, spread: 60 });
    }

    onSaveGrading(updated);
  };

  const subjectLabel =
    homework.subject === 'math'
      ? 'Математика'
      : homework.subject === 'physics'
      ? 'Физика'
      : homework.subject === 'cs'
      ? 'Информатика'
      : 'Русский язык';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-[#15171E] border border-[#1B1B19] dark:border-[#383C4A] shadow-2xl my-4 text-xs flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#1B1B19]/15 dark:border-[#323642] flex items-start justify-between gap-3 bg-[#FAF9F5] dark:bg-[#1A1C24] shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold uppercase">
                {subjectLabel}
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 border font-bold ${
                  homework.status === 'graded'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                    : homework.status === 'submitted'
                    ? 'bg-amber-50 text-amber-900 border-amber-400 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                    : 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {homework.status === 'graded'
                  ? `Проверено (Оценка «${homework.mark || homework.grade || 5}»)`
                  : homework.status === 'submitted'
                  ? '⏳ Сдано учеником (ожидает проверки)'
                  : 'В процессе'}
              </span>
              {homework.submittedAt && (
                <span className="font-mono text-[11px] text-[#1B1B19]/60 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  Сдано:{' '}
                  {new Date(homework.submittedAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
              {homework.title}
            </h2>

            <div className="text-xs font-mono text-[#1B1B19]/70 dark:text-gray-300 mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                <UserIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                {student?.name || 'Ученик'}
              </span>
              <span>•</span>
              <span>{student?.grade || '11 класс'}</span>
              <span>•</span>
              <span>Дедлайн: {homework.dueDate}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#1B1B19]/50 hover:text-[#1B1B19] dark:text-gray-400 dark:hover:text-white transition cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 bg-white dark:bg-[#15171E]">
          {/* SECTION 1: WHAT THE STUDENT SUBMITTED (Photos & Comment) */}
          <div className="p-4 sm:p-5 bg-[#FAF9F5] dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-serif text-base font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                  Что прислал ученик
                </h3>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold uppercase">
                {photos.length > 0 ? `📷 ${photos.length} фото решения` : 'Без фото'}
              </span>
            </div>

            {/* Student Comment */}
            {homework.studentComment ? (
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 text-xs font-sans text-amber-950 dark:text-amber-100 space-y-1">
                <div className="font-mono text-[10px] uppercase font-bold text-amber-800 dark:text-[#E5C048] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Комментарий / вопрос ученика к решению:
                </div>
                <div className="text-xs leading-relaxed italic">
                  «{homework.studentComment}»
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-[#1B1B19]/50 dark:text-gray-400 italic">
                Ученик не оставил текстового комментария при отправке.
              </div>
            )}

            {/* Student Attached Photos Gallery */}
            {photos.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Фотографии рукописных решений из тетради ({photos.length}):
                  </span>
                  <span className="text-[#1B1B19]/60 dark:text-gray-400 text-[11px]">
                    Нажмите на фото для детального зума и поворота
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setActivePhotoIndex(index);
                        setPhotoZoom(1);
                        setPhotoRotation(0);
                      }}
                      className="group relative cursor-pointer border border-[#1B1B19]/25 dark:border-[#383C4A] bg-white dark:bg-[#12141A] p-1.5 hover:border-[#1B1B19] dark:hover:border-[#E5C048] transition shadow-2xs overflow-hidden"
                    >
                      <div className="aspect-3/4 w-full bg-[#FAF9F5] dark:bg-[#181A22] overflow-hidden flex items-center justify-center relative">
                        <img
                          src={photo}
                          alt={`Фото решения лист #${index + 1}`}
                          className="object-contain w-full h-full group-hover:scale-105 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 bg-[#1B1B19]/80 text-white font-mono text-[10px] px-2 py-1 rounded-xs flex items-center gap-1 transition">
                            <Maximize2 className="w-3 h-3" /> Просмотр
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-[#1B1B19]/70 dark:text-gray-300 px-1">
                        <span>Лист #{index + 1}</span>
                        <span className="text-[#D4AF37] font-bold">Увеличить</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-[#12141A] border border-dashed border-[#1B1B19]/20 dark:border-[#323642] text-center font-mono text-xs text-[#1B1B19]/50 dark:text-gray-400">
                Фотографии тетради не прикреплены. Ученик ввел текстовые / программные ответы ниже.
              </div>
            )}
          </div>

          {/* SECTION 2: TASK-BY-TASK INSPECTION & SCORING */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2">
              <h3 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2">
                <span>Проверка заданий по пунктам</span>
                <span className="font-mono text-xs font-normal text-[#1B1B19]/60 dark:text-gray-400">
                  ({homework.tasks.length} {homework.tasks.length === 1 ? 'задание' : 'заданий'})
                </span>
              </h3>

              <div className="font-mono text-xs text-[#1B1B19] dark:text-[#F3F3EE] font-bold">
                Сумма баллов: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{pointsSummary.earned}</span> / {pointsSummary.total} б.
              </div>
            </div>

            <div className="space-y-4">
              {homework.tasks.map((taskItem, idx) => {
                const foundTask = tasks.find((t) => t.id === taskItem.taskId);
                const currentScore = taskGrading[taskItem.taskId]?.score ?? (taskItem.maxScore || 1);
                const maxPts = taskItem.maxScore || (foundTask?.difficulty === 'hard' ? 4 : foundTask?.difficulty === 'medium' ? 3 : 1);
                const isExpanded = expandedSolutions[taskItem.taskId];

                return (
                  <div
                    key={taskItem.taskId}
                    className="p-4 sm:p-5 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/25 dark:border-[#323642] space-y-3.5 shadow-2xs"
                  >
                    {/* Task Title & Points */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1B1B19]/10 dark:border-[#323642]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-mono font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <h4 className="font-serif text-base font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                          {foundTask ? foundTask.title : `Задание ${taskItem.taskId}`}
                        </h4>
                        {foundTask?.examNumber && (
                          <span className="font-mono text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold">
                            {foundTask.examNumber}
                          </span>
                        )}
                      </div>

                      {/* Score quick setter */}
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-[#1B1B19]/60 dark:text-gray-400">Балл за задачу:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleScoreChange(taskItem.taskId, maxPts)}
                            className={`px-2 py-0.5 border font-bold transition cursor-pointer ${
                              currentScore === maxPts
                                ? 'bg-emerald-700 text-white border-emerald-800'
                                : 'bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 hover:border-emerald-600'
                            }`}
                            title={`Поставить полный балл (${maxPts} б.)`}
                          >
                            ✓ {maxPts} б.
                          </button>

                          {maxPts > 1 && (
                            <button
                              type="button"
                              onClick={() => handleScoreChange(taskItem.taskId, Math.round(maxPts / 2))}
                              className={`px-2 py-0.5 border font-bold transition cursor-pointer ${
                                currentScore > 0 && currentScore < maxPts
                                  ? 'bg-amber-600 text-white border-amber-700'
                                  : 'bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 hover:border-amber-500'
                              }`}
                              title="Частично верное решение"
                            >
                              ½ {Math.round(maxPts / 2)} б.
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleScoreChange(taskItem.taskId, 0)}
                            className={`px-2 py-0.5 border font-bold transition cursor-pointer ${
                              currentScore === 0
                                ? 'bg-rose-700 text-white border-rose-800'
                                : 'bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 hover:border-rose-600'
                            }`}
                            title="Неверно (0 б.)"
                          >
                            ✗ 0 б.
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Task Description */}
                    {foundTask && (
                      <div className="text-xs leading-relaxed text-[#1B1B19]/80 dark:text-gray-300">
                        <MathRenderer content={foundTask.description} />
                      </div>
                    )}

                    {/* Student Submitted Answer / Code */}
                    <div className="p-3 bg-[#FAF9F5] dark:bg-[#12141A] border border-[#1B1B19]/20 dark:border-[#383C4A] space-y-2">
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase font-bold text-[#1B1B19]/60 dark:text-gray-400">
                        <span>Ответ ученика:</span>
                        {foundTask?.correctAnswer && (
                          <span>Эталонный ответ: <strong className="text-emerald-700 dark:text-emerald-400">{foundTask.correctAnswer}</strong></span>
                        )}
                      </div>

                      <div className="font-mono text-xs font-bold text-[#1B1B19] dark:text-[#F3F3EE] bg-white dark:bg-[#181A22] p-2.5 border border-[#1B1B19]/15 dark:border-[#323642]">
                        {taskItem.studentAnswer ? (
                          <span>{taskItem.studentAnswer}</span>
                        ) : (
                          <span className="text-[#1B1B19]/40 dark:text-gray-500 italic">Текстовый ответ не введен (см. фото листа вверху)</span>
                        )}
                      </div>

                      {taskItem.studentCode && (
                        <div className="space-y-1 pt-1">
                          <div className="font-mono text-[10px] text-[#1B1B19]/60 dark:text-gray-400">
                            Код решения (Python):
                          </div>
                          <pre className="p-2.5 bg-[#1B1B19] text-[#F8F7F4] font-mono text-xs overflow-x-auto rounded-xs">
                            <code>{taskItem.studentCode}</code>
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Reference Solution Accordion */}
                    {foundTask?.fullSolution && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleSolution(taskItem.taskId)}
                          className="font-mono text-[11px] text-[#D4AF37] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? 'Скрыть эталонное решение ФИПИ' : 'Показать эталонное решение ФИПИ для сравнения'}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-xs text-[#1B1B19] dark:text-gray-200 leading-relaxed font-sans">
                            <MathRenderer content={foundTask.fullSolution} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Per-Task Tutor Comment Input */}
                    <div className="pt-1">
                      <input
                        type="text"
                        value={taskGrading[taskItem.taskId]?.tutorComment || ''}
                        onChange={(e) => handleTaskCommentChange(taskItem.taskId, e.target.value)}
                        placeholder="Замечание к этому номеру (например: «Потерял ОДЗ», «Идеально оформлено!»)..."
                        className="w-full bg-[#FAF9F5] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] px-3 py-1.5 border border-[#1B1B19]/25 dark:border-[#383C4A] text-xs font-mono focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: BALANCED 5-POINT GRADING & PEDAGOGICAL FEEDBACK */}
          <form onSubmit={handleSubmit} className="p-5 bg-[#FAF9F5] dark:bg-[#1A1C24] border border-[#1B1B19]/30 dark:border-[#383C4A] space-y-4 shadow-sm">
            <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2 flex items-center justify-between">
              <div>
                <div className="label-academic text-[#D4AF37] mb-0.5">Сбалансированная оценка</div>
                <h3 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                  Итоговая школьная оценка за работу
                </h3>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 block uppercase font-bold">Первичные баллы:</span>
                <span className="text-sm font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                  {pointsSummary.earned} из {pointsSummary.total} б.
                </span>
              </div>
            </div>

            {/* 5-point Mark Buttons */}
            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold text-[#1B1B19] dark:text-[#F3F3EE] block">
                Выберите итоговую оценку по традиционной 5-балльной шкале:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 5 */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMark(5);
                    setReturnForRevision(false);
                  }}
                  className={`p-3 border text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedMark === 5 && !returnForRevision
                      ? 'bg-emerald-700 text-white border-emerald-900 shadow-sm'
                      : 'bg-white dark:bg-[#15171E] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/25 dark:border-[#383C4A] hover:border-emerald-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-2xl font-bold">«5»</span>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Отлично</span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">Все шаги верны, логика безупречна</div>
                </button>

                {/* 4 */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMark(4);
                    setReturnForRevision(false);
                  }}
                  className={`p-3 border text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedMark === 4 && !returnForRevision
                      ? 'bg-blue-700 text-white border-blue-900 shadow-sm'
                      : 'bg-white dark:bg-[#15171E] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/25 dark:border-[#383C4A] hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-2xl font-bold">«4»</span>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Хорошо</span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">Незначительные неточности в оформлении</div>
                </button>

                {/* 3 */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMark(3);
                    setReturnForRevision(false);
                  }}
                  className={`p-3 border text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedMark === 3 && !returnForRevision
                      ? 'bg-amber-600 text-white border-amber-800 shadow-sm'
                      : 'bg-white dark:bg-[#15171E] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/25 dark:border-[#383C4A] hover:border-amber-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-2xl font-bold">«3»</span>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Удовл.</span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">Базовый уровень, есть ошибки в счёте</div>
                </button>

                {/* 2 / Revision */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMark(2);
                    setReturnForRevision(true);
                  }}
                  className={`p-3 border text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedMark === 2 || returnForRevision
                      ? 'bg-rose-700 text-white border-rose-900 shadow-sm'
                      : 'bg-white dark:bg-[#15171E] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/25 dark:border-[#383C4A] hover:border-rose-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-2xl font-bold">«2»</span>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider">Доработка</span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-1">Вернуть работу ученику для исправления</div>
                </button>
              </div>
            </div>

            {/* Return for revision checkbox */}
            <div className="flex items-center gap-2 pt-1 font-mono text-xs">
              <input
                type="checkbox"
                id="revisionCheckbox"
                checked={returnForRevision}
                onChange={(e) => {
                  setReturnForRevision(e.target.checked);
                  if (e.target.checked) setSelectedMark(2);
                }}
                className="w-4 h-4 accent-rose-700 cursor-pointer"
              />
              <label htmlFor="revisionCheckbox" className="text-[#1B1B19] dark:text-[#F3F3EE] cursor-pointer">
                Вернуть работу на доработку (ученик увидит замечания и сможет отправить исправленное решение)
              </label>
            </div>

            {/* Pedagogical Feedback */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                  Методический комментарий преподавателя ученику:
                </label>
                <span className="font-mono text-[10px] text-[#1B1B19]/60 dark:text-gray-400">
                  Будет виден ученику и родителям в отчёте
                </span>
              </div>

              {/* Quick Template Chips */}
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickFeedback('Отличная работа! Все этапы и выкладки обоснованы.')}
                  className="px-2 py-0.5 bg-white dark:bg-[#202430] border border-[#1B1B19]/20 hover:border-[#D4AF37] text-[#1B1B19] dark:text-gray-300 transition cursor-pointer"
                >
                  + Отличная работа
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFeedback('Обрати внимание на ОДЗ и проверку корней.')}
                  className="px-2 py-0.5 bg-white dark:bg-[#202430] border border-[#1B1B19]/20 hover:border-[#D4AF37] text-[#1B1B19] dark:text-gray-300 transition cursor-pointer"
                >
                  + Проверка ОДЗ
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFeedback('Хороший ход мысли, но перепроверь арифметику во 2-й задаче.')}
                  className="px-2 py-0.5 bg-white dark:bg-[#202430] border border-[#1B1B19]/20 hover:border-[#D4AF37] text-[#1B1B19] dark:text-gray-300 transition cursor-pointer"
                >
                  + Перепроверь арифметику
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFeedback('Разберём этот номер подробно на ближайшем уроке.')}
                  className="px-2 py-0.5 bg-white dark:bg-[#202430] border border-[#1B1B19]/20 hover:border-[#D4AF37] text-[#1B1B19] dark:text-gray-300 transition cursor-pointer"
                >
                  + Разберём на уроке
                </button>
              </div>

              <textarea
                value={tutorFeedback}
                onChange={(e) => setTutorFeedback(e.target.value)}
                placeholder="Напишите развёрнутый отзыв: что сделано хорошо, где кроются ловушки и на что обратить внимание..."
                rows={3}
                className="w-full bg-white dark:bg-[#12141A] text-[#1B1B19] dark:text-[#F3F3EE] p-3 border border-[#1B1B19]/30 dark:border-[#383C4A] text-xs font-sans leading-relaxed focus:outline-none focus:border-[#1B1B19]"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white dark:bg-[#202430] hover:bg-[#FAF9F5] text-[#1B1B19] dark:text-[#F3F3EE] font-mono text-xs uppercase tracking-wider border border-[#1B1B19] dark:border-[#383C4A] transition cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="submit"
                className={`px-5 py-2.5 font-mono text-xs uppercase font-bold tracking-wider transition shadow-sm cursor-pointer flex items-center gap-2 ${
                  returnForRevision
                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                    : 'bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316]'
                }`}
              >
                {returnForRevision ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" /> Вернуть ученику на доработку
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Сохранить оценку «{selectedMark}» ({pointsSummary.earned}/{pointsSummary.total} б.)
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FULL-SCREEN PHOTO INSPECTOR MODAL */}
      {activePhotoIndex !== null && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col p-4 animate-in fade-in duration-100">
          {/* Inspector Toolbar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/20 px-2">
            <div className="font-mono text-xs flex items-center gap-3">
              <span className="font-bold text-[#E5C048]">
                Фото решения {activePhotoIndex + 1} из {photos.length}
              </span>
              <span className="text-white/60">
                Масштаб: {Math.round(photoZoom * 100)}% • Поворот: {photoRotation}°
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => setPhotoZoom((z) => Math.min(z + 0.25, 3))}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xs transition text-white"
                title="Увеличить (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPhotoZoom((z) => Math.max(z - 0.25, 0.5))}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xs transition text-white"
                title="Уменьшить (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPhotoRotation((r) => (r + 90) % 360)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xs transition text-white"
                title="Повернуть на 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setHighContrast((c) => !c)}
                className={`px-2.5 py-1 text-[11px] rounded-xs font-bold transition ${
                  highContrast ? 'bg-amber-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title="Усилить контрастность для чтения бледного карандаша"
              >
                Контраст {highContrast ? 'ВКЛ' : 'ВЫКЛ'}
              </button>
              <button
                onClick={() => {
                  setPhotoZoom(1);
                  setPhotoRotation(0);
                  setHighContrast(false);
                }}
                className="px-2 py-1 text-[11px] bg-white/10 hover:bg-white/20 rounded-xs transition"
              >
                Сброс
              </button>
              <button
                onClick={() => setActivePhotoIndex(null)}
                className="p-1.5 bg-rose-600/80 hover:bg-rose-600 rounded-xs transition text-white ml-2"
                title="Закрыть просмотр"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Photo Canvas / Preview */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
            <div
              style={{
                transform: `scale(${photoZoom}) rotate(${photoRotation}deg)`,
                transition: 'transform 0.15s ease-out',
                filter: highContrast ? 'contrast(160%) brightness(95%)' : 'none',
              }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={photos[activePhotoIndex]}
                alt={`Фото решения лист #${activePhotoIndex + 1}`}
                className="max-w-[85vw] max-h-[80vh] object-contain shadow-2xl rounded-xs bg-white"
              />
            </div>

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActivePhotoIndex((i) => (i! > 0 ? i! - 1 : photos.length - 1))
                  }
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition"
                  title="Предыдущее фото"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setActivePhotoIndex((i) => (i! < photos.length - 1 ? i! + 1 : 0))
                  }
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full transition"
                  title="Следующее фото"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
