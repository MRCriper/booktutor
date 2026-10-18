import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  BookOpen,
  FileCode2,
  Plus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Trash2,
  Edit3,
  CalendarCheck,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimeSlot, User, Homework, StudyMaterial, Subject } from '../../types';
import { storage } from '../../services/storage';
import { MathRenderer } from '../common/MathRenderer';
import { FormulaView } from '../common/FormulaView';

interface AcademicCalendarViewProps {
  currentUser: User;
  students?: User[];
  slots: TimeSlot[];
  homeworks: Homework[];
  materials?: StudyMaterial[];
  onNavigateToHomework?: (hwId?: string) => void;
  onNavigateToMaterials?: () => void;
  onRefreshSlots?: () => void;
}

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  currentUser,
  students = [],
  slots,
  homeworks,
  materials = [],
  onNavigateToHomework,
  onNavigateToMaterials,
  onRefreshSlots,
}) => {
  const isTutor = currentUser.role === 'tutor';

  // Current calendar viewing month & year
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Modals state
  const [showBookWindowModal, setShowBookWindowModal] = useState(false);
  const [targetWindowSlot, setTargetWindowSlot] = useState<TimeSlot | null>(null);

  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showAddWindowModal, setShowAddWindowModal] = useState(false);
  const [readingMaterial, setReadingMaterial] = useState<StudyMaterial | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Student booking form state
  const [bookingStartTime, setBookingStartTime] = useState('19:00');
  const [bookingDuration, setBookingDuration] = useState<number>(60); // 45, 60, 90, 120
  const [bookingSubject, setBookingSubject] = useState<Subject>(() => {
    if (currentUser.subjects && currentUser.subjects.length > 0) {
      return currentUser.subjects[0];
    }
    return 'math';
  });
  const [bookingTopic, setBookingTopic] = useState('');
  const [bookingComment, setBookingComment] = useState('');

  // Tutor lesson creation form state
  const [newLessonStudentId, setNewLessonStudentId] = useState(students[0]?.id || '');
  const [newLessonDate, setNewLessonDate] = useState(selectedDateStr);
  const [newLessonStartTime, setNewLessonStartTime] = useState('18:00');
  const [newLessonEndTime, setNewLessonEndTime] = useState('19:30');
  const [newLessonSubject, setNewLessonSubject] = useState<Subject>('math');
  const [newLessonTopic, setNewLessonTopic] = useState('');
  const [newLessonTelemost, setNewLessonTelemost] = useState('');
  const [newLessonHwId, setNewLessonHwId] = useState('');
  const [newLessonMaterialId, setNewLessonMaterialId] = useState('');
  const [newLessonNotes, setNewLessonNotes] = useState('');

  // Tutor open window creation form state
  const [windowDate, setWindowDate] = useState(selectedDateStr);
  const [windowStartTime, setWindowStartTime] = useState('19:00');
  const [windowEndTime, setWindowEndTime] = useState('23:00');
  const [windowSubject, setWindowSubject] = useState<Subject>('math');
  const [windowNote, setWindowNote] = useState('Свободное время для индивидуальных разборов');

  // Tutor personal event form state (visible only to tutor)
  const [showAddPersonalModal, setShowAddPersonalModal] = useState(false);
  const [personalDate, setPersonalDate] = useState(selectedDateStr);
  const [personalStartTime, setPersonalStartTime] = useState('11:00');
  const [personalEndTime, setPersonalEndTime] = useState('13:00');
  const [personalTitle, setPersonalTitle] = useState('');
  const [personalCategory, setPersonalCategory] = useState<'review' | 'prep' | 'methodology' | 'personal' | 'webinar'>('prep');
  const [personalNotes, setPersonalNotes] = useState('');

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Calculate days for the month grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday is index 0 in Russia
    let firstDayIndex = firstDay.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const daysCount = lastDay.getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const pYear = month === 0 ? year - 1 : year;
      const pMonth = month === 0 ? 11 : month - 1;
      const dNum = prevMonthLastDay - i;
      const dStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNum: dNum, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysCount; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNum: d, isCurrentMonth: true });
    }

    // Next month padding days to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nYear = month === 11 ? year + 1 : year;
      const nMonth = month === 11 ? 0 : month + 1;
      const dStr = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr: dStr, dayNum: i, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Filter slots for current user
  const relevantSlots = useMemo(() => {
    if (isTutor) return slots;
    // For students: ONLY non-personal slots: their booked slots + all available slots / open windows
    return slots.filter((s) => !s.isPersonal && (!s.isBooked || s.studentId === currentUser.id));
  }, [slots, isTutor, currentUser.id]);

  // Map slots & homeworks by date string
  const slotsByDate = useMemo(() => {
    const map: Record<string, TimeSlot[]> = {};
    relevantSlots.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [relevantSlots]);

  const homeworksByDate = useMemo(() => {
    const map: Record<string, Homework[]> = {};
    const relevantHw = isTutor ? homeworks : homeworks.filter((h) => h.studentId === currentUser.id);
    relevantHw.forEach((h) => {
      if (h.dueDate) {
        if (!map[h.dueDate]) map[h.dueDate] = [];
        map[h.dueDate].push(h);
      }
    });
    return map;
  }, [homeworks, isTutor, currentUser.id]);

  // Events on the currently selected date
  const selectedDaySlots = slotsByDate[selectedDateStr] || [];
  const selectedDayHomeworks = homeworksByDate[selectedDateStr] || [];

  // Open booking modal for a window
  const handleOpenBookWindow = (slot: TimeSlot) => {
    setTargetWindowSlot(slot);
    setBookingStartTime(slot.startTime);
    setBookingDuration(60);
    setBookingSubject(slot.subject);
    setBookingTopic(slot.topic || '');
    setBookingComment('');
    setShowBookWindowModal(true);
  };

  // Submit student booking
  const handleConfirmBooking = () => {
    if (!targetWindowSlot) return;

    // Calculate end time
    const [startH, startM] = bookingStartTime.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + bookingDuration;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    if (targetWindowSlot.isWindow) {
      storage.bookWindowSlot(targetWindowSlot.id, currentUser, {
        date: targetWindowSlot.date,
        startTime: bookingStartTime,
        endTime: endTimeStr,
        subject: bookingSubject,
        topic: bookingTopic || `Занятие по предмету: ${bookingSubject}`,
        studentComment: bookingComment,
        durationMinutes: bookingDuration,
      });
    } else {
      storage.bookSlot(targetWindowSlot.id, currentUser, {
        topic: bookingTopic || targetWindowSlot.topic,
        studentComment: bookingComment,
        subject: bookingSubject,
        startTime: bookingStartTime,
        endTime: endTimeStr,
        durationMinutes: bookingDuration,
      });
    }

    confetti({ particleCount: 50, spread: 60 });
    showNotification('Занятие успешно забронировано! Преподаватель получил ваш комментарий.');
    setShowBookWindowModal(false);
    onRefreshSlots?.();
  };

  // Tutor creates a new scheduled lesson with HW & Materials
  const handleCreateLesson = () => {
    const student = students.find((s) => s.id === newLessonStudentId);
    const attachedHw = homeworks.find((h) => h.id === newLessonHwId);
    const attachedMat = materials.find((m) => m.id === newLessonMaterialId);

    storage.addSlot({
      date: newLessonDate,
      startTime: newLessonStartTime,
      endTime: newLessonEndTime,
      subject: newLessonSubject,
      tutorId: currentUser.id,
      isBooked: !!student,
      studentId: student?.id,
      studentName: student?.name,
      topic: newLessonTopic || 'Индивидуальное занятие',
      meetingLink:
        newLessonTelemost ||
        `https://telemost.yandex.ru/j/${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
      status: student ? 'booked' : 'available',
      homeworkId: attachedHw?.id,
      homeworkTitle: attachedHw?.title,
      materialIds: attachedMat ? [attachedMat.id] : [],
      materialTitles: attachedMat ? [attachedMat.title] : [],
      notes: newLessonNotes,
    });

    confetti({ particleCount: 30, spread: 50 });
    showNotification('Урок успешно добавлен в календарь с прикреплёнными материалами.');
    setShowAddLessonModal(false);
    onRefreshSlots?.();
  };

  // Tutor creates an open availability window
  const handleCreateWindow = () => {
    storage.addSlot({
      date: windowDate,
      startTime: windowStartTime,
      endTime: windowEndTime,
      subject: windowSubject,
      tutorId: currentUser.id,
      isBooked: false,
      isWindow: true,
      topic: windowNote || 'Свободное время для записи',
      status: 'available',
      meetingLink: `https://telemost.yandex.ru/j/${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
    });

    confetti({ particleCount: 30, spread: 50 });
    showNotification(`Свободное окно ${windowStartTime}–${windowEndTime} выставлено для учеников.`);
    setShowAddWindowModal(false);
    onRefreshSlots?.();
  };

  // Tutor creates a personal schedule event (invisible to students)
  const handleCreatePersonalEvent = () => {
    if (!personalTitle.trim()) {
      showNotification('Пожалуйста, укажите название личного события.');
      return;
    }

    storage.addSlot({
      date: personalDate,
      startTime: personalStartTime,
      endTime: personalEndTime,
      subject: 'math',
      tutorId: currentUser.id,
      isBooked: false,
      isPersonal: true,
      personalCategory,
      topic: personalTitle.trim(),
      notes: personalNotes.trim(),
      status: 'available',
    });

    confetti({ particleCount: 30, spread: 50 });
    showNotification('Личное событие успешно добавлено в ваш рабочий календарь.');
    setShowAddPersonalModal(false);
    setPersonalTitle('');
    setPersonalNotes('');
    onRefreshSlots?.();
  };

  const getSubjectBadge = (s: Subject) => {
    switch (s) {
      case 'math':
        return 'bg-amber-500/10 text-amber-700 dark:text-[#E5C048] border-amber-500/30';
      case 'physics':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'cs':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'russian':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSubjectLabel = (s: Subject) => {
    switch (s) {
      case 'math':
        return 'Математика';
      case 'physics':
        return 'Физика';
      case 'cs':
        return 'Информатика';
      case 'russian':
        return 'Русский язык';
      default:
        return s;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1B1B19]/15 dark:border-[#323642] gap-4">
        <div>
          <div className="label-academic text-[#D4AF37] dark:text-[#E5C048] mb-0.5">
            {isTutor ? 'Календарь преподавателя' : 'Мой учебный календарь'}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-[#D4AF37] dark:text-[#E5C048]" />
            Расписание уроков, ДЗ & Материалы
          </h2>
          <p className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">
            {isTutor
              ? 'Планируйте уроки, прикрепляйте ДЗ и учебные материалы, выставляйте свободные часы для записи.'
              : 'Просматривайте прошедшие и предстоящие уроки, читайте конспекты, выполняйте ДЗ и бронируйте свободные окна репетитора.'}
          </p>
        </div>

        {isTutor ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setWindowDate(selectedDateStr);
                setShowAddWindowModal(true);
              }}
              className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-white dark:bg-[#1A1C24] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#E5C048]" />
              Выставить свободное время
            </button>

            <button
              onClick={() => {
                setPersonalDate(selectedDateStr);
                setShowAddPersonalModal(true);
              }}
              className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              + Личное событие
            </button>

            <button
              onClick={() => {
                setNewLessonDate(selectedDateStr);
                setShowAddLessonModal(true);
              }}
              className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-[#1B1B19] hover:bg-black dark:bg-[#E5C048] dark:text-[#121316] text-[#F8F7F4] transition flex items-center gap-1.5 shadow-2xs border border-[#1B1B19] dark:border-[#E5C048] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Запланировать урок
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs text-[#1B1B19]/70 dark:text-gray-300 bg-white dark:bg-[#1A1C24] px-3 py-1.5 border border-[#1B1B19]/15 dark:border-[#323642]">
              Запланировано уроков: <strong className="text-[#1B1B19] dark:text-[#F3F3EE]">{relevantSlots.filter(s => s.isBooked).length}</strong>
            </span>
          </div>
        )}
      </div>

      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-mono flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 dark:text-emerald-400 font-bold">✕</button>
        </motion.div>
      )}

      {/* Main Calendar Layout: Grid (left) + Day Detail Drawer (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Month Grid */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] p-5 sm:p-6 shadow-xs space-y-4">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                {monthNames[month]} {year}
              </h3>
              <button
                onClick={goToToday}
                className="font-mono text-[11px] px-2.5 py-1 bg-[#F8F7F4] dark:bg-[#202430] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] transition cursor-pointer"
              >
                Сегодня
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="p-2 border border-[#1B1B19]/20 dark:border-[#323642] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] transition cursor-pointer"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 border border-[#1B1B19]/20 dark:border-[#323642] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] transition cursor-pointer"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-[#1B1B19]/60 dark:text-gray-400 py-1.5 border-b border-[#1B1B19]/10 dark:border-[#323642]">
            {dayNames.map((d, i) => (
              <div key={d} className={i >= 5 ? 'text-amber-600 dark:text-amber-400' : ''}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => {
              const daySlots = slotsByDate[day.dateStr] || [];
              const dayHws = homeworksByDate[day.dateStr] || [];
              const isSelected = day.dateStr === selectedDateStr;
              const isToday = day.dateStr === new Date().toISOString().split('T')[0];

              const hasBookedLesson = daySlots.some((s) => s.isBooked);
              const hasOpenWindow = daySlots.some((s) => !s.isBooked && (s.isWindow || s.status === 'available') && !s.isPersonal);
              const hasPersonalEvent = isTutor && daySlots.some((s) => s.isPersonal);
              const hasHw = dayHws.length > 0;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`min-h-[78px] sm:min-h-[92px] p-1.5 border transition flex flex-col justify-between cursor-pointer select-none text-left relative ${
                    isSelected
                      ? 'border-[#1B1B19] dark:border-[#E5C048] bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-[#1B1B19] dark:ring-[#E5C048]'
                      : day.isCurrentMonth
                      ? 'border-[#1B1B19]/10 dark:border-[#323642] bg-white dark:bg-[#1A1C24] hover:bg-[#F8F7F4] dark:hover:bg-[#202430]'
                      : 'border-transparent bg-[#F8F7F4]/40 dark:bg-black/20 text-[#1B1B19]/30 dark:text-gray-600 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-xs font-bold w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] rounded-xs'
                          : day.isCurrentMonth
                          ? 'text-[#1B1B19] dark:text-[#F3F3EE]'
                          : 'text-[#1B1B19]/40 dark:text-gray-600'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {/* Small indicators */}
                    <div className="flex items-center gap-1">
                      {hasBookedLesson && (
                        <span className="w-2 h-2 rounded-full bg-[#1B1B19] dark:bg-[#E5C048]" title="Занятие" />
                      )}
                      {hasOpenWindow && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Свободное окно" />
                      )}
                      {hasPersonalEvent && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" title="Личные планы" />
                      )}
                      {hasHw && (
                        <span className="w-2 h-2 rounded-full bg-rose-500" title="Дедлайн ДЗ" />
                      )}
                    </div>
                  </div>

                  {/* Day Content Badges in Cell */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {daySlots.slice(0, 2).map((s) => (
                      s.isPersonal ? (
                        <div
                          key={s.id}
                          className="text-[9px] font-mono px-1 py-0.5 truncate border leading-tight bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800 font-bold"
                        >
                          {s.startTime} 🔒 {s.topic}
                        </div>
                      ) : (
                        <div
                          key={s.id}
                          className={`text-[9px] font-mono px-1 py-0.5 truncate border leading-tight ${
                            s.isBooked
                              ? 'bg-[#1B1B19]/5 dark:bg-white/10 text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 dark:border-[#323642]'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-bold'
                          }`}
                        >
                          {s.startTime} {s.isBooked ? (isTutor ? s.studentName?.split(' ')[0] : s.topic || 'Урок') : 'Свободно'}
                        </div>
                      )
                    ))}

                    {daySlots.length > 2 && (
                      <div className="text-[8px] font-mono text-[#1B1B19]/60 dark:text-gray-400 pl-0.5">
                        +{daySlots.length - 2} еще
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#1B1B19]/10 dark:border-[#323642] text-[11px] font-mono text-[#1B1B19]/70 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#1B1B19] dark:bg-[#E5C048] inline-block" />
              Запланированный урок
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 inline-block" />
              Свободное окно для записи
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500 inline-block" />
              Срок сдачи ДЗ
            </span>
          </div>
        </div>

        {/* Right Column: Selected Day Schedule & Action Drawer */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1B1B19]/15 dark:border-[#323642]">
              <div>
                <span className="label-academic text-[#D4AF37] dark:text-[#E5C048] block">Выбранный день</span>
                <h4 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h4>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-1 bg-[#F8F7F4] dark:bg-[#202430] border border-[#1B1B19]/20 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE]">
                {selectedDaySlots.length} событий
              </span>
            </div>

            {/* List of slots on selected day */}
            <div className="space-y-3.5">
              {selectedDaySlots.length === 0 && selectedDayHomeworks.length === 0 ? (
                <div className="p-6 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/10 dark:border-[#323642] text-center text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400 space-y-2">
                  <CalendarCheck className="w-6 h-6 mx-auto text-[#D4AF37] dark:text-[#E5C048] opacity-70" />
                  <p>На этот день занятий не запланировано.</p>
                  {isTutor && (
                    <div className="pt-2 flex flex-col gap-1.5">
                      <button
                        onClick={() => {
                          setNewLessonDate(selectedDateStr);
                          setShowAddLessonModal(true);
                        }}
                        className="text-xs font-mono font-bold text-[#1B1B19] dark:text-[#E5C048] hover:underline cursor-pointer"
                      >
                        + Поставить урок
                      </button>
                      <button
                        onClick={() => {
                          setWindowDate(selectedDateStr);
                          setShowAddWindowModal(true);
                        }}
                        className="text-xs font-mono text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        + Открыть свободное время
                      </button>
                      <button
                        onClick={() => {
                          setPersonalDate(selectedDateStr);
                          setShowAddPersonalModal(true);
                        }}
                        className="text-xs font-mono text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        + Личное событие
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Slots rendering */}
              {selectedDaySlots.map((slot) => {
                if (slot.isPersonal) {
                  return (
                    <div
                      key={slot.id}
                      className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3 shadow-2xs border-l-4 border-l-indigo-600 dark:border-l-indigo-400"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          Личное событие • Только для вас
                        </span>
                        <span className="font-mono text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </div>

                      <div>
                        <h5 className="font-serif text-base font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                          {slot.topic}
                        </h5>
                        {slot.notes && (
                          <p className="text-xs text-[#1B1B19]/75 dark:text-gray-300 font-sans mt-1 leading-relaxed">
                            {slot.notes}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-between text-xs font-mono">
                        <span className="text-[10px] text-indigo-800/70 dark:text-indigo-300/70 font-semibold">
                          Категория: {
                            slot.personalCategory === 'review' ? 'Проверка работ' :
                            slot.personalCategory === 'prep' ? 'Подготовка к урокам' :
                            slot.personalCategory === 'methodology' ? 'Методическая работа' :
                            slot.personalCategory === 'webinar' ? 'Вебинар / Консультация' : 'Личные дела'
                          }
                        </span>
                        <button
                          onClick={() => {
                            storage.deleteSlot(slot.id);
                            showNotification('Личное событие удалено.');
                            onRefreshSlots?.();
                          }}
                          className="text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Удалить
                        </button>
                      </div>
                    </div>
                  );
                }

                const isBooked = slot.isBooked;
                const isWindow = slot.isWindow;

                return (
                  <div
                    key={slot.id}
                    className={`p-4 border transition space-y-3 shadow-2xs ${
                      isBooked
                        ? 'bg-white dark:bg-[#1A1C24] border-[#1B1B19]/20 dark:border-[#323642] border-l-4 border-l-[#D4AF37] dark:border-l-[#E5C048]'
                        : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-600/30 dark:border-emerald-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 border ${getSubjectBadge(slot.subject)}`}>
                        {getSubjectLabel(slot.subject)}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#D4AF37] dark:text-[#E5C048]" />
                        {slot.startTime}–{slot.endTime}
                      </span>
                    </div>

                    <div>
                      <h5 className="font-serif text-base font-semibold text-[#1B1B19] dark:text-[#F3F3EE]">
                        {slot.topic || (isWindow ? 'Свободное время репетитора' : 'Индивидуальное занятие')}
                      </h5>

                      {isBooked && (
                        <div className="text-xs font-mono text-[#1B1B19]/70 dark:text-gray-300 mt-1">
                          {isTutor ? (
                            <>
                              Ученик:{' '}
                              <strong className="text-[#1B1B19] dark:text-[#F3F3EE]">{slot.studentName}</strong>
                            </>
                          ) : (
                            <>
                              Преподаватель: <strong className="text-[#1B1B19] dark:text-[#F3F3EE]">Роман Сергеевич</strong>
                            </>
                          )}
                        </div>
                      )}

                      {/* Student request / comment */}
                      {slot.studentComment && (
                        <div className="mt-2 p-2.5 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/10 dark:border-[#323642] text-xs text-[#1B1B19] dark:text-[#F3F3EE]">
                          <span className="label-academic text-[#D4AF37] dark:text-[#E5C048] block text-[9px] mb-0.5">
                            Пожелания к уроку от ученика:
                          </span>
                          <p className="font-sans italic">«{slot.studentComment}»</p>
                        </div>
                      )}

                      {/* Attached Homework for this lesson */}
                      {slot.homeworkTitle && (
                        <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-600/30 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileCode2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="font-mono text-[11px] text-[#1B1B19] dark:text-[#F3F3EE] truncate">
                              ДЗ: {slot.homeworkTitle}
                            </span>
                          </div>
                          {onNavigateToHomework && (
                            <button
                              onClick={() => onNavigateToHomework(slot.homeworkId)}
                              className="text-[10px] font-mono font-bold text-[#1B1B19] dark:text-[#E5C048] hover:underline shrink-0 ml-2"
                            >
                              Перейти →
                            </button>
                          )}
                        </div>
                      )}

                      {/* Attached Materials for this lesson */}
                      {slot.materialTitles && slot.materialTitles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="label-academic text-[#D4AF37] dark:text-[#E5C048] block text-[9px]">
                            Материалы к уроку (конспект & формулы):
                          </span>
                          {slot.materialTitles.map((title, idx) => {
                            const matObj = materials.find((m) => m.title === title || m.id === slot.materialIds?.[idx]);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (matObj) {
                                    setReadingMaterial(matObj);
                                  } else {
                                    onNavigateToMaterials?.();
                                  }
                                }}
                                className="w-full text-left p-2 bg-[#F8F7F4] dark:bg-[#16181F] hover:bg-[#1B1B19]/5 dark:hover:bg-white/5 border border-[#1B1B19]/15 dark:border-[#323642] text-xs font-mono text-[#1B1B19] dark:text-[#F3F3EE] flex items-center justify-between group transition cursor-pointer"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <BookOpen className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#E5C048] shrink-0" />
                                  <span className="truncate">{title}</span>
                                </span>
                                <span className="text-[10px] text-[#D4AF37] dark:text-[#E5C048] font-bold group-hover:underline">
                                  Читать конспект →
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Actions bar for this slot */}
                    <div className="pt-2 border-t border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between gap-2">
                      {isBooked ? (
                        <>
                          {slot.meetingLink ? (
                            <a
                              href={slot.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] transition flex items-center gap-1.5 shadow-2xs"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Телемост
                            </a>
                          ) : (
                            <span className="text-xs font-mono text-[#1B1B19]/50 dark:text-gray-400">Ссылка перед уроком</span>
                          )}

                          {!isTutor && (
                            <button
                              onClick={() => {
                                storage.cancelSlotBooking(slot.id);
                                showNotification('Запись на занятие отменена.');
                                onRefreshSlots?.();
                              }}
                              className="text-xs font-mono text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                              Отменить запись
                            </button>
                          )}

                          {isTutor && (
                            <button
                              onClick={() => {
                                storage.deleteSlot(slot.id);
                                showNotification('Урок удален из расписания.');
                                onRefreshSlots?.();
                              }}
                              className="p-1 text-[#1B1B19]/40 dark:text-gray-400 hover:text-rose-600 transition cursor-pointer"
                              title="Удалить урок"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        /* Available slot or window */
                        <>
                          {!isTutor ? (
                            <button
                              onClick={() => handleOpenBookWindow(slot)}
                              className="w-full font-mono text-xs font-bold uppercase tracking-wider py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                              Записаться на это время
                            </button>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {slot.isWindow ? 'Открытое окно для записи' : 'Свободный слот'}
                              </span>
                              <button
                                onClick={() => {
                                  storage.deleteSlot(slot.id);
                                  showNotification('Окно удалено.');
                                  onRefreshSlots?.();
                                }}
                                className="p-1 text-[#1B1B19]/40 dark:text-gray-400 hover:text-rose-600 transition cursor-pointer"
                                title="Удалить окно"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Homeworks due today */}
              {selectedDayHomeworks.map((hw) => (
                <div
                  key={hw.id}
                  className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/30 dark:border-rose-700/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="label-academic text-rose-600 dark:text-rose-400">Дедлайн ДЗ:</span>
                    <span className="font-mono font-bold uppercase text-[10px] px-1.5 py-0.5 border border-rose-600 text-rose-700 dark:text-rose-300">
                      {hw.subject}
                    </span>
                  </div>
                  <h5 className="font-serif text-sm font-bold text-[#1B1B19] dark:text-[#F3F3EE]">{hw.title}</h5>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-[#1B1B19]/60 dark:text-gray-400">
                      Задач: {hw.tasks.length} • {hw.status === 'graded' ? `Оценка «${hw.mark || (hw.grade && hw.grade <= 5 ? hw.grade : (hw.grade && hw.grade >= 85 ? 5 : 4)) || 5}»` : hw.status === 'submitted' ? 'На проверке' : 'Назначено'}
                    </span>
                    {onNavigateToHomework && (
                      <button
                        onClick={() => onNavigateToHomework(hw.id)}
                        className="font-mono font-bold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Решать →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: STUDENT BOOKS FROM TUTOR WINDOW */}
      <AnimatePresence>
        {showBookWindowModal && targetWindowSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-2xl space-y-5 relative text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1B1B19]/15 dark:border-[#323642]">
                <div>
                  <span className="label-academic text-[#D4AF37] dark:text-[#E5C048] block">Запись на занятие</span>
                  <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                    Бронирование слота у преподавателя
                  </h3>
                </div>
                <button
                  onClick={() => setShowBookWindowModal(false)}
                  className="text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Window info */}
              <div className="p-3 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642] text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#1B1B19]/60 dark:text-gray-400">Дата окна:</span>
                  <strong className="text-[#1B1B19] dark:text-[#F3F3EE]">{targetWindowSlot.date}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1B1B19]/60 dark:text-gray-400">Доступное окно репетитора:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {targetWindowSlot.startTime} – {targetWindowSlot.endTime}
                  </strong>
                </div>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {/* Duration picker */}
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                    Продолжительность занятия:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[45, 60, 90, 120].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setBookingDuration(dur)}
                        className={`py-2 px-2 border text-center transition cursor-pointer ${
                          bookingDuration === dur
                            ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold border-[#1B1B19] dark:border-[#E5C048]'
                            : 'bg-white dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 dark:border-[#323642] hover:border-[#1B1B19]'
                        }`}
                      >
                        {dur} мин
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start time within window */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                      Время начала:
                    </label>
                    <input
                      type="time"
                      value={bookingStartTime}
                      onChange={(e) => setBookingStartTime(e.target.value)}
                      className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                      Предмет:
                    </label>
                    <select
                      value={bookingSubject}
                      onChange={(e) => setBookingSubject(e.target.value as Subject)}
                      className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642] focus:outline-none"
                    >
                      <option value="math">Математика</option>
                      <option value="physics">Физика</option>
                      <option value="cs">Информатика</option>
                      <option value="russian">Русский язык</option>
                    </select>
                  </div>
                </div>

                {/* Topic / Task */}
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                    Тема занятия или номер КИМ:
                  </label>
                  <input
                    type="text"
                    value={bookingTopic}
                    onChange={(e) => setBookingTopic(e.target.value)}
                    placeholder="Например: Задание 18 (параметры) или Разбор динамики"
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642] focus:outline-none"
                  />
                </div>

                {/* Student comment */}
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                    Комментарий для репетитора (что нужно разобрать, какие вопросы):
                  </label>
                  <textarea
                    rows={3}
                    value={bookingComment}
                    onChange={(e) => setBookingComment(e.target.value)}
                    placeholder="Напишите, какие конкретно задания вызывают трудности, чтобы преподаватель заранее подготовил материалы и задачи..."
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] flex justify-end gap-2">
                <button
                  onClick={() => setShowBookWindowModal(false)}
                  className="font-mono text-xs uppercase px-4 py-2 border border-[#1B1B19]/20 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmBooking}
                  className="font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 bg-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] text-[#F8F7F4] hover:bg-black dark:hover:bg-[#d4ae36] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Подтвердить запись
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: TUTOR PLANS A LESSON WITH HW & MATERIALS */}
      <AnimatePresence>
        {showAddLessonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-2xl space-y-4 relative text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1B1B19]/15 dark:border-[#323642]">
                <div>
                  <span className="label-academic text-[#D4AF37] dark:text-[#E5C048] block">Планирование</span>
                  <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                    Запланировать индивидуальный урок
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddLessonModal(false)}
                  className="text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs font-mono max-h-[75vh] overflow-y-auto pr-1">
                {/* Student */}
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                    Ученик:
                  </label>
                  <select
                    value={newLessonStudentId}
                    onChange={(e) => setNewLessonStudentId(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.grade || '11 класс'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Subject */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">Дата:</label>
                    <input
                      type="date"
                      value={newLessonDate}
                      onChange={(e) => setNewLessonDate(e.target.value)}
                      className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                    />
                  </div>
                  <div>
                    <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">Предмет:</label>
                    <select
                      value={newLessonSubject}
                      onChange={(e) => setNewLessonSubject(e.target.value as Subject)}
                      className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                    >
                      <option value="math">Математика</option>
                      <option value="physics">Физика</option>
                      <option value="cs">Информатика</option>
                      <option value="russian">Русский язык</option>
                    </select>
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">Начало:</label>
                    <input
                      type="time"
                      value={newLessonStartTime}
                      onChange={(e) => setNewLessonStartTime(e.target.value)}
                      className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                    />
                  </div>
                  <div>
                    <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">Окончание:</label>
                    <input
                      type="time"
                      value={newLessonEndTime}
                      onChange={(e) => setNewLessonEndTime(e.target.value)}
                      className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                    />
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">Тема урока:</label>
                  <input
                    type="text"
                    value={newLessonTopic}
                    onChange={(e) => setNewLessonTopic(e.target.value)}
                    placeholder="Например: Разбор уравнений с параметрами (ЕГЭ №18)"
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                  />
                </div>

                {/* Telemost */}
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                    Ссылка на Яндекс.Телемост (авто-создание если пусто):
                  </label>
                  <input
                    type="url"
                    value={newLessonTelemost}
                    onChange={(e) => setNewLessonTelemost(e.target.value)}
                    placeholder="https://telemost.yandex.ru/j/..."
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                  />
                </div>

                {/* Attach Homework */}
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                    Прикрепить домашнее задание к уроку:
                  </label>
                  <select
                    value={newLessonHwId}
                    onChange={(e) => setNewLessonHwId(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                  >
                    <option value="">Без прикрепления ДЗ</option>
                    {homeworks.map((hw) => (
                      <option key={hw.id} value={hw.id}>
                        {hw.title} ({hw.subject}, дедлайн: {hw.dueDate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Attach Study Material */}
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                    Прикрепить учебные материалы / конспект:
                  </label>
                  <select
                    value={newLessonMaterialId}
                    onChange={(e) => setNewLessonMaterialId(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                  >
                    <option value="">Без материалов</option>
                    {materials.map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.title} ({mat.subject})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">
                    План или заметка репетитора:
                  </label>
                  <textarea
                    rows={2}
                    value={newLessonNotes}
                    onChange={(e) => setNewLessonNotes(e.target.value)}
                    placeholder="Какие задачи разобрать, что проверить..."
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] flex justify-end gap-2">
                <button
                  onClick={() => setShowAddLessonModal(false)}
                  className="font-mono text-xs uppercase px-4 py-2 border border-[#1B1B19]/20 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateLesson}
                  className="font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 bg-[#1B1B19] hover:bg-black dark:bg-[#E5C048] dark:text-[#121316] text-[#F8F7F4] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Сохранить урок
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: TUTOR ADDS OPEN AVAILABILITY WINDOW */}
      <AnimatePresence>
        {showAddWindowModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-2xl space-y-4 relative text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1B1B19]/15 dark:border-[#323642]">
                <div>
                  <span className="label-academic text-[#D4AF37] dark:text-[#E5C048] block">Окна для записи</span>
                  <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                    Выставить свободное время
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddWindowModal(false)}
                  className="text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#1B1B19]/60 dark:text-gray-400 leading-relaxed font-sans">
                Ученики увидят этот временной интервал и смогут забронировать в нём занятие нужной длительности с комментарием по теме.
              </p>

              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">Дата окна:</label>
                  <input
                    type="date"
                    value={windowDate}
                    onChange={(e) => setWindowDate(e.target.value)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">Свободно с:</label>
                    <input
                      type="time"
                      value={windowStartTime}
                      onChange={(e) => setWindowStartTime(e.target.value)}
                      className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                    />
                  </div>
                  <div>
                    <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">До:</label>
                    <input
                      type="time"
                      value={windowEndTime}
                      onChange={(e) => setWindowEndTime(e.target.value)}
                      className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">Предмет:</label>
                  <select
                    value={windowSubject}
                    onChange={(e) => setWindowSubject(e.target.value as Subject)}
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                  >
                    <option value="math">Математика</option>
                    <option value="physics">Физика</option>
                    <option value="cs">Информатика</option>
                    <option value="russian">Русский язык</option>
                  </select>
                </div>

                <div>
                  <label className="label-academic block mb-1 text-[#1B1B19] dark:text-[#F3F3EE]">Примечание для учеников:</label>
                  <input
                    type="text"
                    value={windowNote}
                    onChange={(e) => setWindowNote(e.target.value)}
                    placeholder="Например: Свободное время для разбора 2 части КИМ"
                    className="w-full bg-[#F8F7F4] dark:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/30 dark:border-[#323642]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] flex justify-end gap-2">
                <button
                  onClick={() => setShowAddWindowModal(false)}
                  className="font-mono text-xs uppercase px-4 py-2 border border-[#1B1B19]/20 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateWindow}
                  className="font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Открыть окно
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: IN-CALENDAR STUDY MATERIAL VIEWER */}
      <AnimatePresence>
        {readingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-2xl space-y-4 relative text-left max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1B1B19]/15 dark:border-[#323642] shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${getSubjectBadge(readingMaterial.subject)}`}>
                      {getSubjectLabel(readingMaterial.subject)}
                    </span>
                    <span className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400">
                      {readingMaterial.readTimeMinutes} мин чтения
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] mt-1">
                    {readingMaterial.title}
                  </h3>
                </div>
                <button
                  onClick={() => setReadingMaterial(null)}
                  className="text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                <div className="p-4 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] leading-relaxed">
                  <MathRenderer content={readingMaterial.content} />
                </div>

                {readingMaterial.keyFormulas && readingMaterial.keyFormulas.length > 0 && (
                  <div className="space-y-2">
                    <span className="label-academic text-[#D4AF37] dark:text-[#E5C048] block">
                      Ключевые формулы к уроку:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {readingMaterial.keyFormulas.map((f, i) => (
                        <FormulaView key={i} formula={f} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] flex justify-end shrink-0">
                <button
                  onClick={() => setReadingMaterial(null)}
                  className="font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] hover:bg-black transition cursor-pointer"
                >
                  Закрыть материал
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: TUTOR PERSONAL SCHEDULE EVENT */}
      <AnimatePresence>
        {showAddPersonalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-2xl space-y-5 relative text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1B1B19]/15 dark:border-[#323642]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200">
                    <Lock className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                      Личное событие / Планы преподавателя
                    </h4>
                    <p className="text-[11px] font-mono text-[#1B1B19]/60 dark:text-gray-400">
                      Это событие отображается только в вашем календаре (скрыто от учеников)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddPersonalModal(false)}
                  className="text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {/* Event Title */}
                <div>
                  <label className="block text-[#1B1B19]/70 dark:text-gray-300 font-bold mb-1">
                    Название события:
                  </label>
                  <input
                    type="text"
                    value={personalTitle}
                    onChange={(e) => setPersonalTitle(e.target.value)}
                    placeholder="Например: Проверка пробников 11 класса"
                    className="w-full p-2.5 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
                  />
                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'Проверка пробников ЕГЭ',
                      'Подготовка к урокам',
                      'Методический день ФИПИ',
                      'Вебинар / Консультация',
                      'Составление авторских вариантов',
                      'Личные дела / Врач',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPersonalTitle(preset)}
                        className="text-[10px] px-2 py-0.5 bg-[#F8F7F4] dark:bg-[#16181F] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[#1B1B19]/70 dark:text-gray-300 border border-[#1B1B19]/10 dark:border-[#323642] cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[#1B1B19]/70 dark:text-gray-300 font-bold mb-1">
                    Категория:
                  </label>
                  <select
                    value={personalCategory}
                    onChange={(e) => setPersonalCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] focus:outline-none"
                  >
                    <option value="prep">Подготовка к урокам и материалам</option>
                    <option value="review">Проверка домашних заданий и пробников</option>
                    <option value="methodology">Методическая работа и разбор демоверсий</option>
                    <option value="webinar">Вебинар / Выступление</option>
                    <option value="personal">Личные дела и отдых</option>
                  </select>
                </div>

                {/* Date & Time Range */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#1B1B19]/70 dark:text-gray-300 font-bold mb-1">
                      Дата:
                    </label>
                    <input
                      type="date"
                      value={personalDate}
                      onChange={(e) => setPersonalDate(e.target.value)}
                      className="w-full p-2 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1B1B19]/70 dark:text-gray-300 font-bold mb-1">
                      Начало:
                    </label>
                    <input
                      type="time"
                      value={personalStartTime}
                      onChange={(e) => setPersonalStartTime(e.target.value)}
                      className="w-full p-2 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1B1B19]/70 dark:text-gray-300 font-bold mb-1">
                      Окончание:
                    </label>
                    <input
                      type="time"
                      value={personalEndTime}
                      onChange={(e) => setPersonalEndTime(e.target.value)}
                      className="w-full p-2 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[#1B1B19]/70 dark:text-gray-300 font-bold mb-1">
                    Заметки / Детали (необязательно):
                  </label>
                  <textarea
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    placeholder="Например: проверить критерии К1-К4 в сочинениях, составить варианты..."
                    rows={3}
                    className="w-full p-2.5 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] flex justify-end gap-2">
                <button
                  onClick={() => setShowAddPersonalModal(false)}
                  className="font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 border border-[#1B1B19]/20 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreatePersonalEvent}
                  className="font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Сохранить в личный график
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
