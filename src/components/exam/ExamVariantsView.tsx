import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  Trash2,
  Users,
  Search,
  Award,
  Sparkles,
  ArrowRight,
  FileCheck2,
  Code2,
  Calculator,
  History,
  Upload,
} from 'lucide-react';
import { ExamVariant, Subject, User, VariantSubmission } from '../../types';
import { storage } from '../../services/storage';
import { VariantBuilderModal } from './VariantBuilderModal';
import { BatchImportModal } from './BatchImportModal';

interface ExamVariantsViewProps {
  currentUser: User;
  students: User[];
  onStartExam: (variant: ExamVariant) => void;
}

export const ExamVariantsView: React.FC<ExamVariantsViewProps> = ({
  currentUser,
  students,
  onStartExam,
}) => {
  const isTutor = currentUser.role === 'tutor';
  const [variants, setVariants] = useState<ExamVariant[]>(storage.getExamVariants());
  const [submissions, setSubmissions] = useState<VariantSubmission[]>(
    isTutor ? storage.getVariantSubmissions() : storage.getVariantSubmissions(currentUser.id)
  );

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setVariants(storage.getExamVariants());
      setSubmissions(
        isTutor ? storage.getVariantSubmissions() : storage.getVariantSubmissions(currentUser.id)
      );
    });
    return unsub;
  }, [currentUser.id, isTutor]);

  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<VariantSubmission | null>(null);

  const filteredVariants = variants.filter((v) => {
    if (selectedSubject !== 'all' && v.subject !== selectedSubject) return false;
    if (searchQuery.trim() && !v.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDeleteVariant = (id: string) => {
    if (confirm('Удалить этот экзаменационный вариант?')) {
      storage.deleteExamVariant(id);
      setVariants(storage.getExamVariants());
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] shadow-2xs">
        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`font-mono text-xs px-3 py-1.5 border transition whitespace-nowrap ${
              selectedSubject === 'all'
                ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] font-bold'
                : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
            }`}
          >
            Все предметы
          </button>
          <button
            onClick={() => setSelectedSubject('math')}
            className={`font-mono text-xs px-3 py-1.5 border transition whitespace-nowrap ${
              selectedSubject === 'math'
                ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] font-bold'
                : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
            }`}
          >
            Математика
          </button>
          <button
            onClick={() => setSelectedSubject('physics')}
            className={`font-mono text-xs px-3 py-1.5 border transition whitespace-nowrap ${
              selectedSubject === 'physics'
                ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] font-bold'
                : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
            }`}
          >
            Физика
          </button>
          <button
            onClick={() => setSelectedSubject('cs')}
            className={`font-mono text-xs px-3 py-1.5 border transition whitespace-nowrap ${
              selectedSubject === 'cs'
                ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] font-bold'
                : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
            }`}
          >
            Информатика (КЕГЭ)
          </button>
          <button
            onClick={() => setSelectedSubject('russian')}
            className={`font-mono text-xs px-3 py-1.5 border transition whitespace-nowrap ${
              selectedSubject === 'russian'
                ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] font-bold'
                : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
            }`}
          >
            Русский язык
          </button>
        </div>

        {/* Actions: Tutor Create & Batch Import Buttons */}
        <div className="flex items-center gap-2">
          {isTutor && (
            <>
              <button
                onClick={() => setShowBatchImport(true)}
                className="font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-[#E5C048] border border-amber-600/30 transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                title="Импортировать варианты и задания из JSON-файла"
              >
                <Upload className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#E5C048]" />
                Импорт JSON
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#121316]" />
                Собрать вариант
              </button>
            </>
          )}
        </div>
      </div>

      {/* Variants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVariants.map((v) => {
          const studentSubmission = submissions.find(
            (s) => s.variantId === v.id && s.studentId === currentUser.id
          );

          return (
            <div
              key={v.id}
              className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#D4AF37] transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block" />
                    <span className="label-academic">
                      {v.subject === 'math'
                        ? 'Математика'
                        : v.subject === 'physics'
                        ? 'Физика'
                        : v.subject === 'cs'
                        ? 'Информатика'
                        : 'Русский язык'}{' '}
                      • {v.examType}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-[#1B1B19]/60 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {v.timeLimitMinutes} мин.
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] group-hover:text-[#D4AF37] transition">
                  {v.title}
                </h3>

                <p className="text-xs text-[#1B1B19]/70 dark:text-gray-300 line-clamp-2 leading-relaxed">
                  {v.description || 'Тренировочный вариант экзамена по структуре ФИПИ.'}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642]">
                    {v.tasks.length} заданий
                  </span>
                  {v.subject === 'cs' && (
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-600 flex items-center gap-1 font-bold">
                      <Code2 className="w-3 h-3" /> Встроена IDE Python
                    </span>
                  )}
                  {v.subject === 'physics' && (
                    <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 border border-sky-600 flex items-center gap-1 font-bold">
                      <Calculator className="w-3 h-3" /> Wolfram калькулятор
                    </span>
                  )}
                </div>
              </div>

              {/* Status and Action button */}
              <div className="pt-4 border-t border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between">
                <div>
                  {studentSubmission ? (
                    <div className="font-mono text-xs">
                      <span className="text-[#1B1B19]/60 dark:text-gray-400 block text-[10px]">
                        Решено: {studentSubmission.submittedAt}
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {studentSubmission.secondaryScore} / 100 б. ({studentSubmission.totalPrimaryScore} перв.)
                      </span>
                    </div>
                  ) : (
                    <span className="font-mono text-xs text-[#1B1B19]/50 dark:text-gray-400">
                      Не начато
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isTutor && (
                    <button
                      onClick={() => handleDeleteVariant(v.id)}
                      className="p-2 border border-[#1B1B19]/30 dark:border-[#323642] hover:border-rose-600 hover:text-rose-600 transition"
                      title="Удалить вариант"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onStartExam(v)}
                    className="font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {studentSubmission ? 'Решить заново' : 'Решать вариант'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submissions Journal & History Table (Visible to both Student and Tutor) */}
      {submissions.length > 0 && (
        <div className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#1B1B19]/15 dark:border-[#323642] pb-3">
            <div>
              <span className="label-academic text-[#D4AF37]">
                {isTutor ? 'Ведомость вариантов' : 'История решений'}
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2">
                <History className="w-5 h-5 text-[#D4AF37]" />
                {isTutor
                  ? `Решённые варианты учеников (${submissions.length})`
                  : `Ваши результаты и история попыток (${submissions.length})`}
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="border-b border-[#1B1B19] dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316]">
                <tr>
                  <th className="p-2.5">Дата сдачи</th>
                  {isTutor && <th className="p-2.5">Ученик</th>}
                  <th className="p-2.5">Вариант КИМ</th>
                  <th className="p-2.5">Первичный балл (1-я + 2-я часть)</th>
                  <th className="p-2.5">Итог (ЕГЭ)</th>
                  <th className="p-2.5">Время</th>
                  <th className="p-2.5">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B1B19]/10 dark:divide-[#323642]">
                {submissions.map((s) => {
                  const part2Pts = s.partTwoScores ? Object.values(s.partTwoScores).reduce((a, b) => a + b, 0) : 0;
                  const part1Pts = Math.max(0, s.totalPrimaryScore - part2Pts);

                  return (
                    <tr key={s.id} className="hover:bg-[#F8F7F4] dark:hover:bg-[#1A1C24]/50">
                      <td className="p-2.5 whitespace-nowrap">{s.submittedAt}</td>
                      {isTutor && <td className="p-2.5 font-bold">{s.studentName}</td>}
                      <td className="p-2.5 truncate max-w-xs">{s.variantTitle}</td>
                      <td className="p-2.5">
                        <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                          {s.totalPrimaryScore} / {s.maxPrimaryScore} б.
                        </span>
                        {part2Pts > 0 && (
                          <span className="text-[10px] text-[#D4AF37] block">
                            (ч.1: {part1Pts} б. + ч.2: {part2Pts} б.)
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">
                        {s.secondaryScore} / 100
                      </td>
                      <td className="p-2.5 whitespace-nowrap">{Math.round(s.timeSpentSeconds / 60)} мин.</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-600 font-bold">
                          Проверено
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tutor Modal: Upload / Create Variant with Task Builder, LaTeX, Images, and Files */}
      <VariantBuilderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onVariantCreated={(newVar) => {
          setVariants(storage.getExamVariants());
        }}
        students={students}
      />

      {/* Batch JSON Import Modal */}
      <BatchImportModal
        isOpen={showBatchImport}
        onClose={() => setShowBatchImport(false)}
        onSuccess={() => {
          setVariants(storage.getExamVariants());
        }}
      />
    </div>
  );
};
