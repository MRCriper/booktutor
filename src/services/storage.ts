import {
  User,
  TimeSlot,
  Task,
  Homework,
  StudyMaterial,
  ExamTopicProgress,
  ExamNumberProgress,
  InformalNote,
  Role,
  Subject,
  ExamVariant,
  VariantSubmission,
  XPReward,
  ExamKind,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_SLOTS,
  INITIAL_TASKS,
  INITIAL_HOMEWORKS,
  INITIAL_STUDY_MATERIALS,
  INITIAL_TOPIC_PROGRESS,
  INITIAL_EXAM_NUMBERS,
  INITIAL_INFORMAL_NOTES,
  INITIAL_CHAT_MESSAGES,
  INITIAL_EXAM_VARIANTS,
  INITIAL_XP_REWARDS,
} from '../data/initialData';
import { FULL_EXAM_TOPICS, FULL_EXAM_NUMBERS } from '../data/fipiCodifierData';
import { ChatMessage } from '../types';

const STORAGE_KEYS = {
  USERS: 'booktutor_v7_users',
  AUTH_USER_ID: 'booktutor_v7_auth_user_id',
  SLOTS: 'booktutor_v7_slots',
  TASKS: 'booktutor_v7_tasks',
  HOMEWORKS: 'booktutor_v7_homeworks',
  MATERIALS: 'booktutor_v7_materials',
  TOPIC_PROGRESS: 'booktutor_v7_topic_progress',
  EXAM_NUMBERS: 'booktutor_v7_exam_numbers',
  INFORMAL_NOTES: 'booktutor_v7_informal_notes',
  CHAT_MESSAGES: 'booktutor_v7_chat_messages',
  VARIANTS: 'booktutor_v7_variants',
  SUBMISSIONS: 'booktutor_v7_variant_submissions',
  XP_REWARDS: 'booktutor_v7_xp_rewards',
};

type Listener = () => void;

class StorageService {
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initDefaults();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  public initDefaults(force = false) {
    if (force || !localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      // Pre-login as Tutor on first visit so user immediately sees the system, or null
      this.setItem(STORAGE_KEYS.AUTH_USER_ID, INITIAL_USERS[0].id);
      this.setItem(STORAGE_KEYS.SLOTS, INITIAL_SLOTS);
      this.setItem(STORAGE_KEYS.TASKS, INITIAL_TASKS);
      this.setItem(STORAGE_KEYS.HOMEWORKS, INITIAL_HOMEWORKS);
      this.setItem(STORAGE_KEYS.MATERIALS, INITIAL_STUDY_MATERIALS);
      this.setItem(STORAGE_KEYS.TOPIC_PROGRESS, INITIAL_TOPIC_PROGRESS);
      this.setItem(STORAGE_KEYS.EXAM_NUMBERS, INITIAL_EXAM_NUMBERS);
      this.setItem(STORAGE_KEYS.INFORMAL_NOTES, INITIAL_INFORMAL_NOTES);
      this.setItem(STORAGE_KEYS.CHAT_MESSAGES, INITIAL_CHAT_MESSAGES);
      this.setItem(STORAGE_KEYS.VARIANTS, INITIAL_EXAM_VARIANTS);
      this.setItem(STORAGE_KEYS.SUBMISSIONS, []);
      this.setItem(STORAGE_KEYS.XP_REWARDS, INITIAL_XP_REWARDS);
    }
  }

  // Authentication & Session
  public getAuthSession(): User | null {
    const authId = localStorage.getItem(STORAGE_KEYS.AUTH_USER_ID);
    if (!authId) return null;
    const users = this.getUsers();
    return users.find((u) => u.id === authId) || null;
  }

  public login(email: string, password: string): { success: boolean; user?: User; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const users = this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'Пользователь с таким email не найден' };
    }

    if (user.password && user.password !== cleanPass) {
      return { success: false, error: 'Неверный пароль' };
    }

    localStorage.setItem(STORAGE_KEYS.AUTH_USER_ID, user.id);
    this.notify();
    return { success: true, user };
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER_ID);
    this.notify();
  }

  // Users Management
  public getUsers(): User[] {
    const list = this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    if (!list || list.length <= 1) {
      return INITIAL_USERS;
    }
    return list;
  }

  public getStudents(): User[] {
    return this.getUsers().filter((u) => u.role === 'student');
  }

  public getTutor(): User {
    const users = this.getUsers();
    return users.find((u) => u.role === 'tutor') || users[0];
  }

  public createStudent(data: {
    name: string;
    email: string;
    password?: string;
    grade?: string;
    targetExam?: string;
    examKind?: ExamKind;
    targetScore?: number;
    parentName?: string;
    parentPhone?: string;
    notes?: string;
    miroBoardUrl?: string;
    subjects?: Subject[];
  }): { success: boolean; student?: User; error?: string } {
    const users = this.getUsers();
    const cleanEmail = data.email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }

    const newStudent: User = {
      id: `student-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password?.trim() || '123456',
      role: 'student',
      grade: data.grade || '11 класс',
      targetExam: data.targetExam || 'ЕГЭ',
      examKind: data.examKind || 'ege',
      targetScore: Number(data.targetScore) || 0,
      currentScore: 0,
      subjects: data.subjects || [],
      subjectGoals: {},
      onboardingCompleted: false, // Student fills out their exam and scores on first login
      parentName: data.parentName?.trim() || '',
      parentPhone: data.parentPhone?.trim() || '',
      notes: data.notes?.trim() || '',
      miroBoardUrl: data.miroBoardUrl?.trim() || '',
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.setItem(STORAGE_KEYS.USERS, [...users, newStudent]);
    return { success: true, student: newStudent };
  }

  public updateStudentProfile(studentId: string, updates: Partial<User>): void {
    const users = this.getUsers();
    const updated = users.map((u) => (u.id === studentId ? { ...u, ...updates } : u));
    this.setItem(STORAGE_KEYS.USERS, updated);
  }

  public updateStudentMiroBoard(studentId: string, url: string): void {
    const users = this.getUsers();
    const updated = users.map((u) => (u.id === studentId ? { ...u, miroBoardUrl: url } : u));
    this.setItem(STORAGE_KEYS.USERS, updated);
  }

  // Chat Methods
  public getChatMessages(userId1?: string, userId2?: string): ChatMessage[] {
    const all = this.getItem<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, INITIAL_CHAT_MESSAGES);
    if (!userId1 && !userId2) return all;
    if (userId1 && !userId2) {
      return all.filter((m) => m.senderId === userId1 || m.receiverId === userId1);
    }
    return all.filter(
      (m) =>
        (m.senderId === userId1 && m.receiverId === userId2) ||
        (m.senderId === userId2 && m.receiverId === userId1)
    );
  }

  public sendChatMessage(msg: {
    senderId: string;
    senderName: string;
    senderRole: Role;
    receiverId: string;
    content: string;
  }): ChatMessage {
    const all = this.getItem<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, INITIAL_CHAT_MESSAGES);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...msg,
      timestamp: timeStr,
      read: false,
    };
    this.setItem(STORAGE_KEYS.CHAT_MESSAGES, [...all, newMsg]);
    return newMsg;
  }

  public deleteStudent(studentId: string): void {
    const users = this.getUsers().filter((u) => u.id !== studentId);
    this.setItem(STORAGE_KEYS.USERS, users);

    // Also remove their booked slots & homeworks
    const slots = this.getSlots().map((s) =>
      s.studentId === studentId
        ? { ...s, isBooked: false, studentId: undefined, studentName: undefined, status: 'available' as const }
        : s
    );
    this.setItem(STORAGE_KEYS.SLOTS, slots);

    const hws = this.getHomeworks().filter((h) => h.studentId !== studentId);
    this.setItem(STORAGE_KEYS.HOMEWORKS, hws);

    const notes = this.getInformalNotes().filter((n) => n.studentId !== studentId);
    this.setItem(STORAGE_KEYS.INFORMAL_NOTES, notes);
  }

  // Time Slots & Scheduling
  public getSlots(): TimeSlot[] {
    const slots = this.getItem<TimeSlot[]>(STORAGE_KEYS.SLOTS, INITIAL_SLOTS);
    if (!slots.some((s) => s.id === 'slot-window-mon')) {
      const merged = [...INITIAL_SLOTS, ...slots.filter((s) => !INITIAL_SLOTS.some((is) => is.id === s.id))];
      this.setItem(STORAGE_KEYS.SLOTS, merged);
      return merged;
    }
    return slots;
  }

  public addSlot(slot: Omit<TimeSlot, 'id'>): TimeSlot {
    const slots = this.getSlots();
    const newSlot: TimeSlot = {
      ...slot,
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    this.setItem(STORAGE_KEYS.SLOTS, [newSlot, ...slots]);
    return newSlot;
  }

  public bookSlot(
    slotId: string,
    student: User,
    details?: {
      topic?: string;
      studentComment?: string;
      subject?: Subject;
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
    }
  ): boolean {
    const slots = this.getSlots();
    const updated = slots.map((s) => {
      if (s.id === slotId) {
        return {
          ...s,
          isBooked: true,
          studentId: student.id,
          studentName: student.name,
          topic: details?.topic || s.topic || `Занятие по предмету: ${details?.subject || s.subject}`,
          subject: details?.subject || s.subject,
          startTime: details?.startTime || s.startTime,
          endTime: details?.endTime || s.endTime,
          durationMinutes: details?.durationMinutes,
          studentComment: details?.studentComment,
          status: 'booked' as const,
          meetingLink: s.meetingLink || `https://telemost.yandex.ru/j/${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
        };
      }
      return s;
    });
    this.setItem(STORAGE_KEYS.SLOTS, updated);
    return true;
  }

  public bookWindowSlot(
    windowSlotId: string,
    student: User,
    booking: {
      date: string;
      startTime: string;
      endTime: string;
      subject: Subject;
      topic: string;
      studentComment: string;
      durationMinutes: number;
    }
  ): TimeSlot {
    const newBookedSlot: TimeSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      subject: booking.subject,
      topic: booking.topic,
      studentComment: booking.studentComment,
      durationMinutes: booking.durationMinutes,
      tutorId: 'tutor-roman',
      isBooked: true,
      studentId: student.id,
      studentName: student.name,
      status: 'booked',
      meetingLink: `https://telemost.yandex.ru/j/${Math.floor(10000000000000 + Math.random() * 90000000000000)}`,
    };

    const slots = this.getSlots();
    this.setItem(STORAGE_KEYS.SLOTS, [newBookedSlot, ...slots]);
    return newBookedSlot;
  }

  public updateSlot(slotId: string, updates: Partial<TimeSlot>): void {
    const slots = this.getSlots();
    const updated = slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s));
    this.setItem(STORAGE_KEYS.SLOTS, updated);
  }

  public cancelSlotBooking(slotId: string): boolean {
    const slots = this.getSlots();
    const updated = slots.map((s) => {
      if (s.id === slotId) {
        return {
          ...s,
          isBooked: false,
          studentId: undefined,
          studentName: undefined,
          studentComment: undefined,
          status: 'available' as const,
        };
      }
      return s;
    });
    this.setItem(STORAGE_KEYS.SLOTS, updated);
    return true;
  }

  public deleteSlot(slotId: string): void {
    const slots = this.getSlots().filter((s) => s.id !== slotId);
    this.setItem(STORAGE_KEYS.SLOTS, slots);
  }

  // Tasks Bank
  public getTasks(): Task[] {
    return this.getItem<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  }

  public getTaskById(taskId: string): Task | undefined {
    return this.getTasks().find((t) => t.id === taskId);
  }

  public addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...task,
      id: `task-${task.subject}-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.setItem(STORAGE_KEYS.TASKS, [newTask, ...tasks]);
    return newTask;
  }

  public batchAddTasks(newTasksList: Array<Omit<Task, 'id' | 'createdAt'> & { id?: string; createdAt?: string }>): Task[] {
    const existing = this.getTasks();
    const createdTasks: Task[] = newTasksList.map((t, idx) => ({
      ...t,
      id: t.id || `task-${t.subject}-${Date.now()}-${idx}`,
      createdAt: t.createdAt || new Date().toISOString().split('T')[0],
      difficulty: t.difficulty || 'medium',
      hints: Array.isArray(t.hints) ? t.hints : [],
      correctAnswer: String(t.correctAnswer ?? ''),
      fullSolution: t.fullSolution || '',
    }));
    this.setItem(STORAGE_KEYS.TASKS, [...createdTasks, ...existing]);
    return createdTasks;
  }

  public deleteTask(taskId: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
    this.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  // Homeworks
  public getHomeworks(): Homework[] {
    const list = this.getItem<Homework[]>(STORAGE_KEYS.HOMEWORKS, INITIAL_HOMEWORKS);
    if (!list || list.length === 0) {
      return INITIAL_HOMEWORKS;
    }
    return list;
  }

  public getHomeworksForStudent(studentId: string): Homework[] {
    return this.getHomeworks().filter((h) => h.studentId === studentId);
  }

  public updateHomework(updatedHw: Homework): void {
    const hws = this.getHomeworks();
    const updated = hws.map((h) => (h.id === updatedHw.id ? updatedHw : h));
    this.setItem(STORAGE_KEYS.HOMEWORKS, updated);
  }

  public createHomework(hw: Omit<Homework, 'id'>): Homework {
    const hws = this.getHomeworks();
    const newHw: Homework = {
      ...hw,
      id: `hw-${Date.now()}`,
    };
    this.setItem(STORAGE_KEYS.HOMEWORKS, [newHw, ...hws]);
    return newHw;
  }

  public addHomework(hw: Omit<Homework, 'id'>): Homework {
    return this.createHomework(hw);
  }

  public batchAddHomeworks(
    newHws: Array<Omit<Homework, 'id'> & { id?: string; studentEmail?: string; studentName?: string }>
  ): Homework[] {
    const existing = this.getHomeworks();
    const students = this.getStudents();
    const created: Homework[] = newHws.map((hw, idx) => {
      let targetStudentId = hw.studentId;
      if (!targetStudentId || !students.some((s) => s.id === targetStudentId)) {
        if (hw.studentEmail) {
          const matchedByEmail = students.find((s) => s.email.toLowerCase() === hw.studentEmail?.toLowerCase());
          if (matchedByEmail) targetStudentId = matchedByEmail.id;
        }
        if (!targetStudentId && hw.studentName) {
          const matchedByName = students.find((s) => s.name.toLowerCase().includes(hw.studentName!.toLowerCase()));
          if (matchedByName) targetStudentId = matchedByName.id;
        }
        if (!targetStudentId) {
          targetStudentId = students[0]?.id || 'student-1';
        }
      }

      return {
        id: hw.id || `hw-${Date.now()}-${idx}`,
        studentId: targetStudentId,
        subject: hw.subject || 'math',
        title: hw.title || `Домашнее задание #${idx + 1}`,
        assignedDate: hw.assignedDate || new Date().toISOString().split('T')[0],
        dueDate: hw.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: (hw.status as any) || 'assigned',
        tasks: Array.isArray(hw.tasks) ? hw.tasks : [],
        tutorFeedback: hw.tutorFeedback,
        grade: hw.grade,
        mark: hw.mark,
        earnedPoints: hw.earnedPoints,
        totalPoints: hw.totalPoints,
        studentComment: hw.studentComment,
        submittedAt: hw.submittedAt,
        photos: Array.isArray(hw.photos) ? hw.photos : [],
        attachments: Array.isArray(hw.attachments) ? hw.attachments : [],
      };
    });

    this.setItem(STORAGE_KEYS.HOMEWORKS, [...created, ...existing]);
    return created;
  }

  public submitHomework(hwId: string): void {
    const hws = this.getHomeworks();
    const updated = hws.map((h) => (h.id === hwId ? { ...h, status: 'submitted' as const } : h));
    this.setItem(STORAGE_KEYS.HOMEWORKS, updated);
  }

  public deleteHomework(hwId: string): void {
    const hws = this.getHomeworks();
    this.setItem(STORAGE_KEYS.HOMEWORKS, hws.filter((h) => h.id !== hwId));
  }

  // Informal Notes
  public getInformalNotes(): InformalNote[] {
    return this.getItem<InformalNote[]>(STORAGE_KEYS.INFORMAL_NOTES, INITIAL_INFORMAL_NOTES);
  }

  public addInformalNote(note: Omit<InformalNote, 'id'>): InformalNote {
    const notes = this.getInformalNotes();
    const newNote: InformalNote = {
      ...note,
      id: `note-${Date.now()}`,
    };
    this.setItem(STORAGE_KEYS.INFORMAL_NOTES, [newNote, ...notes]);
    return newNote;
  }

  public deleteInformalNote(id: string): void {
    const notes = this.getInformalNotes().filter((n) => n.id !== id);
    this.setItem(STORAGE_KEYS.INFORMAL_NOTES, notes);
  }

  // Study Materials
  public getStudyMaterials(): StudyMaterial[] {
    return this.getItem<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_STUDY_MATERIALS);
  }

  public addStudyMaterial(mat: Omit<StudyMaterial, 'id'>): StudyMaterial {
    const mats = this.getStudyMaterials();
    const newMat: StudyMaterial = {
      ...mat,
      id: `mat-${Date.now()}`,
    };
    this.setItem(STORAGE_KEYS.MATERIALS, [newMat, ...mats]);
    return newMat;
  }

  public batchAddStudyMaterials(newMats: Array<Omit<StudyMaterial, 'id'> & { id?: string }>): StudyMaterial[] {
    const existing = this.getStudyMaterials();
    const created: StudyMaterial[] = newMats.map((m, idx) => ({
      id: m.id || `mat-${Date.now()}-${idx}`,
      subject: m.subject || 'math',
      title: m.title || `Учебный материал #${idx + 1}`,
      topic: m.topic || 'Теория и формулы',
      type: m.type || 'lecture_notes',
      content: m.content || '',
      keyFormulas: Array.isArray(m.keyFormulas) ? m.keyFormulas : [],
      externalUrl: m.externalUrl || undefined,
      readTimeMinutes: typeof m.readTimeMinutes === 'number' ? m.readTimeMinutes : 10,
    }));
    this.setItem(STORAGE_KEYS.MATERIALS, [...created, ...existing]);
    return created;
  }

  public deleteStudyMaterial(id: string): void {
    const list = this.getStudyMaterials().filter((m) => m.id !== id);
    this.setItem(STORAGE_KEYS.MATERIALS, list);
  }

  public updateStudyMaterial(updated: StudyMaterial): void {
    const list = this.getStudyMaterials().map((m) => (m.id === updated.id ? updated : m));
    this.setItem(STORAGE_KEYS.MATERIALS, list);
  }

  // Full Database Backup & Restore (Vercel-ready data migration)
  public exportFullBackup(): string {
    const backup = {
      app: 'BookTutor Pro',
      version: '7.0',
      exportedAt: new Date().toISOString(),
      data: {
        users: this.getUsers(),
        slots: this.getItem(STORAGE_KEYS.SLOTS, []),
        tasks: this.getItem(STORAGE_KEYS.TASKS, []),
        homeworks: this.getHomeworks(),
        materials: this.getStudyMaterials(),
        variants: this.getItem(STORAGE_KEYS.VARIANTS, []),
        notes: this.getInformalNotes(),
        topicProgress: this.getItem(STORAGE_KEYS.TOPIC_PROGRESS, []),
        examNumbers: this.getItem(STORAGE_KEYS.EXAM_NUMBERS, []),
        chatMessages: this.getItem(STORAGE_KEYS.CHAT_MESSAGES, []),
        xpRewards: this.getItem(STORAGE_KEYS.XP_REWARDS, []),
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  public importFullBackup(jsonString: string): { success: boolean; error?: string; summary?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Неверный формат файла бэкапа' };
      }
      if (Array.isArray(data.users)) this.setItem(STORAGE_KEYS.USERS, data.users);
      if (Array.isArray(data.slots)) this.setItem(STORAGE_KEYS.SLOTS, data.slots);
      if (Array.isArray(data.tasks)) this.setItem(STORAGE_KEYS.TASKS, data.tasks);
      if (Array.isArray(data.homeworks)) this.setItem(STORAGE_KEYS.HOMEWORKS, data.homeworks);
      if (Array.isArray(data.materials)) this.setItem(STORAGE_KEYS.MATERIALS, data.materials);
      if (Array.isArray(data.variants)) this.setItem(STORAGE_KEYS.VARIANTS, data.variants);
      if (Array.isArray(data.notes)) this.setItem(STORAGE_KEYS.INFORMAL_NOTES, data.notes);
      if (Array.isArray(data.topicProgress)) this.setItem(STORAGE_KEYS.TOPIC_PROGRESS, data.topicProgress);
      if (Array.isArray(data.examNumbers)) this.setItem(STORAGE_KEYS.EXAM_NUMBERS, data.examNumbers);
      if (Array.isArray(data.chatMessages)) this.setItem(STORAGE_KEYS.CHAT_MESSAGES, data.chatMessages);
      if (Array.isArray(data.xpRewards)) this.setItem(STORAGE_KEYS.XP_REWARDS, data.xpRewards);

      return {
        success: true,
        summary: `Успешно восстановлено: ДЗ (${data.homeworks?.length || 0}), материалов (${data.materials?.length || 0}), задач (${data.tasks?.length || 0}), слотов (${data.slots?.length || 0}), учеников (${data.users?.length || 0})`,
      };
    } catch (e: any) {
      return { success: false, error: `Ошибка чтения JSON: ${e.message}` };
    }
  }

  // Topic Progress
  public getTopicProgress(): ExamTopicProgress[] {
    const list = this.getItem<ExamTopicProgress[]>(STORAGE_KEYS.TOPIC_PROGRESS, FULL_EXAM_TOPICS);
    if (!list || list.length < FULL_EXAM_TOPICS.length) {
      const merged = FULL_EXAM_TOPICS.map((full) => {
        const existing = list?.find(
          (item) => item.topicId === full.topicId || (item.subject === full.subject && item.topicName === full.topicName)
        );
        return existing
          ? { ...full, masteryPercentage: existing.masteryPercentage, tasksSolved: existing.tasksSolved }
          : full;
      });
      this.setItem(STORAGE_KEYS.TOPIC_PROGRESS, merged);
      return merged;
    }
    return list;
  }

  public updateTopicMastery(topicId: string, mastery: number) {
    const topics = this.getTopicProgress();
    const updated = topics.map((t) => (t.topicId === topicId ? { ...t, masteryPercentage: mastery } : t));
    this.setItem(STORAGE_KEYS.TOPIC_PROGRESS, updated);
  }

  // Exam Numbers Progress
  public getExamNumbers(): ExamNumberProgress[] {
    const list = this.getItem<ExamNumberProgress[]>(STORAGE_KEYS.EXAM_NUMBERS, FULL_EXAM_NUMBERS);
    if (!list || list.length < FULL_EXAM_NUMBERS.length) {
      const merged = FULL_EXAM_NUMBERS.map((full) => {
        const existing = list?.find(
          (item) => item.examNumber === full.examNumber && item.subject === full.subject
        );
        return existing ? { ...full, status: existing.status, accuracy: existing.accuracy } : full;
      });
      this.setItem(STORAGE_KEYS.EXAM_NUMBERS, merged);
      return merged;
    }
    return list;
  }

  public updateExamNumber(examNumber: string, updates: Partial<ExamNumberProgress>) {
    const list = this.getExamNumbers();
    const updated = list.map((item) => (item.examNumber === examNumber ? { ...item, ...updates } : item));
    this.setItem(STORAGE_KEYS.EXAM_NUMBERS, updated);
  }

  // Exam Variants
  public getExamVariants(): ExamVariant[] {
    return this.getItem<ExamVariant[]>(STORAGE_KEYS.VARIANTS, INITIAL_EXAM_VARIANTS);
  }

  public addExamVariant(variant: Omit<ExamVariant, 'id' | 'createdAt'>): ExamVariant {
    const variants = this.getExamVariants();
    const newVariant: ExamVariant = {
      ...variant,
      id: `variant-${variant.subject}-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.setItem(STORAGE_KEYS.VARIANTS, [newVariant, ...variants]);
    return newVariant;
  }

  public batchAddExamVariants(newVariantsList: Array<Omit<ExamVariant, 'id' | 'createdAt'> & { id?: string; createdAt?: string }>): ExamVariant[] {
    const existing = this.getExamVariants();
    const createdVariants: ExamVariant[] = newVariantsList.map((v, idx) => ({
      ...v,
      id: v.id || `variant-${v.subject}-${Date.now()}-${idx}`,
      createdAt: v.createdAt || new Date().toISOString().split('T')[0],
      tasks: Array.isArray(v.tasks) ? v.tasks : [],
      maxPrimaryScore: typeof v.maxPrimaryScore === 'number'
        ? v.maxPrimaryScore
        : (v.tasks || []).reduce((acc, t) => acc + (t.maxScore || 1), 0),
    }));
    this.setItem(STORAGE_KEYS.VARIANTS, [...createdVariants, ...existing]);
    return createdVariants;
  }

  public deleteExamVariant(variantId: string): void {
    const variants = this.getExamVariants().filter((v) => v.id !== variantId);
    this.setItem(STORAGE_KEYS.VARIANTS, variants);
  }

  // Variant Submissions
  public getVariantSubmissions(studentId?: string): VariantSubmission[] {
    const all = this.getItem<VariantSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    if (studentId) {
      return all.filter((s) => s.studentId === studentId);
    }
    return all;
  }

  public saveVariantSubmission(sub: Omit<VariantSubmission, 'id' | 'submittedAt'>): VariantSubmission {
    const all = this.getVariantSubmissions();
    const newSub: VariantSubmission = {
      ...sub,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    this.setItem(STORAGE_KEYS.SUBMISSIONS, [newSub, ...all]);
    return newSub;
  }

  public updateVariantSubmission(submission: VariantSubmission): void {
    const all = this.getVariantSubmissions();
    const updated = all.map((s) => (s.id === submission.id ? submission : s));
    this.setItem(STORAGE_KEYS.SUBMISSIONS, updated);
  }

  // XP Rewards Store
  public getXPRewards(): XPReward[] {
    return this.getItem<XPReward[]>(STORAGE_KEYS.XP_REWARDS, INITIAL_XP_REWARDS);
  }

  public claimXPReward(rewardId: string, studentId: string): boolean {
    const users = this.getUsers();
    const student = users.find((u) => u.id === studentId);
    if (!student) return false;

    const claimed = student.claimedRewards || [];
    if (claimed.includes(rewardId)) return true; // already claimed

    const updatedUsers = users.map((u) =>
      u.id === studentId ? { ...u, claimedRewards: [...claimed, rewardId] } : u
    );
    this.setItem(STORAGE_KEYS.USERS, updatedUsers);
    return true;
  }

  // Reset all data to clean defaults
  public resetAllData(): void {
    localStorage.clear();
    this.initDefaults(true);
    this.notify();
  }
}

export const storage = new StorageService();
