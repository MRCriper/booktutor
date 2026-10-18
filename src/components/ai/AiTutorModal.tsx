import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  BookOpen,
  Award,
  AlertCircle,
  HelpCircle,
  Brain,
  Lightbulb,
} from 'lucide-react';
import { User, StudyMaterial, Homework, InformalNote, ExamTopicProgress } from '../../types';
import { MathRenderer } from '../common/MathRenderer';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User;
  materials: StudyMaterial[];
  homeworks: Homework[];
  notes: InformalNote[];
  topics: ExamTopicProgress[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AiTutorModal: React.FC<AiTutorModalProps> = ({
  isOpen,
  onClose,
  student,
  materials,
  homeworks,
  notes,
  topics,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Привет, ${student.name.split(' ')[0]}! Я твой персональный ИИ-ассистент по точным наукам. 
Я вижу твои конспекты, домашние задания, оценки и замечания преподавателя. 
Спроси меня о непонятной формуле, разборе ошибки в ДЗ или о том, как закрыть сложные номера экзамена!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Assemble full site context for Gemini API
      const contextPayload = {
        student: {
          name: student.name,
          grade: student.grade,
          targetExam: student.targetExam,
          targetScore: student.targetScore,
          currentScore: student.currentScore,
        },
        materials: materials.map((m) => ({
          title: m.title,
          subject: m.subject,
          topic: m.topic,
          content: m.content,
          formulas: m.keyFormulas,
        })),
        recentHomeworks: homeworks
          .filter((h) => h.studentId === student.id)
          .map((h) => ({
            title: h.title,
            status: h.status,
            grade: h.grade,
            feedback: h.tutorFeedback,
            tasks: h.tasks.map((t) => ({
              answer: t.studentAnswer,
              comment: t.tutorComment,
              score: t.score,
            })),
          })),
        tutorNotes: notes
          .filter((n) => n.studentId === student.id)
          .map((n) => ({
            topic: n.topicCovered,
            weakSpots: n.weakSpots,
            emotionalState: n.emotionalState,
            actionItems: n.actionItemsNextLesson,
          })),
        topicsProgress: topics.map((t) => ({
          name: t.topicName,
          mastery: t.masteryPercentage,
          subject: t.subject,
        })),
      };

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          context: contextPayload,
        }),
      });

      const data = await res.json();
      const botReply: Message = {
        role: 'assistant',
        content: data.answer || 'Ответ получен.',
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Произошла временная ошибка связи. Рекомендую посмотреть конспект по теме или обратиться к репетитору на занятии!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Объясни формулу из конспекта по электродинамике',
    'В чём моя ошибка в последнем ДЗ?',
    'Как поднять балл с текущего среза до цели?',
    'Как решать Задание 24 на Python?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white border border-[#1B1B19] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs"
      >
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#1B1B19] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif text-lg font-bold text-[#1B1B19]">Квант AI — Персональный тьютор</h3>
                <span className="label-academic border border-[#1B1B19] px-1.5 py-0.5 bg-[#F8F7F4]">
                  Все материалы
                </span>
              </div>
              <p className="font-mono text-[10px] text-[#1B1B19]/60">
                Контекст: {student.name} • {student.targetExam} • {student.currentScore} / {student.targetScore} б.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#1B1B19]/60 hover:text-[#1B1B19] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Context Pill indicators */}
        <div className="px-4 py-2 bg-[#F8F7F4] border-b border-[#1B1B19]/15 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
          <span className="shrink-0 flex items-center gap-1 text-[#1B1B19]/60">
            <Brain className="w-3.5 h-3.5 text-[#D4AF37]" /> Подключено:
          </span>
          <span className="px-2 py-0.5 border border-[#1B1B19]/30 bg-white text-[#1B1B19] whitespace-nowrap">
            {materials.length} конспектов
          </span>
          <span className="px-2 py-0.5 border border-[#1B1B19]/30 bg-white text-[#1B1B19] whitespace-nowrap">
            ДЗ и комментарии
          </span>
          <span className="px-2 py-0.5 border border-[#1B1B19]/30 bg-white text-[#1B1B19] whitespace-nowrap">
            Журнал слабых мест
          </span>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 bg-[#1B1B19] text-[#F8F7F4] flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3.5 border shadow-2xs leading-relaxed ${
                    isUser
                      ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19]'
                      : 'bg-[#F8F7F4] text-[#1B1B19] border-[#1B1B19]'
                  }`}
                >
                  <MathRenderer content={m.content} />
                </div>
              </motion.div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 items-center font-mono text-xs text-[#1B1B19] bg-[#F8F7F4] p-3 border border-[#1B1B19]">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
              <span>ИИ анализирует формулы, конспекты и материалы ученика...</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 bg-white border-t border-[#1B1B19]/15 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          <span className="text-[#1B1B19]/60 shrink-0 flex items-center gap-1 mr-1">
            <Lightbulb className="w-3 h-3 text-[#D4AF37]" /> Спросить:
          </span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#1B1B19] hover:text-[#F8F7F4] border border-[#1B1B19] text-[#1B1B19] whitespace-nowrap transition disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-[#1B1B19] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спросите что угодно по теме, конспекту или задаче..."
            disabled={loading}
            className="flex-1 bg-[#F8F7F4] text-[#1B1B19] text-xs px-3.5 py-2.5 border border-[#1B1B19] focus:outline-none focus:bg-white font-mono disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] transition disabled:opacity-40 font-mono text-xs font-bold uppercase tracking-wider"
          >
            <Send className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
