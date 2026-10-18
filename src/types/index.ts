export type Role = 'tutor' | 'student';

export type Subject = 'math' | 'physics' | 'cs' | 'russian';

export type ExamKind = 'ege' | 'oge';

export interface SubjectGoal {
  targetScore: number;
  currentScore?: number;
  gradeGoal?: number; // for ОГЭ: 4 or 5
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  avatarUrl?: string;
  // Student specific
  examKind?: ExamKind;
  targetExam?: string;
  targetScore?: number;
  currentScore?: number;
  subjects?: Subject[];
  subjectGoals?: Partial<Record<Subject, SubjectGoal>>;
  onboardingCompleted?: boolean;
  parentName?: string;
  parentPhone?: string;
  grade?: string; // e.g. "11 класс", "9 класс"
  notes?: string;
  miroBoardUrl?: string; // Link to personal online whiteboard (Sboard, Pruffme, etc.)
  claimedRewards?: string[]; // IDs of claimed XP rewards
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  receiverId: string;
  content: string;
  timestamp: string; // HH:mm or ISO
  read: boolean;
}

export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subject: Subject;
  tutorId: string;
  isBooked: boolean;
  studentId?: string;
  studentName?: string;
  topic?: string;
  meetingLink?: string;
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  // New calendar & booking fields
  isWindow?: boolean; // If true, this is a tutor open window (e.g. 19:00 - 23:00) that students can book from
  studentComment?: string; // Student notes / requests on what to cover
  durationMinutes?: number; // Chosen duration in minutes
  homeworkId?: string; // Attached homework ID for this lesson
  homeworkTitle?: string;
  materialIds?: string[]; // Attached study materials IDs
  materialTitles?: string[];
  notes?: string; // Tutor lesson plan or notes
  // Tutor personal schedule events (invisible to students)
  isPersonal?: boolean;
  personalCategory?: 'review' | 'prep' | 'methodology' | 'personal' | 'webinar';
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface AttachedFile {
  id?: string;
  name: string;
  size?: string;
  content?: string; // Text content or data URL
  dataUrl?: string;
}

export interface Task {
  id: string;
  subject: Subject;
  topic: string;
  examNumber?: string; // e.g. "ЕГЭ №14", "ОГЭ №20", "ЕГЭ №27"
  difficulty: 'easy' | 'medium' | 'hard' | 'olympiad';
  title: string;
  description: string;
  formula?: string;
  imageUrl?: string;
  attachedFiles?: AttachedFile[];
  hints: string[];
  correctAnswer: string;
  fullSolution: string;
  starterCode?: string; // For CS
  language?: 'python' | 'cpp' | 'javascript';
  testCases?: TestCase[]; // For CS automated checking
  createdAt: string;
}

export interface HomeworkTaskItem {
  taskId: string;
  studentAnswer?: string;
  studentCode?: string;
  passedAllTests?: boolean;
  isCorrect?: boolean;
  tutorComment?: string;
  score?: number; // Primary points earned (e.g. 0, 1, 2)
  maxScore?: number; // Max points possible (e.g. 1 or 2)
}

export interface Homework {
  id: string;
  studentId: string;
  subject: Subject;
  title: string;
  assignedDate: string;
  dueDate: string;
  status: 'assigned' | 'submitted' | 'graded';
  tasks: HomeworkTaskItem[];
  tutorFeedback?: string;
  grade?: number; // Balanced mark (2, 3, 4, 5) or score
  mark?: 5 | 4 | 3 | 2; // School mark: 5 (Отлично), 4 (Хорошо), 3 (Удовл.), 2 (На доработку)
  earnedPoints?: number; // Total points earned across tasks
  totalPoints?: number; // Total points possible across tasks
  studentComment?: string; // Student notes/questions when submitting
  submittedAt?: string; // ISO date-time of student submission
  photos?: string[]; // Array of base64 data URLs or links of student handwritten work photos
  attachments?: string[]; // Additional file attachments
}

export interface StudyMaterial {
  id: string;
  subject: Subject;
  title: string;
  topic: string;
  type: 'cheat_sheet' | 'formula_pack' | 'lecture_notes' | 'code_sample';
  content: string;
  keyFormulas?: string[];
  externalUrl?: string;
  readTimeMinutes: number;
}

export interface ExamTopicProgress {
  topicId: string;
  topicName: string;
  subject: Subject;
  examKind?: ExamKind;
  examNumbersCovered?: string;
  masteryPercentage: number; // 0 to 100
  tasksSolved: number;
  tasksTotal: number;
}

export interface ExamNumberProgress {
  examNumber: string; // e.g. "ЕГЭ №1", "ОГЭ №19"
  title: string;
  subject: Subject;
  examKind?: ExamKind;
  status: 'not_started' | 'in_progress' | 'mastered';
  accuracy: number; // 0 - 100%
  primaryPoints: number; // Max primary points for this task (e.g. 1, 2, 3, 4)
}

export interface InformalNote {
  id: string;
  studentId: string;
  date: string;
  subject: Subject;
  topicCovered: string;
  emotionalState: string; // e.g. "Высокая концентрация", "Устал после школы", "Тревожность перед пробником"
  weakSpots: string; // e.g. "Путает знаки при раскрытии скобок", "Забыл ОДЗ для логарифма", "Не учитывает краевые случаи в N=1"
  topicsToReview: string[]; // e.g. ["Тригонометрический круг", "Метод интервалов"]
  homeworkPerformance: 'excellent' | 'good' | 'average' | 'poor';
  actionItemsNextLesson: string;
  internalScore: number; // 1-10
}

export interface PistonExecuteResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
  };
}

export interface VariantTask {
  number: number;
  title: string;
  topic?: string;
  description: string;
  formula?: string;
  imageUrl?: string;
  attachedFiles?: AttachedFile[];
  maxScore: number;
  isPartTwo?: boolean;
  correctAnswer?: string;
  criteria?: string;
  solution?: string;
  starterCode?: string;
}

export interface ExamVariant {
  id: string;
  title: string;
  subject: Subject;
  examType: 'ЕГЭ' | 'ОГЭ';
  timeLimitMinutes: number; // e.g. 235 for 3h 55m
  description?: string;
  tasks: VariantTask[];
  createdAt: string;
  assignedStudentIds?: string[];
  maxPrimaryScore: number;
}

export interface VariantSubmission {
  id: string;
  variantId: string;
  variantTitle: string;
  studentId: string;
  studentName: string;
  subject: Subject;
  answers: Record<number, string>;
  partTwoScores?: Record<number, number>;
  partTwoNotes?: Record<number, string>;
  submittedAt: string;
  timeSpentSeconds: number;
  totalPrimaryScore: number;
  maxPrimaryScore: number;
  secondaryScore: number;
  status: 'completed' | 'in_progress';
}

export interface XPReward {
  id: string;
  title: string;
  description: string;
  costXP: number;
  category: 'materials' | 'privilege' | 'consultation' | 'badge';
  icon: string;
  secretContent?: string;
}
