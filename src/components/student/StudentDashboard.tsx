import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  FileCode2,
  Video,
  Send,
  CheckCircle2,
  Lightbulb,
  ExternalLink,
  Code,
  Palette,
  Sparkles,
  Camera,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, TimeSlot, Homework, StudyMaterial, Task, Subject, ExamVariant } from '../../types';
import { storage } from '../../services/storage';
import { FormulaView } from '../common/FormulaView';
import { MathRenderer } from '../common/MathRenderer';
import { CodeEditor } from '../sandbox/CodeEditor';
import { UserAvatar } from '../common/UserAvatar';
import { GamificationBar } from './GamificationBar';
import { calculateStudentGamification } from '../../utils/gamification';
import { ExamVariantsView } from '../exam/ExamVariantsView';
import { XPRewardsStore } from './XPRewardsStore';
import { AcademicCalendarView } from '../calendar/AcademicCalendarView';
import { HomeworkPhotoUploader } from '../homework/HomeworkPhotoUploader';

interface StudentDashboardProps {
  student: User;
  tutor: User;
  slots: TimeSlot[];
  homeworks: Homework[];
  materials: StudyMaterial[];
  tasks: Task[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onStartExam: (variant: ExamVariant) => void;
  onOpenSandbox?: (title?: string) => void;
  onOpenChat?: () => void;
  onOpenAi?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  tutor,
  slots,
  homeworks,
  materials,
  tasks,
  activeTab,
  onTabChange,
  onStartExam,
}) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<Subject | 'all'>('all');
  const [activeHwId, setActiveHwId] = useState<string | null>(homeworks[0]?.id || null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Student's booked lessons
  const myBookedSlots = slots.filter((s) => s.studentId === student.id);
  // Available slots for booking
  const availableSlots = slots.filter((s) => !s.isBooked && s.status === 'available');

  const filteredMaterials =
    selectedSubjectFilter === 'all'
      ? materials
      : materials.filter((m) => m.subject === selectedSubjectFilter);

  const currentHomework = homeworks.find((h) => h.id === activeHwId) || homeworks[0];

  const gamificationStats = calculateStudentGamification(
    student,
    homeworks,
    storage.getTopicProgress(),
    storage.getExamNumbers()
  );

  const handleBookSlot = (slotId: string, topic?: string) => {
    storage.bookSlot(slotId, student, { topic });
    confetti({ particleCount: 40, spread: 50 });
    setBookingSuccessMsg('Занятие забронировано! Ссылка на Яндекс.Телемост в расписании.');
    setTimeout(() => setBookingSuccessMsg(null), 3500);
  };

  const handleCancelBooking = (slotId: string) => {
    storage.cancelSlotBooking(slotId);
  };

  const [studentComments, setStudentComments] = useState<Record<string, string>>({});

  const handleSaveHomeworkAnswer = (hwId: string, taskId: string, answer: string, code?: string) => {
    const hw = homeworks.find((h) => h.id === hwId);
    if (!hw) return;
    const updatedTasks = hw.tasks.map((t) => {
      if (t.taskId === taskId) {
        return {
          ...t,
          studentAnswer: answer,
          studentCode: code !== undefined ? code : t.studentCode,
        };
      }
      return t;
    });

    storage.updateHomework({
      ...hw,
      tasks: updatedTasks,
    });
    setBookingSuccessMsg('Ответ сохранен в черновике.');
    setTimeout(() => setBookingSuccessMsg(null), 2500);
  };

  const handleUpdateHomeworkPhotos = (hwId: string, newPhotos: string[]) => {
    const hw = homeworks.find((h) => h.id === hwId);
    if (!hw) return;
    storage.updateHomework({
      ...hw,
      photos: newPhotos,
    });
    setBookingSuccessMsg(`Прикреплено фото решений: ${newPhotos.length} шт.`);
    setTimeout(() => setBookingSuccessMsg(null), 2500);
  };

  const handleUpdateStudentComment = (hwId: string, comment: string) => {
    setStudentComments((prev) => ({ ...prev, [hwId]: comment }));
    const hw = homeworks.find((h) => h.id === hwId);
    if (!hw) return;
    storage.updateHomework({
      ...hw,
      studentComment: comment,
    });
  };

  const handleSubmitFullHomework = (hwId: string) => {
    const hw = homeworks.find((h) => h.id === hwId);
    if (!hw) return;
    const comment = studentComments[hwId] !== undefined ? studentComments[hwId] : (hw.studentComment || '');
    storage.updateHomework({
      ...hw,
      studentComment: comment,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    });
    confetti({ particleCount: 60, spread: 70 });
    setBookingSuccessMsg('Домашнее задание с решениями и фото отправлено преподавателю на проверку!');
    setTimeout(() => setBookingSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Student Welcome Card (Clean & Uncluttered) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] shadow-xs"
      >
        <div className="flex items-center gap-3.5">
          <UserAvatar name={student.name} avatarUrl={student.avatarUrl} size="lg" />
          <div>
            <div className="label-academic text-[#D4AF37] mb-0.5">Личный кабинет ученика</div>
            <h1 className="font-serif text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] leading-snug">
              {student.name}
            </h1>
            <p className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400">
              {student.grade || '11 класс'} • Преподаватель:{' '}
              <span className="text-[#1B1B19] dark:text-[#F3F3EE] font-bold">{tutor.name}</span>
            </p>
          </div>
        </div>

        {student.miroBoardUrl && (
          <div className="flex items-center gap-2">
            <a
              href={student.miroBoardUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono uppercase tracking-wider px-3.5 py-2 bg-white dark:bg-[#16181F] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Открыть интерактивную онлайн-доску"
            >
              <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
              Онлайн-доска
              <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
            </a>
          </div>
        )}
      </motion.div>

      {/* Level XP Bar & Badges */}
      <GamificationBar stats={gamificationStats} />

      {bookingSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-50 border border-emerald-700 text-emerald-900 text-xs font-mono flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-bold">{bookingSuccessMsg}</span>
          </div>
          <button onClick={() => setBookingSuccessMsg(null)} className="text-emerald-700 text-xs font-bold">
            ✕
          </button>
        </motion.div>
      )}

      {/* TAB: EXAM VARIANTS */}
      {activeTab === 'variants' && (
        <ExamVariantsView
          currentUser={student}
          students={[student]}
          onStartExam={onStartExam}
        />
      )}

      {/* TAB: XP REWARDS STORE */}
      {activeTab === 'rewards' && (
        <XPRewardsStore
          currentUser={student}
          currentXP={gamificationStats.totalXp}
          currentLevel={gamificationStats.currentLevel}
        />
      )}

      {/* TAB 1: SCHEDULE & INTERACTIVE CALENDAR */}
      {activeTab === 'schedule' && (
        <AcademicCalendarView
          currentUser={student}
          slots={slots}
          homeworks={homeworks}
          materials={materials}
          onNavigateToHomework={(hwId) => {
            if (hwId) setActiveHwId(hwId);
            onTabChange('homeworks');
          }}
          onNavigateToMaterials={() => onTabChange('materials')}
        />
      )}

      {/* TAB 2: HOMEWORK */}
      {(activeTab === 'homework' || activeTab === 'homeworks') && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {homeworks.map((hw) => (
              <button
                key={hw.id}
                onClick={() => setActiveHwId(hw.id)}
                className={`p-3.5 border text-left min-w-[210px] transition text-xs font-mono ${
                  currentHomework?.id === hw.id
                    ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19] dark:border-[#E5C048] font-bold shadow-2xs'
                    : 'bg-white dark:bg-[#1A1C24] border-[#1B1B19]/20 dark:border-[#323642] hover:border-[#1B1B19] dark:hover:border-gray-400 text-[#1B1B19] dark:text-[#F3F3EE]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider">{hw.subject}</span>
                  <span className="text-[10px] px-1.5 py-0.5 border border-current font-bold">
                    {hw.status === 'graded'
                      ? `Оценка «${hw.mark || (hw.grade && hw.grade <= 5 ? hw.grade : (hw.grade && hw.grade >= 85 ? 5 : 4)) || 5}»`
                      : hw.status === 'submitted'
                      ? 'На проверке'
                      : 'Назначено'}
                  </span>
                </div>
                <div className="font-serif text-sm font-semibold truncate">{hw.title}</div>
                <div className="text-[10px] opacity-70 mt-0.5">Срок: {hw.dueDate}</div>
              </button>
            ))}
          </div>

          {currentHomework && (
            <div className="p-6 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] space-y-6 shadow-xs">
              {/* Header */}
              <div className="pb-4 border-b border-[#1B1B19]/15 dark:border-[#323642] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">{currentHomework.title}</h2>
                  <p className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400">
                    Дедлайн: {currentHomework.dueDate} • Статус:{' '}
                    {currentHomework.status === 'graded'
                      ? 'Проверено'
                      : currentHomework.status === 'submitted'
                      ? 'На проверке'
                      : 'В процессе'}
                  </p>
                </div>

                {currentHomework.status === 'submitted' && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs font-mono text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <span>Сдано {currentHomework.submittedAt ? new Date(currentHomework.submittedAt).toLocaleDateString('ru-RU') : ''} • Ждёт проверки</span>
                  </div>
                )}
              </div>

              {/* If graded: Show prominent Academic Mark Banner */}
              {currentHomework.status === 'graded' && (
                <div className="p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div>
                    <div className="font-mono text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                      Работа проверена преподавателем
                    </div>
                    <div className="font-serif text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Оценка «{currentHomework.mark || currentHomework.grade || 5}»</span>
                      <span className="text-sm font-sans font-normal opacity-90">
                        ({(currentHomework.mark || currentHomework.grade) === 5
                          ? 'Отлично'
                          : (currentHomework.mark || currentHomework.grade) === 4
                          ? 'Хорошо'
                          : (currentHomework.mark || currentHomework.grade) === 3
                          ? 'Удовлетворительно'
                          : 'Требует доработки'})
                      </span>
                      {currentHomework.earnedPoints !== undefined && (
                        <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          • {currentHomework.earnedPoints} из {currentHomework.totalPoints || currentHomework.tasks.length} баллов
                        </span>
                      )}
                    </div>
                  </div>

                  {currentHomework.tutorFeedback && (
                    <div className="p-3 bg-white dark:bg-[#16181F] border border-emerald-200 dark:border-emerald-800 text-xs text-[#1B1B19] dark:text-[#F3F3EE] max-w-md">
                      <span className="label-academic text-[#D4AF37] block mb-0.5">Отзыв преподавателя:</span>
                      {currentHomework.tutorFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-5">
                {currentHomework.tasks.map((item, idx) => {
                  const taskDetail = tasks.find((t) => t.id === item.taskId);
                  if (!taskDetail) return null;

                  return (
                    <StudentTaskItem
                      key={item.taskId}
                      index={idx + 1}
                      item={item}
                      task={taskDetail}
                      onSave={(ans, code) =>
                        handleSaveHomeworkAnswer(currentHomework.id, item.taskId, ans, code)
                      }
                    />
                  );
                })}
              </div>

              {/* PHOTO ATTACHMENT SECTION & FINAL SUBMISSION */}
              <div className="p-5 bg-[#FAF9F5] dark:bg-[#16181F] border border-[#1B1B19]/20 dark:border-[#323642] space-y-4">
                <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-2">
                  <h3 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#D4AF37]" />
                    <span>Рукописные решения и фото из тетради</span>
                  </h3>
                  <p className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">
                    Преподаватель проверяет оформление задач, формулы, чертежи и этапы вычислений
                  </p>
                </div>

                <HomeworkPhotoUploader
                  photos={currentHomework.photos || []}
                  onChange={(newPhotos) => handleUpdateHomeworkPhotos(currentHomework.id, newPhotos)}
                  disabled={currentHomework.status === 'graded'}
                />

                <div className="space-y-1.5 pt-2">
                  <label className="font-mono text-xs font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Комментарий или вопрос преподавателю к этой работе:
                  </label>
                  <textarea
                    value={studentComments[currentHomework.id] ?? (currentHomework.studentComment || '')}
                    onChange={(e) => handleUpdateStudentComment(currentHomework.id, e.target.value)}
                    disabled={currentHomework.status === 'graded'}
                    placeholder="Например: «В номере 18 построил квадрат и окружность, чертёж прикрепил на фото. Проверьте граничные точки параметра...»"
                    rows={2}
                    className="w-full bg-white dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/25 dark:border-[#383C4A] text-xs font-mono focus:outline-none focus:border-[#1B1B19] resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs font-mono text-[#1B1B19]/70 dark:text-gray-300">
                    {currentHomework.status === 'submitted' ? (
                      <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#D4AF37]" /> Работа отправлена и ожидает проверки преподавателем
                      </span>
                    ) : currentHomework.status === 'graded' ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Работа оценена преподавателем
                      </span>
                    ) : (
                      <span>Решения сохраняются. Нажмите кнопку справа, чтобы отправить на проверку</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSubmitFullHomework(currentHomework.id)}
                    disabled={currentHomework.status === 'submitted'}
                    className={`px-5 py-2.5 font-mono text-xs uppercase font-bold tracking-wider transition flex items-center gap-2 shadow-2xs ${
                      currentHomework.status === 'submitted'
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 cursor-not-allowed border border-amber-300 dark:border-amber-700'
                        : 'bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] cursor-pointer'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {currentHomework.status === 'submitted' ? 'Отправлено на проверку' : 'Отправить ДЗ на проверку'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="label-academic mr-1">Предмет:</span>
            {(['all', 'math', 'physics', 'cs', 'russian'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubjectFilter(s)}
                className={`font-mono text-xs px-2.5 py-1 border transition ${
                  selectedSubjectFilter === s
                    ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19] dark:border-[#E5C048] font-bold'
                    : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 dark:border-[#323642] hover:border-[#1B1B19]'
                }`}
              >
                {s === 'all'
                  ? 'Все'
                  : s === 'math'
                  ? 'Математика'
                  : s === 'physics'
                  ? 'Физика'
                  : s === 'cs'
                  ? 'Информатика'
                  : 'Русский язык'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMaterials.map((mat) => (
              <motion.div
                key={mat.id}
                whileHover={{ y: -2 }}
                className="p-6 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[#1B1B19]/20 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE]">
                      {mat.subject}
                    </span>
                    <span className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400">{mat.readTimeMinutes} мин чтения</span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE] mb-2">{mat.title}</h3>
                  <div className="text-xs text-[#1B1B19] dark:text-[#F3F3EE] leading-relaxed bg-[#F8F7F4] dark:bg-[#16181F] p-4 border border-[#1B1B19]/20 dark:border-[#323642]">
                    <MathRenderer content={mat.content} />
                  </div>

                  {mat.keyFormulas && mat.keyFormulas.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <span className="label-academic text-[#D4AF37] block">Ключевые формулы:</span>
                      <div className="flex flex-wrap gap-2">
                        {mat.keyFormulas.map((f, i) => (
                          <FormulaView key={i} formula={f} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#1B1B19]/15 dark:border-[#323642] text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400 flex items-center justify-between">
                  <span>Тема: {mat.topic}</span>
                  <span className="font-bold text-[#1B1B19] dark:text-[#E5C048]">Материал репетитора</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface StudentTaskItemProps {
  index: number;
  item: Homework['tasks'][0];
  task: Task;
  onSave: (answer: string, code?: string) => void;
}

const StudentTaskItem: React.FC<StudentTaskItemProps> = ({ index, item, task, onSave }) => {
  const [answer, setAnswer] = useState(item.studentAnswer || '');
  const [code, setCode] = useState(item.studentCode || task.starterCode || '');
  const [showHints, setShowHints] = useState(false);

  const isCS = task.subject === 'cs';

  return (
    <div className="p-5 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/20 dark:border-[#323642] space-y-3.5 text-xs shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-mono font-bold flex items-center justify-center text-xs">
            {index}
          </span>
          <h4 className="font-serif text-base font-bold text-[#1B1B19] dark:text-[#F3F3EE]">{task.title}</h4>
          {task.examNumber && (
            <span className="font-mono text-[10px] text-[#1B1B19] dark:text-[#F3F3EE] bg-white dark:bg-[#202430] px-2 py-0.5 border border-[#1B1B19]/20 dark:border-[#323642] font-bold">
              {task.examNumber}
            </span>
          )}
        </div>

        {item.score !== undefined && (
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
            Балл: {item.score} / {item.maxScore || (task.difficulty === 'hard' ? 4 : task.difficulty === 'medium' ? 3 : 1)} б.
          </span>
        )}
      </div>

      {item.tutorComment && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-950 dark:text-amber-100 rounded-xs">
          <span className="font-bold font-mono text-[10px] uppercase text-amber-800 dark:text-[#E5C048] block mb-0.5">
            Замечание преподавателя:
          </span>
          {item.tutorComment}
        </div>
      )}

      <div className="text-[#1B1B19] dark:text-[#F3F3EE] leading-relaxed">
        <MathRenderer content={task.description} />
      </div>

      {task.formula && (
        <div className="pt-1">
          <FormulaView formula={task.formula} />
        </div>
      )}

      {task.hints?.length > 0 && (
        <div>
          <button
            onClick={() => setShowHints(!showHints)}
            className="font-mono text-xs font-bold text-[#1B1B19] dark:text-[#E5C048] hover:underline flex items-center gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]" />
            {showHints ? 'Скрыть подсказки' : `Показать подсказки (${task.hints.length})`}
          </button>
          {showHints && (
            <div className="mt-2 p-3.5 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] space-y-2">
              {task.hints.map((h, i) => (
                <div key={i} className="flex items-start gap-1.5 font-sans">
                  <span className="font-mono font-bold text-xs text-[#D4AF37] shrink-0">{i + 1}.</span>
                  <div className="flex-1">
                    <MathRenderer content={h} inline />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isCS ? (
        <div className="space-y-3 pt-2">
          <CodeEditor
            initialCode={code}
            language={task.language || 'python'}
            testCases={task.testCases || []}
            onCodeChange={(c) => setCode(c)}
            onAllTestsPassed={() => {
              const auth = storage.getAuthSession();
              if (auth?.id) {
                try {
                  localStorage.setItem(`booktutor_v7_code_tests_${auth.id}`, 'true');
                } catch {}
              }
              onSave(task.correctAnswer, code);
            }}
          />

          <div className="flex items-center justify-between gap-2 pt-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Итоговый ответ"
              className="bg-white dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] px-3.5 py-2 border border-[#1B1B19]/30 dark:border-[#323642] w-44 font-mono text-xs focus:outline-none"
            />
            <button
              onClick={() => onSave(answer || task.correctAnswer, code)}
              className="font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] hover:bg-black dark:hover:bg-[#d4ae36] transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Отправить решение
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Ваш ответ..."
            className="flex-1 bg-white dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] px-3.5 py-2 border border-[#1B1B19]/30 dark:border-[#323642] font-mono text-xs focus:outline-none"
          />
          <button
            onClick={() => onSave(answer)}
            className="font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] hover:bg-black dark:hover:bg-[#d4ae36] transition"
          >
            Сохранить ответ
          </button>
        </div>
      )}
    </div>
  );
};
