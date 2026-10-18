import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Plus,
  BookOpen,
  FileEdit,
  Clock,
  Trash2,
  Lightbulb,
  Award,
  Video,
  Search,
  Filter,
  Users,
  Copy,
  Check,
  UserPlus,
  Key,
  Phone,
  FileText,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  Layers,
  Sparkles,
  Palette,
  CheckCircle2,
  Zap,
  ChevronDown,
  Download,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Upload,
  Scale,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  User,
  TimeSlot,
  Task,
  Homework,
  InformalNote,
  StudyMaterial,
  Subject,
  ExamVariant,
  AttachedFile,
} from '../../types';
import { storage } from '../../services/storage';
import { FormulaView } from '../common/FormulaView';
import { MathRenderer } from '../common/MathRenderer';
import { UserAvatar } from '../common/UserAvatar';
import { FormulaHelperBar } from '../common/FormulaHelperBar';
import { VariantBuilderModal } from '../exam/VariantBuilderModal';
import { calculateStudentGamification } from '../../utils/gamification';
import { ExamVariantsView } from '../exam/ExamVariantsView';
import { ExamSpecsAndReferenceView } from '../exam/ExamSpecsAndReferenceView';
import { AcademicCalendarView } from '../calendar/AcademicCalendarView';
import { BatchImportModal } from '../exam/BatchImportModal';
import { HomeworkReviewModal } from '../homework/HomeworkReviewModal';

interface TutorDashboardProps {
  tutor: User;
  students: User[];
  slots: TimeSlot[];
  tasks: Task[];
  homeworks: Homework[];
  notes: InformalNote[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenReportForStudent: (student: User) => void;
  onOpenSandbox: (title?: string) => void;
  onStartExam?: (variant: ExamVariant) => void;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  tutor,
  students,
  slots,
  tasks,
  homeworks,
  notes,
  activeTab,
  onTabChange,
  onOpenReportForStudent,
  onOpenSandbox,
  onStartExam,
}) => {
  // Add Slot State (with Yandex Telemost)
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlotStart, setNewSlotStart] = useState('17:00');
  const [newSlotEnd, setNewSlotEnd] = useState('18:30');
  const [newSlotSubject, setNewSlotSubject] = useState<Subject>('math');
  const [newSlotTopic, setNewSlotTopic] = useState('');
  const [newSlotTelemost, setNewSlotTelemost] = useState('https://telemost.yandex.ru/j/84920193857102');

  // Add Student State (with Whiteboard link)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('123456');
  const [studentGrade, setStudentGrade] = useState('11 класс');
  const [studentTargetExam, setStudentTargetExam] = useState<'ЕГЭ Профиль' | 'ОГЭ' | 'Олимпиада' | 'ВУЗ'>('ЕГЭ Профиль');
  const [studentTargetScore, setStudentTargetScore] = useState(90);
  const [studentSubjects, setStudentSubjects] = useState<Subject[]>(['math']);
  const [studentParentName, setStudentParentName] = useState('');
  const [studentParentPhone, setStudentParentPhone] = useState('');
  const [studentWhiteboardUrl, setStudentWhiteboardUrl] = useState('https://sboard.online/board/math-quantum');
  const [studentNotes, setStudentNotes] = useState('');
  const [studentCreateError, setStudentCreateError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Whiteboard Link State
  const [editingWhiteboardStudent, setEditingWhiteboardStudent] = useState<User | null>(null);
  const [tempWhiteboardUrl, setTempWhiteboardUrl] = useState('');

  // Add Lecture / Material State
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatSubject, setNewMatSubject] = useState<Subject>('math');
  const [newMatTopic, setNewMatTopic] = useState('');
  const [newMatContent, setNewMatContent] = useState('');
  const [newMatFormulas, setNewMatFormulas] = useState('');
  const [newMatTime, setNewMatTime] = useState(15);

  // Add Homework State & Tab Filters
  const [showAddHomeworkModal, setShowAddHomeworkModal] = useState(false);
  const [newHwTitle, setNewHwTitle] = useState('');
  const [newHwStudentId, setNewHwStudentId] = useState(students[0]?.id || '');
  const [newHwSubject, setNewHwSubject] = useState<Subject>('math');
  const [newHwDueDate, setNewHwDueDate] = useState('2026-10-28');
  const [newHwSelectedTasks, setNewHwSelectedTasks] = useState<string[]>([]);
  const [hwStudentFilter, setHwStudentFilter] = useState<string>('all');
  const [hwSubjectFilter, setHwSubjectFilter] = useState<Subject | 'all'>('all');
  const [hwStatusFilter, setHwStatusFilter] = useState<'all' | 'assigned' | 'submitted' | 'graded'>('all');
  const [hwSearchQuery, setHwSearchQuery] = useState('');
  const [gradingHw, setGradingHw] = useState<Homework | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(85);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');

  // Task Bank Filters & State
  const [taskSubjectFilter, setTaskSubjectFilter] = useState<Subject | 'all'>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0] || null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showVariantBuilderModal, setShowVariantBuilderModal] = useState(false);
  const [showBatchImportModal, setShowBatchImportModal] = useState(false);
  const [batchImportMode, setBatchImportMode] = useState<'all' | 'homeworks' | 'tasks' | 'variants'>('all');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // New Task Form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState<Subject>('math');
  const [newTaskTopic, setNewTaskTopic] = useState('');
  const [newTaskExamNumber, setNewTaskExamNumber] = useState('ЕГЭ №18');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<'easy' | 'medium' | 'hard' | 'olympiad'>('medium');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskFormula, setNewTaskFormula] = useState('');
  const [newTaskImageUrl, setNewTaskImageUrl] = useState<string | undefined>();
  const [newTaskAttachedFiles, setNewTaskAttachedFiles] = useState<AttachedFile[]>([]);
  const [showTaskFormulaPreview, setShowTaskFormulaPreview] = useState(true);
  const [newTaskHint1, setNewTaskHint1] = useState('');
  const [newTaskHint2, setNewTaskHint2] = useState('');
  const [newTaskAnswer, setNewTaskAnswer] = useState('');
  const [newTaskSolution, setNewTaskSolution] = useState('');
  const [newTaskStarterCode, setNewTaskStarterCode] = useState('');
  const [newTaskLanguage, setNewTaskLanguage] = useState<'python' | 'cpp' | 'javascript'>('python');
  const [taskCreateSuccessMsg, setTaskCreateSuccessMsg] = useState<string | null>(null);

  // Notes State
  const [selectedStudentForNotes, setSelectedStudentForNotes] = useState<string>('all');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteStudentId, setNewNoteStudentId] = useState(students[0]?.id || '');
  const [newNoteSubject, setNewNoteSubject] = useState<Subject>('math');
  const [newNoteTopic, setNewNoteTopic] = useState('');
  const [newNoteEmotional, setNewNoteEmotional] = useState('Высокая концентрация и вовлеченность');
  const [newNoteWeakSpots, setNewNoteWeakSpots] = useState('');
  const [newNoteActionItems, setNewNoteActionItems] = useState('');
  const [newNoteScore, setNewNoteScore] = useState(9);

  // Handle Add Slot
  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    storage.addSlot({
      date: newSlotDate,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      subject: newSlotSubject,
      tutorId: tutor.id,
      isBooked: false,
      topic: newSlotTopic || `Занятие: ${newSlotSubject}`,
      meetingLink: newSlotTelemost || 'https://telemost.yandex.ru/',
      status: 'available',
    });
    setShowAddSlotModal(false);
    setNewSlotTopic('');
  };

  // Handle Create Student Account
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentCreateError(null);
    const res = storage.createStudent({
      name: studentName,
      email: studentEmail,
      password: studentPassword,
      grade: studentGrade,
      targetExam: studentTargetExam,
      targetScore: studentTargetScore,
      parentName: studentParentName,
      parentPhone: studentParentPhone,
      notes: studentNotes,
      miroBoardUrl: studentWhiteboardUrl,
      subjects: studentSubjects,
    });

    if (res.success) {
      setShowAddStudentModal(false);
      setStudentName('');
      setStudentEmail('');
      setStudentPassword('123456');
      setStudentParentName('');
      setStudentParentPhone('');
      setStudentNotes('');
    } else {
      setStudentCreateError(res.error || 'Ошибка при создании аккаунта');
    }
  };

  const handleSaveWhiteboardUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWhiteboardStudent) return;
    storage.updateStudentMiroBoard(editingWhiteboardStudent.id, tempWhiteboardUrl);
    setEditingWhiteboardStudent(null);
  };

  // Handle Create Study Material
  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const formulas = newMatFormulas
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    storage.addStudyMaterial({
      title: newMatTitle,
      subject: newMatSubject,
      topic: newMatTopic,
      type: 'lecture_notes',
      content: newMatContent,
      keyFormulas: formulas.length > 0 ? formulas : undefined,
      readTimeMinutes: Number(newMatTime) || 15,
    });
    setShowAddMaterialModal(false);
    setNewMatTitle('');
    setNewMatTopic('');
    setNewMatContent('');
    setNewMatFormulas('');
  };

  // Handle Create Homework
  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    const taskItems = (newHwSelectedTasks.length > 0 ? newHwSelectedTasks : [tasks[0]?.id]).map((taskId) => ({
      taskId,
      studentAnswer: '',
      score: 0,
    }));

    storage.createHomework({
      studentId: newHwStudentId,
      subject: newHwSubject,
      title: newHwTitle || 'Новое домашнее задание',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: newHwDueDate,
      status: 'assigned',
      tasks: taskItems,
    });
    setShowAddHomeworkModal(false);
    setNewHwTitle('');
    setNewHwSelectedTasks([]);
  };

  const handleCopyCredentials = (s: User) => {
    const text = `Вход в кабинет ученика «Квант & Код»:\nЛогин: ${s.email}\nПароль: ${s.password || '123'}\nОнлайн-доска: ${s.miroBoardUrl || 'в кабинете'}\nСсылка: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Handle Add Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const hints: string[] = [];
    if (newTaskHint1.trim()) hints.push(newTaskHint1.trim());
    if (newTaskHint2.trim()) hints.push(newTaskHint2.trim());

    const created = storage.addTask({
      title: newTaskTitle.trim() || 'Новая задача',
      subject: newTaskSubject,
      topic: newTaskTopic.trim() || 'Общая тема',
      examNumber: newTaskExamNumber.trim() || undefined,
      difficulty: newTaskDifficulty,
      description: newTaskDesc.trim(),
      formula: newTaskFormula.trim() || undefined,
      imageUrl: newTaskImageUrl,
      attachedFiles: newTaskAttachedFiles.length > 0 ? newTaskAttachedFiles : undefined,
      hints: hints.length > 0 ? hints : ['Внимательно проанализируйте условие задачи'],
      correctAnswer: newTaskAnswer.trim() || 'См. решение',
      fullSolution: newTaskSolution.trim() || 'Методическое решение разбирается на уроке.',
      starterCode: newTaskSubject === 'cs' && newTaskStarterCode.trim() ? newTaskStarterCode : undefined,
      language: newTaskSubject === 'cs' ? newTaskLanguage : undefined,
    });

    setShowAddTaskModal(false);
    onTabChange('tasks');
    // Ensure task is immediately visible in the active filter
    if (taskSubjectFilter !== 'all' && taskSubjectFilter !== newTaskSubject) {
      setTaskSubjectFilter('all');
    }
    setTaskSearchQuery('');
    setSelectedTask(created);

    setTaskCreateSuccessMsg(`Задача «${created.title}» успешно добавлена в банк заданий!`);
    confetti({ particleCount: 40, spread: 55 });
    setTimeout(() => setTaskCreateSuccessMsg(null), 4000);

    // Reset inputs
    setNewTaskTitle('');
    setNewTaskTopic('');
    setNewTaskDesc('');
    setNewTaskFormula('');
    setNewTaskImageUrl(undefined);
    setNewTaskAttachedFiles([]);
    setNewTaskHint1('');
    setNewTaskHint2('');
    setNewTaskAnswer('');
    setNewTaskSolution('');
    setNewTaskStarterCode('');
  };

  // Handle Add Note
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    storage.addInformalNote({
      studentId: newNoteStudentId,
      date: new Date().toISOString().split('T')[0],
      subject: newNoteSubject,
      topicCovered: newNoteTopic,
      emotionalState: newNoteEmotional,
      weakSpots: newNoteWeakSpots,
      topicsToReview: newNoteWeakSpots ? [newNoteWeakSpots] : ['Повторение'],
      homeworkPerformance: 'good',
      actionItemsNextLesson: newNoteActionItems,
      internalScore: newNoteScore,
    });
    setShowAddNoteModal(false);
    setNewNoteTopic('');
    setNewNoteWeakSpots('');
    setNewNoteActionItems('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskSubjectFilter !== 'all' && t.subject !== taskSubjectFilter) return false;
    if (taskSearchQuery) {
      const q = taskSearchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q) ||
        (t.examNumber && t.examNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredNotes =
    selectedStudentForNotes === 'all'
      ? notes
      : notes.filter((n) => n.studentId === selectedStudentForNotes);

  const filteredHomeworks = homeworks.filter((hw) => {
    if (hwStudentFilter !== 'all' && hw.studentId !== hwStudentFilter) return false;
    if (hwSubjectFilter !== 'all' && hw.subject !== hwSubjectFilter) return false;
    if (hwStatusFilter !== 'all' && hw.status !== hwStatusFilter) return false;
    if (hwSearchQuery.trim()) {
      const q = hwSearchQuery.toLowerCase();
      const st = students.find((s) => s.id === hw.studentId);
      const matchesTitle = hw.title.toLowerCase().includes(q);
      const matchesStudent = st?.name.toLowerCase().includes(q);
      if (!matchesTitle && !matchesStudent) return false;
    }
    return true;
  });

  const handleSaveHomeworkReview = (updatedHw: Homework) => {
    storage.updateHomework(updatedHw);
    setGradingHw(null);
  };

  const handleDeleteHomework = (hwId: string) => {
    if (window.confirm('Удалить это домашнее задание?')) {
      storage.deleteHomework(hwId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tutor Minimalist Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-[#1B1B19] shadow-xs"
      >
        <div className="flex items-center gap-3.5">
          <UserAvatar name={tutor.name} avatarUrl={tutor.avatarUrl} size="lg" />
          <div>
            <div className="label-academic mb-0.5">Кабинет преподавателя</div>
            <h1 className="font-serif text-2xl font-bold text-[#1B1B19] leading-snug">{tutor.name}</h1>
            <p className="text-xs font-mono text-[#1B1B19]/60">
              {students.length} учеников • {slots.filter((s) => s.isBooked).length} активных занятий
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Variant Creator Button */}
          <button
            onClick={() => setShowVariantBuilderModal(true)}
            className="font-mono text-xs uppercase tracking-wider font-bold px-3 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Создать или загрузить экзаменационный вариант"
          >
            <FileText className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#121316]" />
            <span>+ Вариант КИМ</span>
          </button>

          {/* Direct Task Creator Button */}
          <button
            onClick={() => {
              setNewTaskSubject(taskSubjectFilter !== 'all' ? taskSubjectFilter : 'math');
              setShowAddTaskModal(true);
            }}
            className="font-mono text-xs uppercase tracking-wider font-bold px-3 py-2 bg-white dark:bg-[#1A1C24] hover:bg-[#F8F7F4] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Добавить задачу с формулами и картинкой в банк"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>+ Задача в банк</span>
          </button>

          <button
            onClick={() => setShowBatchImportModal(true)}
            className="font-mono text-xs uppercase tracking-wider font-bold px-3 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-[#E5C048] border border-amber-600/30 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Пакетная загрузка заданий и вариантов из JSON файла"
          >
            <Upload className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#E5C048]" />
            <span>Импорт JSON</span>
          </button>

          {/* Dropdown Menu for All Creation Actions */}
          <div className="relative">
            <button
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="font-mono text-xs uppercase tracking-wider font-bold px-3 py-2 bg-white dark:bg-[#1A1C24] hover:bg-[#F8F7F4] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19] dark:border-[#323642] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Ещё действия</span>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {isCreateMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] shadow-2xl z-30 py-1 font-mono text-xs space-y-0.5">
                <button
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    setShowAddHomeworkModal(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Назначить ДЗ</span>
                </button>

                <button
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    setShowAddStudentModal(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Добавить ученика</span>
                </button>

                <button
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    setShowAddMaterialModal(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Загрузить конспект</span>
                </button>

                <button
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    setShowAddSlotModal(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Слот в Яндекс.Телемосте</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Task Creation Success Notification */}
      {taskCreateSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-50 border border-emerald-700 text-emerald-900 text-xs font-mono flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-bold">{taskCreateSuccessMsg}</span>
          </div>
          <button
            onClick={() => setTaskCreateSuccessMsg(null)}
            className="text-emerald-700 hover:text-black font-bold p-1 text-xs"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* TAB: STUDENTS MANAGEMENT (with Whiteboard integration) */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1B1B19]">Список учеников и онлайн-доска</h2>
              <p className="text-xs font-mono text-[#1B1B19]/60">
                Управление учетными записями, индивидуальными онлайн-досками и успеваемостью
              </p>
            </div>
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="font-mono text-xs font-bold uppercase tracking-wider px-3 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" /> Новый ученик
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((st) => {
              const isCopied = copiedId === st.id;
              const stStats = calculateStudentGamification(
                st,
                homeworks,
                storage.getTopicProgress(),
                storage.getExamNumbers()
              );
              return (
                <motion.div
                  key={st.id}
                  whileHover={{ y: -2 }}
                  className="p-6 bg-white border border-[#1B1B19] flex flex-col justify-between space-y-4 transition shadow-2xs"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={st.name} avatarUrl={st.avatarUrl} size="md" />
                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#1B1B19] leading-snug">{st.name}</h3>
                          <span className="font-mono text-[11px] text-[#1B1B19]/60">{st.grade || '11 класс'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => storage.deleteStudent(st.id)}
                        className="text-[#1B1B19]/40 hover:text-rose-600 p-1 transition"
                        title="Удалить аккаунт"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Whiteboard Link Box */}
                    <div className="p-3 bg-[#F8F7F4] border border-[#1B1B19]/25 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#1B1B19] flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-[#D4AF37]" /> Интерактивная доска:
                        </span>
                        <button
                          onClick={() => {
                            setEditingWhiteboardStudent(st);
                            setTempWhiteboardUrl(st.miroBoardUrl || '');
                          }}
                          className="font-mono text-[10px] text-[#1B1B19]/60 hover:text-[#1B1B19] underline"
                        >
                          Изменить
                        </button>
                      </div>

                      {st.miroBoardUrl ? (
                        <a
                          href={st.miroBoardUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#1B1B19] font-mono font-medium flex items-center justify-between gap-1 p-2 bg-white border border-[#1B1B19] transition hover:bg-[#1B1B19] hover:text-[#F8F7F4]"
                        >
                          <span className="truncate">{st.miroBoardUrl}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingWhiteboardStudent(st);
                            setTempWhiteboardUrl('');
                          }}
                          className="text-xs font-mono text-[#1B1B19]/60 hover:text-[#1B1B19] py-1 block"
                        >
                          + Прикрепить ссылку на онлайн-доску
                        </button>
                      )}
                    </div>

                    {/* Credentials block */}
                    <div className="p-2.5 bg-[#F8F7F4] border border-[#1B1B19]/20 text-xs font-mono space-y-1">
                      <div className="flex justify-between text-[#1B1B19]/60">
                        <span>Логин:</span>
                        <span className="text-[#1B1B19] font-bold">{st.email}</span>
                      </div>
                      <div className="flex justify-between text-[#1B1B19]/60">
                        <span>Пароль:</span>
                        <span className="text-[#1B1B19] font-bold">{st.password || '123'}</span>
                      </div>
                    </div>

                    {/* Target & Score stats */}
                    {!st.onboardingCompleted ? (
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-600/40 text-amber-900 dark:text-amber-300 font-mono text-[11px] space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Ожидает первой настройки учеником
                        </div>
                        <div className="text-[10px] opacity-75">
                          При первом входе ученик выберет форму (ЕГЭ/ОГЭ), предметы и нужные баллы.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 font-mono text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642]">
                            <span className="text-[#1B1B19]/50 dark:text-gray-400 block text-[10px]">Экзамен:</span>
                            <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">{st.targetExam || 'ЕГЭ'}</span>
                          </div>
                          <div className="p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642]">
                            <span className="text-[#1B1B19]/50 dark:text-gray-400 block text-[10px]">Класс:</span>
                            <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">{st.grade || '11 класс'}</span>
                          </div>
                        </div>

                        {st.subjects && st.subjects.length > 0 && (
                          <div className="p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                              Предметы и целевые баллы:
                            </span>
                            <div className="space-y-1">
                              {st.subjects.map((subKey) => {
                                const g = st.subjectGoals?.[subKey];
                                const subName =
                                  subKey === 'math'
                                    ? '📐 Математика'
                                    : subKey === 'physics'
                                    ? '⚡ Физика'
                                    : subKey === 'cs'
                                    ? '💻 Информатика'
                                    : '📖 Русский язык';

                                return (
                                  <div
                                    key={subKey}
                                    className="flex justify-between items-center text-[10px] p-1 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/10 dark:border-[#323642]"
                                  >
                                    <span className="font-semibold text-[#1B1B19] dark:text-[#F3F3EE]">{subName}</span>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                      {st.examKind === 'oge'
                                        ? `Оценка «${g?.gradeGoal || 5}»`
                                        : `${g?.targetScore || st.targetScore || 80}+ б.`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Gamification Level & XP */}
                    <div className="p-2.5 bg-[#F8F7F4] border border-[#1B1B19] flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-[#1B1B19] text-[#F8F7F4] font-bold flex items-center justify-center text-[10px]">
                          {stStats.currentLevel}
                        </span>
                        <span className="text-[11px] font-bold text-[#1B1B19] truncate max-w-[110px]">
                          {stStats.levelTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#1B1B19] font-bold text-[11px] flex items-center gap-0.5">
                          <Zap className="w-3 h-3 text-[#D4AF37] fill-current" />
                          {stStats.totalXp} XP
                        </span>
                        <span className="text-[10px] text-[#1B1B19] bg-white px-1.5 py-0.5 border border-[#1B1B19]">
                          {stStats.badges.filter((b) => b.earned).length} наград
                        </span>
                      </div>
                    </div>

                    {st.parentName && (
                      <div className="text-[11px] font-mono text-[#1B1B19]/60 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#D4AF37]" />
                        <span>
                          {st.parentName} {st.parentPhone && `(${st.parentPhone})`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#1B1B19]/15 space-y-2">
                    <button
                      onClick={() => handleCopyCredentials(st)}
                      className="w-full font-mono text-xs uppercase tracking-wider py-2 px-2.5 bg-white hover:bg-[#1B1B19] hover:text-[#F8F7F4] text-[#1B1B19] border border-[#1B1B19] transition flex items-center justify-center gap-1.5"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? 'Данные скопированы' : 'Скопировать доступы ученику'}
                    </button>

                    <button
                      onClick={() => onOpenReportForStudent(st)}
                      className="w-full font-mono text-xs font-bold uppercase tracking-wider py-2 px-2.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] transition flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Сгенерировать отчет родителям
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: EXAM VARIANTS */}
      {activeTab === 'variants' && (
        <ExamVariantsView
          currentUser={tutor}
          students={students}
          onStartExam={onStartExam || (() => {})}
        />
      )}

      {/* TAB: EXAM SPECS & CONVERSION */}
      {activeTab === 'specs' && (
        <ExamSpecsAndReferenceView />
      )}

      {/* TAB: SCHEDULE (Academic Calendar with Yandex Telemost & Materials) */}
      {activeTab === 'schedule' && (
        <AcademicCalendarView
          currentUser={tutor}
          students={students}
          slots={slots}
          homeworks={homeworks}
          materials={storage.getStudyMaterials()}
          onNavigateToHomework={() => onTabChange('homeworks')}
          onNavigateToMaterials={() => onTabChange('homeworks')}
        />
      )}

      {/* TAB: PROBLEM BANK */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#1B1B19] shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="label-academic mr-1">Предмет:</span>
              {(['all', 'math', 'physics', 'cs', 'russian'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setTaskSubjectFilter(s)}
                  className={`font-mono text-xs px-3 py-1.5 border transition ${
                    taskSubjectFilter === s
                      ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] font-bold'
                      : 'bg-white text-[#1B1B19] border-[#1B1B19]/30 hover:border-[#1B1B19]'
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

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#1B1B19]/50" />
                <input
                  type="text"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder="Поиск по КИМ или теме..."
                  className="w-full bg-[#F8F7F4] text-xs font-mono pl-8 pr-3 py-1.5 border border-[#1B1B19] text-[#1B1B19] focus:outline-none focus:bg-white"
                />
              </div>

              <button
                onClick={() => setShowBatchImportModal(true)}
                className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-[#E5C048] whitespace-nowrap transition flex items-center gap-1.5 border border-amber-600/30 shadow-2xs cursor-pointer"
                title="Загрузить пачку заданий или вариантов из JSON"
              >
                <Upload className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#E5C048]" /> Импорт JSON
              </button>

              <button
                onClick={() => {
                  setNewTaskSubject(taskSubjectFilter !== 'all' ? taskSubjectFilter : 'math');
                  setShowAddTaskModal(true);
                }}
                className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] whitespace-nowrap transition flex items-center gap-1.5 border border-[#1B1B19] dark:border-[#E5C048] shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#121316]" /> Создать задачу
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="p-8 bg-white border border-[#1B1B19] text-center text-[#1B1B19]/50 text-xs font-mono">
                  Задачи не найдены. Нажмите «Создать задачу», чтобы добавить первое задание.
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const isSelected = selectedTask?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className={`p-4 border cursor-pointer transition shadow-2xs ${
                        isSelected
                          ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19]'
                          : 'bg-white border-[#1B1B19]/30 hover:border-[#1B1B19] text-[#1B1B19]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {t.examNumber && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 border font-bold ${
                                isSelected
                                  ? 'border-[#D4AF37] text-[#D4AF37] bg-white/10'
                                  : 'border-[#1B1B19] text-[#1B1B19] bg-[#F8F7F4]'
                              }`}
                            >
                              {t.examNumber}
                            </span>
                          )}
                          <span className="font-mono text-xs capitalize opacity-70">
                            {t.subject === 'math' ? 'Математика' : t.subject === 'physics' ? 'Физика' : 'Информатика'}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] uppercase opacity-60">{t.difficulty}</span>
                      </div>
                      <h4 className="font-serif text-sm font-semibold line-clamp-1">{t.title}</h4>
                      <p className="text-[11px] font-mono opacity-70 mt-0.5 truncate">{t.topic}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="lg:col-span-7">
              {selectedTask ? (
                <div className="p-6 bg-white border border-[#1B1B19] space-y-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1B1B19]/15 gap-2">
                    <div>
                      <div className="label-academic flex items-center gap-1.5 text-[#1B1B19]">
                        <span className="w-2 h-2 bg-[#D4AF37] inline-block" />
                        {selectedTask.examNumber || 'Задание'} • {selectedTask.topic}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-[#1B1B19] mt-0.5">{selectedTask.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedTask.subject === 'cs' && (
                        <button
                          onClick={() => onOpenSandbox(selectedTask.title)}
                          className="font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] transition flex items-center gap-1"
                        >
                          Запустить в IDE
                        </button>
                      )}

                      <button
                        onClick={() => {
                          storage.deleteTask(selectedTask.id);
                          const remaining = filteredTasks.filter((x) => x.id !== selectedTask.id);
                          setSelectedTask(remaining[0] || null);
                        }}
                        className="p-1.5 text-[#1B1B19]/40 hover:text-rose-700 transition"
                        title="Удалить задачу из банка"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-[#1B1B19] dark:text-[#F3F3EE] leading-relaxed bg-[#F8F7F4] dark:bg-[#121316] p-4 border border-[#1B1B19]/20 dark:border-[#323642]">
                    <MathRenderer content={selectedTask.description} />
                  </div>

                  {/* Task Image Preview */}
                  {selectedTask.imageUrl && (
                    <div className="space-y-1.5 p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642]">
                      <span className="label-academic flex items-center gap-1.5 text-[#D4AF37]">
                        <ImageIcon className="w-3.5 h-3.5" /> Чертёж / Иллюстрация к задаче:
                      </span>
                      <div className="flex justify-center bg-white dark:bg-[#1A1C24] p-2 border border-[#1B1B19]/15 dark:border-[#323642]">
                        <img
                          src={selectedTask.imageUrl}
                          alt={selectedTask.title}
                          className="max-h-64 object-contain rounded-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Task Attached Files */}
                  {selectedTask.attachedFiles && selectedTask.attachedFiles.length > 0 && (
                    <div className="space-y-1.5 p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642]">
                      <span className="label-academic flex items-center gap-1.5 text-[#D4AF37]">
                        <FileText className="w-3.5 h-3.5" /> Прикреплённые файлы данных ({selectedTask.attachedFiles.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedTask.attachedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] text-xs font-mono"
                          >
                            <div className="truncate mr-2">
                              <div className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] truncate flex items-center gap-1">
                                <FileText className="w-3 h-3 text-[#D4AF37] shrink-0" />
                                <span className="truncate">{file.name}</span>
                              </div>
                              <div className="text-[10px] text-[#1B1B19]/50 dark:text-gray-400">
                                {file.size || 'Файл'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
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
                              }}
                              className="px-2 py-1 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 transition cursor-pointer"
                            >
                              <Download className="w-3 h-3" /> Скачать
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTask.formula && (
                    <div className="space-y-1">
                      <span className="label-academic block">Формула:</span>
                      <FormulaView formula={selectedTask.formula} />
                    </div>
                  )}

                  {selectedTask.hints?.length > 0 && (
                    <div className="space-y-2">
                      <span className="label-academic flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]" /> Подсказки для ученика:
                      </span>
                      {selectedTask.hints.map((h, i) => (
                        <div
                          key={i}
                          className="text-xs p-3 bg-[#F8F7F4] border border-[#1B1B19]/20 text-[#1B1B19] flex items-start gap-2"
                        >
                          <span className="text-[#D4AF37] font-mono font-bold shrink-0">{i + 1}.</span>
                          <div className="flex-1">
                            <MathRenderer content={h} inline />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#1B1B19]/15 text-xs space-y-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[#1B1B19]/70">Правильный ответ:</span>
                      <span className="font-bold text-[#1B1B19] bg-[#F8F7F4] px-2.5 py-1 border border-[#1B1B19]">
                        {selectedTask.correctAnswer}
                      </span>
                    </div>

                    <div>
                      <span className="label-academic block mb-1">Методическое решение:</span>
                      <div className="text-xs text-[#1B1B19] bg-[#F8F7F4] p-4 border border-[#1B1B19]/20 leading-relaxed font-sans">
                        <MathRenderer content={selectedTask.fullSolution} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 bg-white border border-[#1B1B19] text-center text-[#1B1B19]/50 text-xs font-mono">
                  Выберите задачу из списка слева для просмотра деталей
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: HOMEWORKS & PRACTICE (with JSON batch import) */}
      {activeTab === 'homeworks' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white border border-[#1B1B19] shadow-2xs">
            <div>
              <div className="label-academic mb-0.5">Домашние задания & Практика</div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19]">Журнал домашних заданий</h3>
              <p className="text-xs font-mono text-[#1B1B19]/60">
                Назначение ученикам, проверка решений, комментирование и пакетная загрузка через JSON
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setBatchImportMode('homeworks');
                  setShowBatchImportModal(true);
                }}
                className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-[#E5C048] whitespace-nowrap transition flex items-center gap-1.5 border border-amber-600/30 shadow-2xs cursor-pointer"
                title="Загрузить домашние задания файлом JSON (кому, предмет, дедлайн, задачи)"
              >
                <Upload className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#E5C048]" /> Импорт ДЗ из JSON
              </button>

              <button
                onClick={() => setShowAddHomeworkModal(true)}
                className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] whitespace-nowrap transition flex items-center gap-1.5 border border-[#1B1B19] shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#121316]" /> + Назначить ДЗ
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-[#1B1B19]/20 shadow-2xs">
              <span className="font-mono text-[10px] uppercase font-bold text-[#1B1B19]/60 block">Всего ДЗ</span>
              <div className="font-mono text-xl font-bold text-[#1B1B19] mt-0.5">{homeworks.length}</div>
            </div>
            <div className="p-3 bg-white border border-[#1B1B19]/20 shadow-2xs">
              <span className="font-mono text-[10px] uppercase font-bold text-amber-700 block">Требуют проверки</span>
              <div className="font-mono text-xl font-bold text-amber-700 mt-0.5">
                {homeworks.filter((h) => h.status === 'submitted').length}
              </div>
            </div>
            <div className="p-3 bg-white border border-[#1B1B19]/20 shadow-2xs">
              <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 block">Проверено</span>
              <div className="font-mono text-xl font-bold text-emerald-700 mt-0.5">
                {homeworks.filter((h) => h.status === 'graded').length}
              </div>
            </div>
            <div className="p-3 bg-white border border-[#1B1B19]/20 shadow-2xs">
              <span className="font-mono text-[10px] uppercase font-bold text-blue-700 block">В работе у учеников</span>
              <div className="font-mono text-xl font-bold text-blue-700 mt-0.5">
                {homeworks.filter((h) => h.status === 'assigned').length}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 bg-white border border-[#1B1B19] flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[#1B1B19]/60">Ученик:</span>
                <select
                  value={hwStudentFilter}
                  onChange={(e) => setHwStudentFilter(e.target.value)}
                  className="bg-[#F8F7F4] text-[#1B1B19] border border-[#1B1B19] px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="all">Все ученики</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[#1B1B19]/60">Предмет:</span>
                <select
                  value={hwSubjectFilter}
                  onChange={(e) => setHwSubjectFilter(e.target.value as any)}
                  className="bg-[#F8F7F4] text-[#1B1B19] border border-[#1B1B19] px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="all">Все предметы</option>
                  <option value="math">Математика</option>
                  <option value="physics">Физика</option>
                  <option value="cs">Информатика</option>
                  <option value="russian">Русский язык</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[#1B1B19]/60">Статус:</span>
                <select
                  value={hwStatusFilter}
                  onChange={(e) => setHwStatusFilter(e.target.value as any)}
                  className="bg-[#F8F7F4] text-[#1B1B19] border border-[#1B1B19] px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="all">Все статусы</option>
                  <option value="assigned">Назначено (в процессе)</option>
                  <option value="submitted">Сдано на проверку</option>
                  <option value="graded">Проверено</option>
                </select>
              </div>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#1B1B19]/50" />
              <input
                type="text"
                value={hwSearchQuery}
                onChange={(e) => setHwSearchQuery(e.target.value)}
                placeholder="Поиск по названию или ученику..."
                className="w-full bg-[#F8F7F4] text-xs font-mono pl-8 pr-3 py-1.5 border border-[#1B1B19] text-[#1B1B19] focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Homeworks Cards List */}
          {filteredHomeworks.length === 0 ? (
            <div className="p-12 bg-white border border-[#1B1B19] text-center space-y-3 font-mono text-xs">
              <FileText className="w-8 h-8 text-[#1B1B19]/40 mx-auto" />
              <div className="text-[#1B1B19]/60">Домашние задания по заданным фильтрам не найдены.</div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowAddHomeworkModal(true)}
                  className="px-3 py-1.5 bg-[#1B1B19] text-[#F8F7F4] font-bold uppercase tracking-wider text-[11px]"
                >
                  + Назначить вручную
                </button>
                <button
                  onClick={() => {
                    setBatchImportMode('homeworks');
                    setShowBatchImportModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-600/30 font-bold uppercase tracking-wider text-[11px]"
                >
                  Загрузить из JSON
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHomeworks.map((hw) => {
                const studentObj = students.find((s) => s.id === hw.studentId);
                const subjName =
                  hw.subject === 'math'
                    ? 'Математика'
                    : hw.subject === 'physics'
                    ? 'Физика'
                    : hw.subject === 'cs'
                    ? 'Информатика'
                    : 'Русский язык';

                return (
                  <motion.div
                    key={hw.id}
                    whileHover={{ y: -1 }}
                    className="p-5 bg-white border border-[#1B1B19] shadow-2xs space-y-3.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] px-2 py-0.5 bg-[#1B1B19] text-[#F8F7F4] font-bold uppercase">
                            {subjName}
                          </span>
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 border font-bold ${
                              hw.status === 'graded'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : hw.status === 'submitted'
                                ? 'bg-amber-50 text-amber-900 border-amber-400 animate-pulse'
                                : 'bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            {hw.status === 'graded'
                              ? `Проверено: Оценка «${hw.mark || (hw.grade && hw.grade <= 5 ? hw.grade : (hw.grade && hw.grade >= 85 ? 5 : 4)) || 5}»`
                              : hw.status === 'submitted'
                              ? '⏳ Сдано (ждёт проверки)'
                              : 'В процессе'}
                          </span>
                        </div>

                        <div className="font-mono text-[11px] text-[#1B1B19]/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Дедлайн: {hw.dueDate}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif text-lg font-bold text-[#1B1B19] leading-snug">{hw.title}</h4>
                        <div className="text-xs font-mono text-[#1B1B19]/70 mt-0.5">
                          Ученик:{' '}
                          <span className="font-bold text-[#1B1B19]">{studentObj?.name || 'Ученик'}</span>{' '}
                          {studentObj?.grade && `(${studentObj.grade})`}
                        </div>

                        {/* Submission Badges: Photos, Student Comment, Points */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                          {hw.photos && hw.photos.length > 0 && (
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 font-bold flex items-center gap-1">
                              📷 {hw.photos.length} {hw.photos.length === 1 ? 'фото' : 'фото'} решения
                            </span>
                          )}
                          {hw.studentComment && (
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-300 font-bold flex items-center gap-1" title={hw.studentComment}>
                              💬 Вопрос/комментарий ученика
                            </span>
                          )}
                          {hw.earnedPoints !== undefined && (
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                              {hw.earnedPoints} / {hw.totalPoints || hw.tasks.length} б.
                            </span>
                          )}
                        </div>
                      </div>

                      {hw.studentComment && (
                        <div className="p-2 bg-amber-50/70 border border-amber-300/80 text-xs font-sans text-amber-950 italic">
                          <span className="font-mono text-[10px] uppercase font-bold text-amber-800 not-italic block mb-0.5">
                            Комментарий ученика:
                          </span>
                          «{hw.studentComment}»
                        </div>
                      )}

                      {hw.tasks && hw.tasks.length > 0 && (
                        <div className="p-2.5 bg-[#F8F7F4] border border-[#1B1B19]/15 text-xs font-mono space-y-1">
                          <div className="text-[10px] uppercase font-bold text-[#1B1B19]/60">
                            Прикрепленные задания ({hw.tasks.length}):
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                            {hw.tasks.map((t, idx) => {
                              const foundTask = tasks.find((item) => item.id === t.taskId);
                              return (
                                <div key={idx} className="flex items-center justify-between text-[11px]">
                                  <span className="truncate pr-2">
                                    • {foundTask ? foundTask.title : `Задание ${t.taskId}`}
                                  </span>
                                  {t.score !== undefined && (
                                    <span className="font-bold text-emerald-700 shrink-0">+{t.score} б.</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {hw.tutorFeedback && (
                        <div className="p-2.5 bg-amber-50/70 border border-amber-600/20 text-xs font-sans text-amber-950">
                          <span className="font-mono text-[10px] uppercase font-bold text-amber-800 block mb-0.5">
                            Комментарий преподавателя:
                          </span>
                          {hw.tutorFeedback}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#1B1B19]/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setGradingHw(hw)}
                        className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileEdit className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {hw.status === 'graded' ? 'Изменить оценку / Разбор' : 'Проверить и оценить работу'}
                      </button>

                      <button
                        onClick={() => handleDeleteHomework(hw.id)}
                        className="p-1.5 text-[#1B1B19]/40 hover:text-rose-600 transition cursor-pointer"
                        title="Удалить домашнее задание"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: NOTES JOURNAL */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#1B1B19] shadow-2xs">
            <div>
              <div className="label-academic mb-0.5">Педагогический журнал</div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19]">Журнал заметок после уроков</h3>
              <p className="text-xs font-mono text-[#1B1B19]/60">Психологический настрой, западающие темы и план действий</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStudentForNotes}
                onChange={(e) => setSelectedStudentForNotes(e.target.value)}
                className="text-xs font-mono bg-[#F8F7F4] text-[#1B1B19] border border-[#1B1B19] px-3 py-1.5 focus:outline-none"
              >
                <option value="all">Все ученики</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddNoteModal(true)}
                className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] transition flex items-center gap-1.5 border border-[#1B1B19] shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37]" /> Добавить запись
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.length === 0 ? (
              <div className="col-span-2 p-8 bg-white border border-[#1B1B19] text-center text-[#1B1B19]/50 text-xs font-mono">
                Нет записей в журнале. Нажмите «Добавить запись» после проведенного урока.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const studentObj = students.find((s) => s.id === note.studentId);
                return (
                  <motion.div
                    key={note.id}
                    whileHover={{ y: -2 }}
                    className="p-5 bg-white border border-[#1B1B19] space-y-3.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between pb-2.5 border-b border-[#1B1B19]/15">
                      <div>
                        <span className="font-serif text-base font-bold text-[#1B1B19] block">
                          {studentObj?.name || 'Ученик'}
                        </span>
                        <p className="text-xs font-mono text-[#1B1B19]/70">{note.topicCovered}</p>
                      </div>
                      <div className="text-right text-[11px] text-[#1B1B19]/60 font-mono">
                        {note.date} • <span className="font-bold text-[#1B1B19]">{note.internalScore}/10</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-2 font-mono">
                      <div className="text-[#1B1B19]">
                        <span className="text-[#1B1B19]/50">Настрой: </span>
                        {note.emotionalState}
                      </div>
                      <div className="text-amber-900 bg-amber-50 p-2 border border-amber-300/80">
                        <span className="text-amber-700 font-bold">Слабые места: </span>
                        {note.weakSpots}
                      </div>
                      <div className="text-[#1B1B19]">
                        <span className="text-[#1B1B19]/50">План на следующий урок: </span>
                        {note.actionItemsNextLesson}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: EDIT WHITEBOARD */}
      {editingWhiteboardStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#1B1B19] shadow-2xl p-6 space-y-4 text-xs">
            <div>
              <div className="label-academic mb-0.5">Интерактивная доска</div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19]">
                Онлайн-доска: {editingWhiteboardStudent.name}
              </h3>
              <p className="text-xs font-mono text-[#1B1B19]/60 mt-0.5">
                Вставьте ссылку на интерактивную онлайн-доску (Sboard, Pruffme, Whiteboard и др.), созданную для этого ученика
              </p>
            </div>
            <form onSubmit={handleSaveWhiteboardUrl} className="space-y-3">
              <div>
                <label className="label-academic block mb-1">Ссылка на онлайн-доску:</label>
                <input
                  type="url"
                  required
                  value={tempWhiteboardUrl}
                  onChange={(e) => setTempWhiteboardUrl(e.target.value)}
                  placeholder="https://sboard.online/board/..."
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWhiteboardStudent(null)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F7F4] text-[#1B1B19] font-mono text-xs uppercase tracking-wider border border-[#1B1B19] transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] font-mono text-xs uppercase font-bold tracking-wider transition shadow-2xs"
                >
                  Сохранить ссылку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD STUDY MATERIAL */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-[#1B1B19] shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div>
              <div className="label-academic mb-0.5">Учебные материалы</div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19]">Загрузить конспект / шпаргалку</h3>
              <p className="text-xs font-mono text-[#1B1B19]/60 mt-0.5">
                Материал появится в кабинете ученика с красивым форматированием формул
              </p>
            </div>
            <form onSubmit={handleCreateMaterial} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Предмет:</label>
                  <select
                    value={newMatSubject}
                    onChange={(e) => setNewMatSubject(e.target.value as any)}
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none"
                  >
                    <option value="math">Математика</option>
                    <option value="physics">Физика</option>
                    <option value="cs">Информатика</option>
                    <option value="russian">Русский язык</option>
                  </select>
                </div>
                <div>
                  <label className="label-academic block mb-1">Время на изучение (мин):</label>
                  <input
                    type="number"
                    value={newMatTime}
                    onChange={(e) => setNewMatTime(Number(e.target.value))}
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="label-academic block mb-1">Название конспекта:</label>
                <input
                  type="text"
                  required
                  value={newMatTitle}
                  onChange={(e) => setNewMatTitle(e.target.value)}
                  placeholder="Шпаргалка: Все формулы по..."
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="label-academic block mb-1">Тема кодификатора:</label>
                <input
                  type="text"
                  required
                  value={newMatTopic}
                  onChange={(e) => setNewMatTopic(e.target.value)}
                  placeholder="Например: Электромагнитная индукция"
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="label-academic block mb-1">Содержание конспекта / тезисы:</label>
                <textarea
                  required
                  value={newMatContent}
                  onChange={(e) => setNewMatContent(e.target.value)}
                  placeholder="Ключевые законы, свойства, алгоритмы (поддерживает LaTeX: $...$ и $$...$$)..."
                  rows={4}
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white leading-relaxed"
                />
              </div>

              <div>
                <label className="label-academic block mb-1">Ключевые формулы LaTeX (по одной на строку):</label>
                <textarea
                  value={newMatFormulas}
                  onChange={(e) => setNewMatFormulas(e.target.value)}
                  placeholder="\\varepsilon_i = -\\frac{\\Delta \\Phi}{\\Delta t}&#10;\\Phi = B S \\cos \\alpha"
                  rows={2}
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F7F4] text-[#1B1B19] font-mono text-xs uppercase tracking-wider border border-[#1B1B19] transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] font-mono text-xs uppercase font-bold tracking-wider transition shadow-2xs"
                >
                  Опубликовать конспект
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN HOMEWORK */}
      {showAddHomeworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-[#1B1B19] shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div>
              <div className="label-academic mb-0.5">Домашние задания</div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19]">Назначить домашнее задание</h3>
              <p className="text-xs font-mono text-[#1B1B19]/60 mt-0.5">
                Задачи из банка станут доступны ученику для решения и сдачи
              </p>
            </div>
            <form onSubmit={handleCreateHomework} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Кому назначить:</label>
                  <select
                    value={newHwStudentId}
                    onChange={(e) => setNewHwStudentId(e.target.value)}
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-academic block mb-1">Срок сдачи (дедлайн):</label>
                  <input
                    type="date"
                    required
                    value={newHwDueDate}
                    onChange={(e) => setNewHwDueDate(e.target.value)}
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="label-academic block mb-1">Название ДЗ:</label>
                <input
                  type="text"
                  required
                  value={newHwTitle}
                  onChange={(e) => setNewHwTitle(e.target.value)}
                  placeholder="ДЗ №5: Параметры и стереометрия"
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label-academic">Выберите задачи из банка:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddHomeworkModal(false);
                      setNewTaskSubject(taskSubjectFilter !== 'all' ? taskSubjectFilter : 'math');
                      setShowAddTaskModal(true);
                    }}
                    className="font-mono text-[11px] text-[#1B1B19] hover:underline flex items-center gap-1 font-bold transition"
                  >
                    <Plus className="w-3 h-3 text-[#D4AF37]" /> + Создать задачу в банк
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-[#1B1B19] p-2 bg-[#F8F7F4]">
                  {tasks.length === 0 ? (
                    <div className="p-3 text-center text-[#1B1B19]/50 font-mono text-xs">
                      Банк задач пуст. Нажмите «Создать задачу в банк» выше.
                    </div>
                  ) : (
                    tasks.map((t) => {
                      const isChecked = newHwSelectedTasks.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 p-2 hover:bg-white border border-transparent hover:border-[#1B1B19]/20 transition cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewHwSelectedTasks([...newHwSelectedTasks, t.id]);
                              } else {
                                setNewHwSelectedTasks(newHwSelectedTasks.filter((id) => id !== t.id));
                              }
                            }}
                          />
                          {t.examNumber && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-[#1B1B19] font-bold">
                              {t.examNumber}
                            </span>
                          )}
                          <span className="text-[#1B1B19] truncate font-medium">{t.title}</span>
                          <span className="text-[10px] font-mono text-[#1B1B19]/50 ml-auto shrink-0">
                            {t.subject}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddHomeworkModal(false)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F7F4] text-[#1B1B19] font-mono text-xs uppercase tracking-wider border border-[#1B1B19] transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] font-mono text-xs uppercase font-bold tracking-wider transition shadow-2xs"
                >
                  Назначить задание
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#1B1B19] shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
            <div>
              <div className="label-academic mb-0.5">Ученики</div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19]">Создать аккаунт ученика</h3>
              <p className="text-xs font-mono text-[#1B1B19]/60 mt-0.5">
                Будет сформирован логин, профиль подготовки и доступ к доске
              </p>
            </div>

            {studentCreateError && (
              <div className="p-3 border border-rose-600 bg-rose-50 text-rose-800 font-mono text-xs">
                {studentCreateError}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3.5">
              <div>
                <label className="label-academic block mb-1">ФИО ученика *</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Иван Петров"
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Email (Логин) *</label>
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="ivan@student.ru"
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="label-academic block mb-1">Пароль *</label>
                  <input
                    type="text"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="label-academic block mb-1 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-[#D4AF37]" /> Ссылка на онлайн-доску для ученика:
                </label>
                <input
                  type="url"
                  value={studentWhiteboardUrl}
                  onChange={(e) => setStudentWhiteboardUrl(e.target.value)}
                  placeholder="https://sboard.online/board/..."
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Класс</label>
                  <input
                    type="text"
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    placeholder="11 класс"
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="label-academic block mb-1">Экзамен</label>
                  <select
                    value={studentTargetExam}
                    onChange={(e) => setStudentTargetExam(e.target.value as any)}
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none"
                  >
                    <option value="ЕГЭ Профиль">ЕГЭ Профиль</option>
                    <option value="ОГЭ">ОГЭ</option>
                    <option value="Олимпиада">Олимпиада</option>
                    <option value="ВУЗ">ВУЗ</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="label-academic">Целевой балл:</span>
                  <span className="font-mono font-bold text-sm text-[#1B1B19]">{studentTargetScore} б.</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={studentTargetScore}
                  onChange={(e) => setStudentTargetScore(Number(e.target.value))}
                  className="w-full accent-[#1B1B19]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F7F4] text-[#1B1B19] font-mono text-xs uppercase tracking-wider border border-[#1B1B19] transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] font-mono text-xs uppercase font-bold tracking-wider transition shadow-2xs"
                >
                  Создать аккаунт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SLOT (Yandex Telemost) */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#1B1B19] shadow-2xl p-6 space-y-4 text-xs">
            <div>
              <div className="label-academic mb-0.5">Расписание</div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19]">Выставить слот (Яндекс.Телемост)</h3>
              <p className="text-xs font-mono text-[#1B1B19]/60 mt-0.5">
                Слот станет доступен ученикам для бронирования в их личном кабинете
              </p>
            </div>
            <form onSubmit={handleCreateSlot} className="space-y-3.5">
              <div>
                <label className="label-academic block mb-1">Дата занятия:</label>
                <input
                  type="date"
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Начало:</label>
                  <input
                    type="time"
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="label-academic block mb-1">Окончание:</label>
                  <input
                    type="time"
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-academic block mb-1">Ссылка на Яндекс.Телемост:</label>
                <input
                  type="url"
                  value={newSlotTelemost}
                  onChange={(e) => setNewSlotTelemost(e.target.value)}
                  placeholder="https://telemost.yandex.ru/j/..."
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="label-academic block mb-1">Тема занятия:</label>
                <input
                  type="text"
                  value={newSlotTopic}
                  onChange={(e) => setNewSlotTopic(e.target.value)}
                  placeholder="Разбор задания 18 (параметры)"
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F7F4] text-[#1B1B19] font-mono text-xs uppercase tracking-wider border border-[#1B1B19] transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] font-mono text-xs uppercase font-bold tracking-wider transition shadow-2xs"
                >
                  Опубликовать слот
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NOTE */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-[#1B1B19] shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div>
              <div className="label-academic mb-0.5">Журнал репетитора</div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19]">Заметка после проведенного урока</h3>
              <p className="text-xs font-mono text-[#1B1B19]/60 mt-0.5">
                Зафиксируйте настрой, западающие вопросы и план следующего занятия
              </p>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-3.5">
              <div>
                <label className="label-academic block mb-1">Ученик:</label>
                <select
                  value={newNoteStudentId}
                  onChange={(e) => setNewNoteStudentId(e.target.value)}
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-academic block mb-1">Тема урока:</label>
                <input
                  type="text"
                  required
                  value={newNoteTopic}
                  onChange={(e) => setNewNoteTopic(e.target.value)}
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="label-academic block mb-1">Настрой и психологическое состояние:</label>
                <input
                  type="text"
                  required
                  value={newNoteEmotional}
                  onChange={(e) => setNewNoteEmotional(e.target.value)}
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="label-academic block mb-1">Слабые места / пробелы:</label>
                <textarea
                  required
                  value={newNoteWeakSpots}
                  onChange={(e) => setNewNoteWeakSpots(e.target.value)}
                  rows={2}
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="label-academic block mb-1">План на следующий урок:</label>
                <input
                  type="text"
                  required
                  value={newNoteActionItems}
                  onChange={(e) => setNewNoteActionItems(e.target.value)}
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F7F4] text-[#1B1B19] font-mono text-xs uppercase tracking-wider border border-[#1B1B19] transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] font-mono text-xs uppercase font-bold tracking-wider transition shadow-2xs"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK TO BANK */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white border border-[#1B1B19] shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="border-b border-[#1B1B19]/15 pb-3">
              <div className="label-academic mb-0.5">Банк задач</div>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19]">Добавить задачу в банк</h3>
              <p className="text-xs font-mono text-[#1B1B19]/60 mt-0.5">
                Задача станет доступна для разбора на занятиях и назначения в домашние задания
              </p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Предмет *</label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value as any)}
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none"
                  >
                    <option value="math">Математика</option>
                    <option value="physics">Физика</option>
                    <option value="cs">Информатика</option>
                    <option value="russian">Русский язык</option>
                  </select>
                </div>
                <div>
                  <label className="label-academic block mb-1">Номер КИМ (ЕГЭ/ОГЭ)</label>
                  <input
                    type="text"
                    value={newTaskExamNumber}
                    onChange={(e) => setNewTaskExamNumber(e.target.value)}
                    placeholder="Например: ЕГЭ №18 или ЕГЭ №24"
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="label-academic block mb-1">Название задачи *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Например: Графический метод с параметром"
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Тема кодификатора *</label>
                  <input
                    type="text"
                    required
                    value={newTaskTopic}
                    onChange={(e) => setNewTaskTopic(e.target.value)}
                    placeholder="Например: Параметры и пучки прямых"
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="label-academic block mb-1">Сложность</label>
                  <select
                    value={newTaskDifficulty}
                    onChange={(e) => setNewTaskDifficulty(e.target.value as any)}
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none"
                  >
                    <option value="easy">Базовая</option>
                    <option value="medium">Профильная</option>
                    <option value="hard">Повышенная (2 часть)</option>
                    <option value="olympiad">Олимпиадная</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label-academic">Условие задачи *</label>
                  <button
                    type="button"
                    onClick={() => setShowTaskFormulaPreview(!showTaskFormulaPreview)}
                    className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    {showTaskFormulaPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showTaskFormulaPreview ? 'Скрыть предпросмотр' : 'Показать формулы'}
                  </button>
                </div>

                <FormulaHelperBar
                  onInsert={(snippet) => setNewTaskDesc((prev) => (prev ? `${prev} ${snippet}` : snippet))}
                  className="mb-1.5"
                />

                <textarea
                  required
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Полный текст условия. Оборачивайте формулы в $...$ для строчных или $$...$$ для выключных..."
                  rows={3}
                  className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19] dark:border-[#323642] text-xs focus:outline-none focus:bg-white dark:focus:bg-[#1A1C24] leading-relaxed"
                />

                {showTaskFormulaPreview && newTaskDesc.trim() && (
                  <div className="p-3 mt-1.5 bg-[#FFFDF5] dark:bg-[#12141B] border border-[#D4AF37]/50 text-xs">
                    <div className="label-academic text-[#D4AF37] mb-1">Предпросмотр формул:</div>
                    <MathRenderer content={newTaskDesc} />
                  </div>
                )}
              </div>

              {/* Attachments: Image and Data Files */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Image Upload for All Subjects */}
                <div className="p-2.5 border border-[#1B1B19]/20 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 text-[11px] text-[#1B1B19] dark:text-[#F3F3EE]">
                      <ImageIcon className="w-3.5 h-3.5 text-[#D4AF37]" /> Иллюстрация / Чертёж
                    </span>
                    <label className="px-2 py-0.5 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" /> Загрузить
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setNewTaskImageUrl(evt.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {newTaskImageUrl ? (
                    <div className="relative border border-[#1B1B19]/20 dark:border-[#323642] bg-white dark:bg-[#1A1C24] p-1">
                      <img src={newTaskImageUrl} alt="Чертёж" className="max-h-28 mx-auto object-contain" />
                      <button
                        type="button"
                        onClick={() => setNewTaskImageUrl(undefined)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                        title="Удалить картинку"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 italic">
                      Геометрия, график, чертёж или схема задачи.
                    </p>
                  )}
                </div>

                {/* File Attachments (for Informatics / Data) */}
                <div className="p-2.5 border border-[#1B1B19]/20 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 text-[11px] text-[#1B1B19] dark:text-[#F3F3EE]">
                      <FileText className="w-3.5 h-3.5 text-[#D4AF37]" /> Файлы данных (Информатика)
                    </span>
                    <label className="px-2 py-0.5 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" /> Добавить
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
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
                              reader.onload = (evt) => {
                                const text = evt.target?.result as string;
                                let dataUrl = '';
                                try {
                                  dataUrl = `data:text/plain;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(text)))}`;
                                } catch {
                                  dataUrl = '';
                                }
                                setNewTaskAttachedFiles((prev) => [
                                  ...prev.filter((f) => f.name !== file.name),
                                  {
                                    name: file.name,
                                    size: `${(file.size / 1024).toFixed(1)} КБ`,
                                    content: text,
                                    dataUrl,
                                  },
                                ]);
                              };
                              reader.readAsText(file);
                            } else {
                              reader.onload = (evt) => {
                                const dataUrl = evt.target?.result as string;
                                setNewTaskAttachedFiles((prev) => [
                                  ...prev.filter((f) => f.name !== file.name),
                                  {
                                    name: file.name,
                                    size: `${(file.size / 1024).toFixed(1)} КБ`,
                                    dataUrl,
                                  },
                                ]);
                              };
                              reader.readAsDataURL(file);
                            }
                          });
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {newTaskAttachedFiles.length > 0 ? (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {newTaskAttachedFiles.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center justify-between p-1 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] text-[10px]"
                        >
                          <span className="truncate font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                            {f.name} ({f.size || 'файл'})
                          </span>
                          <button
                            type="button"
                            onClick={() => setNewTaskAttachedFiles((prev) => prev.filter((x) => x.name !== f.name))}
                            className="text-rose-500 hover:text-rose-700 ml-1 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 italic">
                      Файлы 17.txt, 24.txt, 26.csv, 27.txt к заданиям.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="label-academic block mb-1">Формула (LaTeX / KaTeX, опционально):</label>
                <input
                  type="text"
                  value={newTaskFormula}
                  onChange={(e) => setNewTaskFormula(e.target.value)}
                  placeholder="\sqrt{x^2 - 4x + 3} = x + a"
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                />
                {newTaskFormula.trim() && (
                  <div className="mt-2 p-2.5 bg-[#F8F7F4] border border-[#1B1B19] flex items-center gap-2">
                    <span className="label-academic shrink-0">Предпросмотр:</span>
                    <FormulaView formula={newTaskFormula} />
                  </div>
                )}
              </div>

              {newTaskSubject === 'cs' && (
                <div className="space-y-3 p-3 bg-[#F8F7F4] border border-[#1B1B19]">
                  <div className="flex items-center justify-between">
                    <span className="label-academic text-[#1B1B19]">Настройки информатики:</span>
                    <select
                      value={newTaskLanguage}
                      onChange={(e) => setNewTaskLanguage(e.target.value as any)}
                      className="bg-white text-[#1B1B19] font-mono text-xs px-2 py-1 border border-[#1B1B19]"
                    >
                      <option value="python">Python 3</option>
                      <option value="cpp">C++ (GCC)</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-academic block mb-1">
                      Шаблон кода для ученика (Starter Code):
                    </label>
                    <textarea
                      value={newTaskStarterCode}
                      onChange={(e) => setNewTaskStarterCode(e.target.value)}
                      placeholder="import sys&#10;&#10;def solve(data):&#10;    # напишите решение&#10;    pass"
                      rows={3}
                      className="w-full bg-white text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-academic block mb-1">Подсказка 1 для ученика:</label>
                  <input
                    type="text"
                    value={newTaskHint1}
                    onChange={(e) => setNewTaskHint1(e.target.value)}
                    placeholder="Первый шаг к решению..."
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="label-academic block mb-1">Подсказка 2:</label>
                  <input
                    type="text"
                    value={newTaskHint2}
                    onChange={(e) => setNewTaskHint2(e.target.value)}
                    placeholder="Второй шаг..."
                    className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="label-academic block mb-1">
                  Правильный ответ <span className="text-[#1B1B19]/50 font-normal">(опционально)</span>
                </label>
                <input
                  type="text"
                  value={newTaskAnswer}
                  onChange={(e) => setNewTaskAnswer(e.target.value)}
                  placeholder="Например: [-3; -1) или 42 (или оставьте пустым)"
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] font-mono text-xs focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="label-academic block mb-1">
                  Полное методическое решение <span className="text-[#1B1B19]/50 font-normal">(опционально)</span>:
                </label>
                <textarea
                  value={newTaskSolution}
                  onChange={(e) => setNewTaskSolution(e.target.value)}
                  placeholder="Пошаговый ход решения для репетитора или ученика..."
                  rows={3}
                  className="w-full bg-[#F8F7F4] text-[#1B1B19] p-2.5 border border-[#1B1B19] text-xs focus:outline-none focus:bg-white leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[#1B1B19]/15 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8F7F4] text-[#1B1B19] font-mono text-xs uppercase tracking-wider border border-[#1B1B19] transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] font-mono text-xs uppercase font-bold tracking-wider transition shadow-2xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Добавить задачу в банк
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GRADE & REVIEW HOMEWORK */}
      {gradingHw && (
        <HomeworkReviewModal
          homework={gradingHw}
          student={students.find((s) => s.id === gradingHw.studentId)}
          tasks={tasks}
          onClose={() => setGradingHw(null)}
          onSaveGrading={handleSaveHomeworkReview}
        />
      )}

      {/* Variant Builder Modal for Tutor */}
      <VariantBuilderModal
        isOpen={showVariantBuilderModal}
        onClose={() => setShowVariantBuilderModal(false)}
        students={students}
        onVariantCreated={() => {
          onTabChange('variants');
        }}
      />

      {/* Batch JSON Import Modal for Tasks, Variants & Homeworks */}
      <BatchImportModal
        isOpen={showBatchImportModal}
        onClose={() => setShowBatchImportModal(false)}
        defaultMode={batchImportMode}
        onSuccess={() => {
          // Handled via storage subscriptions
        }}
      />
    </div>
  );
};
