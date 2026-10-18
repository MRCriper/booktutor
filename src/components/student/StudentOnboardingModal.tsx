import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Target,
  Calculator,
  Compass,
  Laptop,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, Subject, ExamKind, SubjectGoal } from '../../types';
import { storage } from '../../services/storage';

interface StudentOnboardingModalProps {
  student: User;
  onComplete: (updatedStudent: User) => void;
}

const AVAILABLE_SUBJECTS: { id: Subject; name: string; icon: string; defaultTarget: number }[] = [
  { id: 'math', name: 'Математика (Профиль)', icon: '📐', defaultTarget: 80 },
  { id: 'physics', name: 'Физика', icon: '⚡', defaultTarget: 75 },
  { id: 'cs', name: 'Информатика (КЕГЭ)', icon: '💻', defaultTarget: 85 },
  { id: 'russian', name: 'Русский язык', icon: '📖', defaultTarget: 88 },
];

export const StudentOnboardingModal: React.FC<StudentOnboardingModalProps> = ({
  student,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [examKind, setExamKind] = useState<ExamKind>(student.examKind || 'ege');
  const [grade, setGrade] = useState<string>(student.grade || '11 класс');
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>(
    student.subjects && student.subjects.length > 0 ? student.subjects : ['math']
  );
  const [goals, setGoals] = useState<Record<Subject, SubjectGoal>>(() => {
    const initial: Record<Subject, SubjectGoal> = {} as any;
    AVAILABLE_SUBJECTS.forEach((s) => {
      initial[s.id] = {
        targetScore: s.defaultTarget,
        currentScore: 0,
        gradeGoal: 5,
      };
    });
    return initial;
  });

  const toggleSubject = (s: Subject) => {
    if (selectedSubjects.includes(s)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((x) => x !== s));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, s]);
    }
  };

  const handleFinish = () => {
    const targetExamLabel =
      examKind === 'ege'
        ? grade === '10 класс'
          ? 'ЕГЭ (10 класс, предварительный)'
          : 'ЕГЭ (11 класс)'
        : 'ОГЭ (9 класс)';

    const primaryTargetScore = goals[selectedSubjects[0]]?.targetScore || 80;
    const primaryCurrentScore = goals[selectedSubjects[0]]?.currentScore || 0;

    const filteredGoals: Record<Subject, SubjectGoal> = {} as any;
    selectedSubjects.forEach((s) => {
      filteredGoals[s] = goals[s] || { targetScore: 80, currentScore: 0, gradeGoal: 5 };
    });

    const updates: Partial<User> = {
      examKind,
      targetExam: targetExamLabel,
      grade,
      subjects: selectedSubjects,
      subjectGoals: filteredGoals,
      targetScore: primaryTargetScore,
      currentScore: primaryCurrentScore,
      onboardingCompleted: true,
    };

    storage.updateStudentProfile(student.id, updates);
    const updated = { ...student, ...updates };

    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
    });

    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white dark:bg-[#16181F] border-2 border-[#1B1B19] dark:border-[#E5C048] shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#F8F7F4] dark:bg-[#1A1C24] border-b border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-[#D4AF37]" />
              <span className="label-academic text-[#D4AF37]">Вводная анкета ученика</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
              Добро пожаловать, {student.name.split(' ')[0]}!
            </h2>
            <p className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">
              Настройте цели обучения, чтобы репетитор Мальцев Р.М. видел ваши ориентиры
            </p>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                step === 1
                  ? 'bg-[#1B1B19] text-white dark:bg-[#E5C048] dark:text-[#121316]'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              1
            </span>
            <span className="text-gray-400">→</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                step === 2
                  ? 'bg-[#1B1B19] text-white dark:bg-[#E5C048] dark:text-[#121316]'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              2
            </span>
            <span className="text-gray-400">→</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                step === 3
                  ? 'bg-[#1B1B19] text-white dark:bg-[#E5C048] dark:text-[#121316]'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              3
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: EXAM TYPE & GRADE */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <span className="text-xs uppercase font-bold text-[#1B1B19] dark:text-[#F3F3EE] block mb-1">
                  1. К какому экзамену вы готовитесь?
                </span>
                <p className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                  Выберите форму государственной итоговой аттестации
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setExamKind('ege');
                    setGrade('11 класс');
                  }}
                  className={`p-4 text-left border-2 transition flex flex-col justify-between space-y-2 cursor-pointer ${
                    examKind === 'ege'
                      ? 'border-[#1B1B19] dark:border-[#E5C048] bg-[#F8F7F4] dark:bg-[#1A1C24] shadow-xs'
                      : 'border-[#1B1B19]/20 dark:border-[#323642] hover:border-[#1B1B19] dark:hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                      ЕГЭ (11 класс)
                    </span>
                    <span className="text-xs">🎓</span>
                  </div>
                  <p className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                    Единый государственный экзамен для 10–11 классов (100-балльная шкала оценивания).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExamKind('oge');
                    setGrade('9 класс');
                  }}
                  className={`p-4 text-left border-2 transition flex flex-col justify-between space-y-2 cursor-pointer ${
                    examKind === 'oge'
                      ? 'border-[#1B1B19] dark:border-[#E5C048] bg-[#F8F7F4] dark:bg-[#1A1C24] shadow-xs'
                      : 'border-[#1B1B19]/20 dark:border-[#323642] hover:border-[#1B1B19] dark:hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                      ОГЭ (9 класс)
                    </span>
                    <span className="text-xs">📚</span>
                  </div>
                  <p className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                    Основной государственный экзамен. Переход в 10 класс профильной школы или колледж (оценки 2–5).
                  </p>
                </button>
              </div>

              {examKind === 'ege' && (
                <div className="pt-2">
                  <label className="block text-[11px] uppercase font-bold text-[#1B1B19] dark:text-[#F3F3EE] mb-1">
                    Ваш класс:
                  </label>
                  <div className="flex gap-2">
                    {['11 класс', '10 класс', 'Выпускник прошлых лет'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`px-3 py-1.5 border text-xs cursor-pointer transition ${
                          grade === g
                            ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold border-[#1B1B19] dark:border-[#E5C048]'
                            : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 dark:border-[#323642]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SUBJECTS SELECTION */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <span className="text-xs uppercase font-bold text-[#1B1B19] dark:text-[#F3F3EE] block mb-1">
                  2. Какие предметы вы сдаёте?
                </span>
                <p className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                  Выберите все дисциплины, по которым занимаетесь с Романом Михайловичем
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {AVAILABLE_SUBJECTS.map((sub) => {
                  const isSelected = selectedSubjects.includes(sub.id);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => toggleSubject(sub.id)}
                      className={`p-3.5 border-2 transition flex items-center justify-between cursor-pointer select-none ${
                        isSelected
                          ? 'border-[#1B1B19] dark:border-[#E5C048] bg-[#F8F7F4] dark:bg-[#1A1C24]'
                          : 'border-[#1B1B19]/20 dark:border-[#323642] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{sub.icon}</span>
                        <div>
                          <div className="font-bold text-xs text-[#1B1B19] dark:text-[#F3F3EE]">
                            {sub.name}
                          </div>
                          <div className="text-[10px] text-[#1B1B19]/50 dark:text-gray-400">
                            {examKind === 'ege' ? 'ЕГЭ 2027' : 'ОГЭ 2027'}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 border flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#1B1B19] text-white dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19] dark:border-[#E5C048]'
                            : 'border-[#1B1B19]/40 dark:border-[#323642]'
                        }`}
                      >
                        {isSelected && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-gray-500 italic">
                * Можно выбрать несколько предметов. Позже репетитор сможет скорректировать список.
              </p>
            </div>
          )}

          {/* STEP 3: SCORE TARGETS PER SUBJECT */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <span className="text-xs uppercase font-bold text-[#1B1B19] dark:text-[#F3F3EE] block mb-1">
                  3. Укажите целевые и текущие баллы
                </span>
                <p className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                  {examKind === 'ege'
                    ? 'Целевой результат на 100-балльной шкале ЕГЭ'
                    : 'Желаемая итоговая оценка на ОГЭ (от 3 до 5)'}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {selectedSubjects.map((subId) => {
                  const subInfo = AVAILABLE_SUBJECTS.find((s) => s.id === subId)!;
                  const g = goals[subId] || { targetScore: 80, currentScore: 0, gradeGoal: 5 };

                  return (
                    <div
                      key={subId}
                      className="p-4 bg-[#F8F7F4] dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#1B1B19]/10 dark:border-[#323642] pb-2">
                        <span className="font-serif font-bold text-sm text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1.5">
                          <span>{subInfo.icon}</span>
                          <span>{subInfo.name}</span>
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[#D4AF37]">
                          {examKind === 'ege' ? 'Цель: 100 баллов' : 'Цель: Оценка'}
                        </span>
                      </div>

                      {examKind === 'ege' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-[#1B1B19]/70 dark:text-gray-400 mb-1">
                              Нужный балл (Цель):
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={30}
                                max={100}
                                value={g.targetScore}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setGoals({
                                    ...goals,
                                    [subId]: { ...g, targetScore: Math.min(100, Math.max(0, val)) },
                                  });
                                }}
                                className="w-24 px-3 py-1.5 bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/40 dark:border-[#323642] font-mono text-sm font-bold text-center"
                              />
                              <span className="text-xs text-gray-500 font-bold">/ 100 б.</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-[#1B1B19]/70 dark:text-gray-400 mb-1">
                              Текущий уровень:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={g.currentScore || 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setGoals({
                                    ...goals,
                                    [subId]: { ...g, currentScore: Math.min(100, Math.max(0, val)) },
                                  });
                                }}
                                className="w-24 px-3 py-1.5 bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/40 dark:border-[#323642] font-mono text-sm text-center"
                              />
                              <span className="text-xs text-gray-500">пробник</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-[#1B1B19]/70 dark:text-gray-400 mb-1">
                              Желаемая оценка:
                            </label>
                            <div className="flex gap-2">
                              {[5, 4, 3].map((mark) => (
                                <button
                                  key={mark}
                                  type="button"
                                  onClick={() =>
                                    setGoals({
                                      ...goals,
                                      [subId]: { ...g, gradeGoal: mark, targetScore: mark === 5 ? 31 : 22 },
                                    })
                                  }
                                  className={`w-10 h-9 font-bold text-sm border flex items-center justify-center cursor-pointer transition ${
                                    (g.gradeGoal || 5) === mark
                                      ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] border-[#1B1B19] dark:border-[#E5C048]'
                                      : 'bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border-gray-300 dark:border-[#323642]'
                                  }`}
                                >
                                  {mark}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block">Ориентир первичных баллов:</span>
                            <span className="font-bold text-xs text-[#1B1B19] dark:text-[#F3F3EE]">
                              {(g.gradeGoal || 5) === 5 ? 'Отличный уровень' : 'Хороший уровень'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 sm:p-5 bg-[#F8F7F4] dark:bg-[#1A1C24] border-t border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 border border-[#1B1B19]/30 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 dark:hover:bg-white/5 uppercase tracking-wider font-bold transition"
            >
              ← Назад
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2.5 bg-[#1B1B19] text-[#F8F7F4] hover:bg-black dark:bg-[#E5C048] dark:text-[#121316] font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Далее</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 bg-[#1B1B19] text-[#F8F7F4] hover:bg-black dark:bg-[#E5C048] dark:text-[#121316] font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] dark:text-[#121316]" />
              <span>Сохранить цели и войти</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
