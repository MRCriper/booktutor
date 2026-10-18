import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { User, ExamTopicProgress, Homework, InformalNote } from '../../types';

interface ParentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User;
  tutor: User;
  topics: ExamTopicProgress[];
  homeworks: Homework[];
  notes: InformalNote[];
}

export const ParentReportModal: React.FC<ParentReportModalProps> = ({
  isOpen,
  onClose,
  student,
  tutor,
  topics,
  homeworks,
  notes,
}) => {
  const [period, setPeriod] = useState('Сентябрь – Октябрь 2026');
  const [customComment, setCustomComment] = useState(
    `${student.name} демонстрирует уверенную динамику и высокую работоспособность. Основной упор на предстоящий период: закрепление сложной части экзамена и доведение расчетных навыков до автоматизма.`
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const studentHws = homeworks.filter((h) => h.studentId === student.id);
  const gradedHws = studentHws.filter((h) => h.status === 'graded');
  const hwCompletionRate = studentHws.length > 0 ? Math.round((gradedHws.length / studentHws.length) * 100) : 90;
  const normalizedGrades = gradedHws.map((h) => {
    if (h.mark && [5, 4, 3, 2].includes(h.mark)) return h.mark;
    if (h.grade && h.grade <= 5 && h.grade >= 2) return h.grade;
    if (h.grade && h.grade >= 85) return 5;
    if (h.grade && h.grade >= 70) return 4;
    if (h.grade && h.grade >= 50) return 3;
    return 4.8;
  });
  const avgGrade =
    normalizedGrades.length > 0
      ? Number((normalizedGrades.reduce((acc, g) => acc + g, 0) / normalizedGrades.length).toFixed(1))
      : 4.8;

  const masteredTopics = topics.filter((t) => t.masteryPercentage >= 80);
  const inProgressTopics = topics.filter((t) => t.masteryPercentage < 80);

  const handleCopyText = () => {
    const textReport = `ОТЧЕТ ОБ УСПЕВАЕМОСТИ
Период: ${period}
Ученик: ${student.name} (${student.grade || '11 класс'})
Преподаватель: ${tutor.name}
Экзамен: ${student.targetExam || 'ЕГЭ Профиль'} (Цель: ${student.targetScore || 90} б.)
Текущий срез: ${student.currentScore || 78} / 100

ПОКАЗАТЕЛИ:
• Посещаемость: 100%
• Выполнение домашних заданий: ${hwCompletionRate}% (средняя оценка: «${avgGrade}» из 5)
• Освоено тем: ${masteredTopics.length} из ${topics.length}

ОСВОЕННЫЕ ТЕМЫ:
${masteredTopics.map((t) => `  ✓ ${t.topicName} — ${t.masteryPercentage}%`).join('\n')}

В ПРОРАБОТКЕ:
${inProgressTopics.slice(0, 4).map((t) => `  • ${t.topicName} — ${t.masteryPercentage}%`).join('\n')}

КОММЕНТАРИЙ ПРЕПОДАВАТЕЛЯ:
${customComment}

Контакты: ${tutor.email}`;

    navigator.clipboard.writeText(textReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-white dark:bg-[#1A1C24] border-b border-[#1B1B19]/15 dark:border-[#323642] gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] dark:bg-[#E5C048] inline-block" />
            <span className="font-serif text-base font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
              Отчет для родителей: {student.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-white dark:bg-[#121316] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            <button
              onClick={handlePrint}
              className="font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-[#1B1B19] hover:bg-black dark:bg-[#E5C048] dark:text-[#121316] text-[#F8F7F4] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#121316]" />
              Печать / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-[#F8F7F4] dark:bg-[#13151C] text-[#1B1B19] dark:text-slate-100 print:bg-white print:text-black print:p-0 text-xs font-mono">
          <div className="border-b-2 border-[#1B1B19] dark:border-[#3A4050] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-[#B89628] dark:text-[#E5C048] block">
                Академический отчет 2026
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#1B1B19] dark:text-white print:text-black mt-1">
                {student.name}
              </h2>
              <p className="text-xs text-slate-700 dark:text-slate-300 print:text-slate-600 mt-0.5">
                {student.grade || '11 класс'} • Экзамен: <span className="font-semibold text-slate-900 dark:text-slate-100">{student.targetExam || 'ЕГЭ'}</span> • Цель: <span className="font-semibold text-slate-900 dark:text-slate-100">{student.targetScore} б.</span>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-700 dark:text-slate-300 print:text-slate-600 space-y-0.5">
              <div>Преподаватель: <span className="font-bold text-[#1B1B19] dark:text-white">{tutor.name}</span></div>
              <div>Родитель: <span className="text-slate-900 dark:text-slate-200">{student.parentName || 'Законный представитель'}</span></div>
              <div>Период: <span className="text-slate-900 dark:text-slate-200">{period}</span></div>
            </div>
          </div>

          {/* KPI metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white dark:bg-[#1C202C] border border-[#1B1B19]/15 dark:border-[#363C4E] shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Посещаемость</span>
              <div className="font-mono text-2xl font-bold text-[#1B1B19] dark:text-white mt-1">100%</div>
            </div>

            <div className="p-4 bg-white dark:bg-[#1C202C] border border-[#1B1B19]/15 dark:border-[#363C4E] shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Выполнение ДЗ</span>
              <div className="font-mono text-2xl font-bold text-[#1B1B19] dark:text-white mt-1">{hwCompletionRate}%</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">Ср. оценка: «{avgGrade}» из 5</div>
            </div>

            <div className="p-4 bg-white dark:bg-[#1C202C] border border-[#1B1B19]/15 dark:border-[#363C4E] shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Текущий срез</span>
              <div className="font-mono text-2xl font-bold text-[#1B1B19] dark:text-white mt-1">
                {student.currentScore} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ 100</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-[#1C202C] border border-[#1B1B19]/15 dark:border-[#363C4E] shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Освоено тем</span>
              <div className="font-mono text-2xl font-bold text-[#1B1B19] dark:text-white mt-1">
                {masteredTopics.length} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ {topics.length}</span>
              </div>
            </div>
          </div>

          {/* Topics breakdown (CSS Selector 1 & 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CSS Selector 1: Освоенные темы */}
            <div className="p-4 bg-white dark:bg-[#1C202C] border border-[#1B1B19]/20 dark:border-[#363C4E] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1B1B19]/10 dark:border-[#2E3545]">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Освоенные темы (&gt; 80%)
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                  {masteredTopics.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {masteredTopics.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#171A24] border border-dashed border-slate-200 dark:border-slate-700 italic">
                    Начальный этап подготовки: темы сейчас прорабатываются на занятиях.
                  </div>
                ) : (
                  masteredTopics.map((top) => (
                    <div
                      key={top.topicId}
                      className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-[#232838] transition text-slate-900 dark:text-slate-100"
                    >
                      <span className="truncate pr-2 font-serif text-sm font-medium text-slate-800 dark:text-slate-100">
                        ✓ {top.topicName}
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                        {top.masteryPercentage}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CSS Selector 2: Темы в работе */}
            <div className="p-4 bg-white dark:bg-[#1C202C] border border-[#1B1B19]/20 dark:border-[#363C4E] space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1B1B19]/10 dark:border-[#2E3545]">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-[#E5C048] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-[#E5C048] shrink-0" />
                  Темы в работе
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-[#E5C048] border border-amber-300 dark:border-amber-700/60">
                  {inProgressTopics.length}
                </span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {inProgressTopics.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#171A24] border border-dashed border-slate-200 dark:border-slate-700 italic">
                    Все темы из текущего плана успешно освоены!
                  </div>
                ) : (
                  inProgressTopics.slice(0, 6).map((top) => (
                    <div
                      key={top.topicId}
                      className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-[#232838] transition text-slate-800 dark:text-slate-200"
                    >
                      <span className="truncate pr-2 font-serif text-sm font-medium text-slate-800 dark:text-slate-200">
                        • {top.topicName}
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-700 dark:text-[#E5C048] shrink-0">
                        {top.masteryPercentage}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tutor commentary */}
          <div className="p-4 bg-white dark:bg-[#1C202C] border border-[#1B1B19]/20 dark:border-[#363C4E] space-y-2 shadow-2xs">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
              Педагогический комментарий
            </span>
            <textarea
              value={customComment}
              onChange={(e) => setCustomComment(e.target.value)}
              rows={3}
              className="w-full bg-[#F8F7F4] dark:bg-[#151722] text-slate-900 dark:text-slate-100 text-xs resize-none focus:outline-none leading-relaxed border border-[#1B1B19]/20 dark:border-[#363C4E] focus:border-[#1B1B19] dark:focus:border-[#E5C048] p-3 font-sans"
            />
          </div>

          <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#363C4E] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <span>Платформа «BookTutor» • Академический сезон 2026</span>
            <span>Преподаватель: <span className="text-slate-800 dark:text-slate-200 font-medium">{tutor.name}</span> ({tutor.email})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
