import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, BookOpen, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, StudyMaterial } from '../../types';
import { MathRenderer } from '../common/MathRenderer';

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Omit<StudyMaterial, 'id'>) => void;
}

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('math');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<StudyMaterial['type']>('lecture_notes');
  const [content, setContent] = useState('');
  const [keyFormulas, setKeyFormulas] = useState<string[]>(['']);
  const [readTimeMinutes, setReadTimeMinutes] = useState(10);
  const [externalUrl, setExternalUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddFormulaField = () => {
    setKeyFormulas([...keyFormulas, '']);
  };

  const handleFormulaChange = (idx: number, val: string) => {
    const updated = [...keyFormulas];
    updated[idx] = val;
    setKeyFormulas(updated);
  };

  const handleRemoveFormulaField = (idx: number) => {
    setKeyFormulas(keyFormulas.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Укажите название конспекта');
      return;
    }
    if (!content.trim()) {
      setError('Заполните содержание конспекта или формулы');
      return;
    }

    const filteredFormulas = keyFormulas.map((f) => f.trim()).filter(Boolean);

    onSave({
      title: title.trim(),
      subject,
      topic: topic.trim() || 'Общая теория',
      type,
      content: content.trim(),
      keyFormulas: filteredFormulas.length > 0 ? filteredFormulas : undefined,
      readTimeMinutes: Math.max(1, Number(readTimeMinutes) || 10),
      externalUrl: externalUrl.trim() || undefined,
    });

    confetti({ particleCount: 50, spread: 60 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] shadow-2xl flex flex-col max-h-[90vh] text-left"
      >
        <div className="px-5 py-4 bg-white dark:bg-[#1A1C24] border-b border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
              Новый конспект / Теоретический материал
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white border border-[#1B1B19]/20 dark:border-[#323642] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-[#1B1B19] dark:text-[#F3F3EE] mb-1">
              Название материала *:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="например: Шпаргалка: Стереометрия и координаты (ЕГЭ №14)"
              className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/25 dark:border-[#383C4A] focus:outline-none focus:border-[#1B1B19] dark:focus:border-[#E5C048]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#1B1B19] dark:text-[#F3F3EE] mb-1">Предмет:</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-[#1B1B19]/25 dark:border-[#383C4A] focus:outline-none"
              >
                <option value="math">Математика</option>
                <option value="physics">Физика</option>
                <option value="cs">Информатика</option>
                <option value="russian">Русский язык</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1B1B19] dark:text-[#F3F3EE] mb-1">Тип материала:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-[#1B1B19]/25 dark:border-[#383C4A] focus:outline-none"
              >
                <option value="lecture_notes">Конспект лекции</option>
                <option value="formula_pack">Пакет формул</option>
                <option value="cheat_sheet">Шпаргалка</option>
                <option value="code_sample">Шаблон кода Python</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1B1B19] dark:text-[#F3F3EE] mb-1">Время чтения (мин):</label>
              <input
                type="number"
                min="1"
                max="180"
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
                className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-[#1B1B19]/25 dark:border-[#383C4A] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1B1B19] dark:text-[#F3F3EE] mb-1">
              Тема КИМ / Раздел:
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="например: Векторы, стереометрия, координаты"
              className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-[#1B1B19]/25 dark:border-[#383C4A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1B1B19] dark:text-[#F3F3EE] mb-1">
              Текст конспекта и теоретические правила *:
            </label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Опишите теоремы, свойства, алгоритмы решения и методические рекомендации..."
              className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2.5 border border-[#1B1B19]/25 dark:border-[#383C4A] focus:outline-none font-sans text-xs resize-none"
            />
          </div>

          {/* Key Formulas Section */}
          <div className="space-y-2 pt-1 border-t border-[#1B1B19]/10 dark:border-[#323642]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                Ключевые формулы (LaTeX):
              </span>
              <button
                type="button"
                onClick={handleAddFormulaField}
                className="px-2 py-1 bg-[#1B1B19]/10 dark:bg-white/10 text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-[#1B1B19] hover:text-white transition flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <Plus className="w-3 h-3" /> Добавить формулу
              </button>
            </div>

            {keyFormulas.map((form, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={form}
                  onChange={(e) => handleFormulaChange(idx, e.target.value)}
                  placeholder="например: d = \frac{|Ax_0 + By_0 + Cz_0 + D|}{\sqrt{A^2+B^2+C^2}}"
                  className="flex-1 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-[#1B1B19]/25 dark:border-[#383C4A] text-xs font-mono focus:outline-none"
                />
                {keyFormulas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFormulaField(idx)}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block font-bold text-[#1B1B19] dark:text-[#F3F3EE] mb-1">
              Внешняя ссылка (Miro, ФИПИ, видеоразбор) — опционально:
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://fipi.ru или https://miro.com/..."
              className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] p-2 border border-[#1B1B19]/25 dark:border-[#383C4A] focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/20 dark:border-[#323642] font-bold uppercase tracking-wider hover:bg-[#F8F7F4] cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Сохранить конспект
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
