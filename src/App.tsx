import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { User, ExamVariant, AttachedFile } from './types';
import { Navbar } from './components/common/Navbar';
import { LoginView } from './components/auth/LoginView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TutorDashboard } from './components/tutor/TutorDashboard';
import { ProgressDashboard } from './components/analytics/ProgressDashboard';
import { CodeSandboxModal } from './components/sandbox/CodeSandboxModal';
import { ParentReportModal } from './components/reports/ParentReportModal';
import { ChatDrawer } from './components/chat/ChatDrawer';
import { AiTutorModal } from './components/ai/AiTutorModal';
import { GamificationBar } from './components/student/GamificationBar';
import { calculateStudentGamification } from './utils/gamification';
import { ExamVariantsView } from './components/exam/ExamVariantsView';
import { ExamSolvingSession } from './components/exam/ExamSolvingSession';
import { ExamSpecsAndReferenceView } from './components/exam/ExamSpecsAndReferenceView';
import { XPRewardsStore } from './components/student/XPRewardsStore';
import { ScientificCalculator } from './components/common/ScientificCalculator';
import { StudentOnboardingModal } from './components/student/StudentOnboardingModal';
import { DatabaseSyncModal } from './components/common/DatabaseSyncModal';
import { cloudSync } from './services/cloudSync';

export default function App() {
  const [, setTick] = useState(0);

  // Authentication session
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getAuthSession());

  // Dark / Light Theme (default to light)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('booktutor_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('booktutor_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  // Views & modals
  const [activeTab, setActiveTab] = useState<string>('schedule');
  const [activeExamSession, setActiveExamSession] = useState<ExamVariant | null>(null);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxTaskTitle, setSandboxTaskTitle] = useState<string | undefined>();
  const [sandboxInitialCode, setSandboxInitialCode] = useState<string | undefined>();
  const [sandboxInitialFiles, setSandboxInitialFiles] = useState<AttachedFile[] | undefined>();
  const [isParentReportOpen, setIsParentReportOpen] = useState(false);
  const [reportTargetStudent, setReportTargetStudent] = useState<User | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  // Subscribe to storage changes & start cloud auto-sync
  useEffect(() => {
    cloudSync.init();
    const unsubscribe = storage.subscribe(() => {
      setCurrentUser(storage.getAuthSession());
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('schedule');
  };

  const handleLogout = () => {
    storage.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  // Fetch current data
  const allUsers = storage.getUsers();
  const students = storage.getStudents();
  const tutor = storage.getTutor();
  const slots = storage.getSlots();
  const tasks = storage.getTasks();
  const homeworks = storage.getHomeworks();
  const materials = storage.getStudyMaterials();
  const topicProgress = storage.getTopicProgress();
  const examNumbers = storage.getExamNumbers();
  const informalNotes = storage.getInformalNotes();

  const isTutor = currentUser.role === 'tutor';

  // If currently taking a full exam variant session
  if (activeExamSession) {
    return (
      <ExamSolvingSession
        variant={activeExamSession}
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onFinish={() => {
          setActiveExamSession(null);
          setActiveTab('variants');
        }}
        onCancel={() => setActiveExamSession(null)}
      />
    );
  }

  const handleOpenSandbox = (title?: string, code?: string, files?: AttachedFile[]) => {
    setSandboxTaskTitle(title);
    setSandboxInitialCode(code);
    setSandboxInitialFiles(files);
    setIsSandboxOpen(true);
  };

  const handleOpenReportForStudent = (student: User) => {
    setReportTargetStudent(student);
    setIsParentReportOpen(true);
  };

  const activeStudentForReport =
    reportTargetStudent || (currentUser.role === 'student' ? currentUser : students[0]);

  // For AI context
  const activeStudentForAi = isTutor ? students[0] : currentUser;

  // Calculate gamification stats for student
  const studentGamification = !isTutor
    ? calculateStudentGamification(currentUser, homeworks, topicProgress, examNumbers)
    : undefined;

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#0F1117] text-[#1B1B19] dark:text-[#F3F3EE] flex flex-col font-sans transition-colors selection:bg-[#1B1B19] selection:text-[#F8F7F4] dark:selection:bg-[#E5C048] dark:selection:text-[#121316]">
      {/* First-time Student Onboarding Survey (EGE/OGE, subjects & target points) */}
      {!isTutor && currentUser && !currentUser.onboardingCompleted && (
        <StudentOnboardingModal
          student={currentUser}
          onComplete={(updated) => {
            setCurrentUser(updated);
            setTick((t) => t + 1);
          }}
        />
      )}

      {/* Clean Top Navbar (With integrated calculator, chat, AI, and theme toggle) */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        activeView={activeTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={setActiveTab}
        onOpenSandbox={() => handleOpenSandbox()}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        onOpenCalculator={() => setIsCalcOpen(true)}
        onOpenDatabase={() => setIsDatabaseModalOpen(true)}
        onLogout={handleLogout}
        gamificationStats={studentGamification}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'specs' ? (
          <ExamSpecsAndReferenceView />
        ) : activeTab === 'variants' ? (
          <div className="space-y-6">
            <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-4">
              <div className="label-academic text-[#D4AF37] mb-0.5">Экзаменационные варианты</div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                Симулятор полного варианта ЕГЭ / ОГЭ
              </h1>
              <p className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">
                Решение КИМ с таймером, встроенной Python IDE, калькулятором с дробями и автоматическим подсчётом баллов.
              </p>
            </div>
            <ExamVariantsView
              currentUser={currentUser}
              students={students}
              onStartExam={(v) => setActiveExamSession(v)}
            />
          </div>
        ) : activeTab === 'rewards' && !isTutor ? (
          <XPRewardsStore
            currentUser={currentUser}
            currentXP={studentGamification?.totalXp || 0}
            currentLevel={studentGamification?.currentLevel || 1}
          />
        ) : activeTab === 'progress' ? (
          <div className="space-y-6">
            <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="label-academic text-[#D4AF37] mb-0.5">Аналитический модуль</div>
                <h1 className="font-serif text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                  Двухуровневый трекер подготовки к экзаменам
                </h1>
                <p className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400">
                  {isTutor ? 'Аналитика по темам и номерам КИМ ФИПИ' : `Личный прогресс: ${currentUser.name}`}
                </p>
              </div>

              {isTutor && students.length > 0 && (
                <button
                  onClick={() => {
                    setReportTargetStudent(students[0]);
                    setIsParentReportOpen(true);
                  }}
                  className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] transition shadow-2xs border border-[#1B1B19] dark:border-[#E5C048]"
                >
                  Сформировать отчет родителям
                </button>
              )}
            </div>

            {!isTutor && studentGamification && (
              <GamificationBar stats={studentGamification} />
            )}

            <ProgressDashboard
              topics={topicProgress}
              examNumbers={examNumbers}
              currentRole={currentUser.role}
              studentName={isTutor ? students[0]?.name : currentUser.name}
              targetScore={isTutor ? (students[0]?.targetScore || 80) : (currentUser.targetScore || 80)}
              currentScore={isTutor ? (students[0]?.currentScore || 0) : (currentUser.currentScore || 0)}
              initialExamKind={isTutor ? students[0]?.examKind : currentUser.examKind}
            />
          </div>
        ) : isTutor ? (
          <TutorDashboard
            tutor={currentUser}
            students={students}
            slots={slots}
            tasks={tasks}
            homeworks={homeworks}
            notes={informalNotes}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onOpenReportForStudent={handleOpenReportForStudent}
            onOpenSandbox={handleOpenSandbox}
            onStartExam={(v) => setActiveExamSession(v)}
          />
        ) : (
          <StudentDashboard
            student={currentUser}
            tutor={tutor}
            slots={slots}
            homeworks={storage.getHomeworksForStudent(currentUser.id)}
            materials={materials}
            tasks={tasks}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onStartExam={(v) => setActiveExamSession(v)}
            onOpenSandbox={handleOpenSandbox}
          />
        )}
      </main>

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
        students={students}
        tutor={tutor}
      />

      {/* AI Contextual Tutor Modal */}
      {activeStudentForAi && (
        <AiTutorModal
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          student={activeStudentForAi}
          materials={materials}
          homeworks={homeworks}
          notes={informalNotes}
          topics={topicProgress}
        />
      )}

      {/* Code Sandbox Modal */}
      <CodeSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        defaultTaskTitle={sandboxTaskTitle}
        initialCode={sandboxInitialCode}
        initialFiles={sandboxInitialFiles}
      />

      {/* Upgraded Scientific & Physics Calculator with Fractions */}
      <ScientificCalculator
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
      />

      {/* Database & Vercel Storage Hub Modal */}
      <DatabaseSyncModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        onDataRestored={() => setTick((t) => t + 1)}
      />

      {/* Parent Report Modal */}
      {activeStudentForReport && (
        <ParentReportModal
          isOpen={isParentReportOpen}
          onClose={() => setIsParentReportOpen(false)}
          student={activeStudentForReport}
          tutor={tutor}
          topics={topicProgress}
          homeworks={homeworks}
          notes={informalNotes}
        />
      )}

      {/* Academic Editorial Footer */}
      <footer className="mt-auto border-t border-[#1B1B19]/15 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316] py-6 px-4 sm:px-6 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#1B1B19] dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block" />
            <span className="font-semibold tracking-wider text-[#1B1B19] dark:text-[#F3F3EE]">
              © BOOKTUTOR 2026 ACADEMIC EDITION • ПРЕПОДАВАТЕЛЬ МАЛЬЦЕВ Р. М.
            </span>
          </div>
          <div className="text-[#1B1B19]/50 dark:text-gray-500 tracking-widest text-[11px]">
            {currentUser.name} ({currentUser.role === 'tutor' ? 'РЕПЕТИТОР' : 'УЧЕНИК'})
          </div>
        </div>
      </footer>
    </div>
  );
}
