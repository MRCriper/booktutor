import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  X,
  Send,
  User as UserIcon,
  Check,
  CheckCheck,
  Video,
  ExternalLink,
} from 'lucide-react';
import { User, ChatMessage } from '../../types';
import { storage } from '../../services/storage';
import { UserAvatar } from '../common/UserAvatar';
import { MathRenderer } from '../common/MathRenderer';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  students: User[];
  tutor: User;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  students,
  tutor,
}) => {
  const isTutor = currentUser.role === 'tutor';
  // Selected conversation partner
  const [activePartnerId, setActivePartnerId] = useState<string>(
    isTutor ? students[0]?.id || '' : tutor.id
  );
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activePartner = isTutor
    ? students.find((s) => s.id === activePartnerId) || students[0]
    : tutor;

  const messages = storage.getChatMessages(currentUser.id, activePartner?.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activePartner) return;

    storage.sendChatMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverId: activePartner.id,
      content: inputText.trim(),
    });

    setInputText('');
  };

  const handleSendQuick = (text: string) => {
    if (!activePartner) return;
    storage.sendChatMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverId: activePartner.id,
      content: text,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 dark:bg-black/80 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="w-full max-w-md h-full bg-[#F8F7F4] dark:bg-[#121316] border-l border-[#1B1B19] dark:border-[#323642] shadow-2xl flex flex-col text-xs"
        >
          {/* Header */}
          <div className="p-4 bg-white dark:bg-[#1A1C24] border-b border-[#1B1B19] dark:border-[#323642] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block" />
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">Диалоги BookTutor</h3>
                <p className="font-mono text-[10px] text-[#1B1B19]/60 dark:text-gray-400">
                  {isTutor ? 'Переписка с учениками' : `Преподаватель: ${tutor.name}`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* If Tutor: Partner Selector */}
          {isTutor && (
            <div className="px-3 py-2 bg-white dark:bg-[#16181F] border-b border-[#1B1B19]/15 dark:border-[#323642] flex gap-1.5 overflow-x-auto">
              {students.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setActivePartnerId(st.id)}
                  className={`font-mono text-xs px-2.5 py-1.5 border whitespace-nowrap transition flex items-center gap-1.5 ${
                    activePartnerId === st.id
                      ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] font-bold'
                      : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/30 dark:border-[#323642] hover:border-[#1B1B19]'
                  }`}
                >
                  <UserAvatar name={st.name} avatarUrl={st.avatarUrl} size="sm" />
                  <span>{st.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick links header banner (Whiteboard & Telemost) */}
          {activePartner && (
            <div className="px-4 py-2 bg-[#F8F7F4] dark:bg-[#16181F] border-b border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-[#1B1B19]/70 dark:text-gray-400">
                <span>Собеседник:</span>
                <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">{activePartner.name}</span>
              </div>

              {activePartner.miroBoardUrl && (
                <a
                  href={activePartner.miroBoardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1B1B19] dark:text-[#E5C048] font-bold hover:underline flex items-center gap-1"
                >
                  Онлайн-доска <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                </a>
              )}
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F8F7F4] dark:bg-[#0E1015]">
            {messages.length === 0 ? (
              <div className="text-center text-[#1B1B19]/50 dark:text-gray-500 font-mono py-12">
                Сообщений пока нет. Начните диалог (поддерживаются LaTeX-формулы: $...$)!
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === currentUser.id;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] font-mono text-[#1B1B19]/50 dark:text-gray-400 mb-0.5 px-1 flex items-center gap-1">
                      <span className="font-bold">{isMe ? 'Вы' : m.senderName}</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[88%] p-3.5 border shadow-2xs leading-relaxed ${
                        isMe
                          ? 'bg-[#FFFDF5] dark:bg-[#1E1F1A] text-[#1B1B19] dark:text-[#F3F3EE] border-[#D4AF37] dark:border-[#E5C048]/60'
                          : 'bg-white dark:bg-[#1A1C24] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/25 dark:border-[#323642]'
                      }`}
                    >
                      <MathRenderer content={m.content} />
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick reply chips */}
          <div className="px-3 py-2 bg-white dark:bg-[#16181F] border-t border-[#1B1B19]/15 dark:border-[#323642] flex gap-1.5 overflow-x-auto text-[11px] font-mono">
            {isTutor ? (
              <>
                <button
                  onClick={() => handleSendQuick('Заходи в Яндекс.Телемост, начинаем занятие!')}
                  className="px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:bg-[#1A1C24] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] border border-[#1B1B19]/40 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] whitespace-nowrap transition"
                >
                  📹 Телемост
                </button>
                <button
                  onClick={() => handleSendQuick('Я обновил задачи на онлайн-доске, посмотри.')}
                  className="px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:bg-[#1A1C24] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] border border-[#1B1B19]/40 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] whitespace-nowrap transition"
                >
                  🎨 Онлайн-доска
                </button>
                <button
                  onClick={() => handleSendQuick('Проверил твое домашнее задание, оставил комментарии.')}
                  className="px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:bg-[#1A1C24] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] border border-[#1B1B19]/40 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] whitespace-nowrap transition"
                >
                  ✓ ДЗ проверено
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleSendQuick('Здравствуйте! Я сдал домашнее задание на проверку.')}
                  className="px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:bg-[#1A1C24] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] border border-[#1B1B19]/40 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] whitespace-nowrap transition"
                >
                  ✓ Сдал ДЗ
                </button>
                <button
                  onClick={() => handleSendQuick('Я открыл онлайн-доску, готов к уроку.')}
                  className="px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:bg-[#1A1C24] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] border border-[#1B1B19]/40 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] whitespace-nowrap transition"
                >
                  🎨 На онлайн-доске
                </button>
                <button
                  onClick={() => handleSendQuick('Подскажите, пожалуйста, по заданию из конспекта.')}
                  className="px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:bg-[#1A1C24] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] border border-[#1B1B19]/40 dark:border-[#323642] text-[#1B1B19] dark:text-[#F3F3EE] whitespace-nowrap transition"
                >
                  ❓ Вопрос по теме
                </button>
              </>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-[#1A1C24] border-t border-[#1B1B19] dark:border-[#323642] flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Напишите сообщение (поддерживает $x^2 + y^2 = r^2$)..."
              className="flex-1 bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] text-xs px-3.5 py-2.5 border border-[#1B1B19] dark:border-[#323642] focus:outline-none focus:bg-white dark:focus:bg-[#16181F] font-mono"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] transition disabled:opacity-40 font-mono text-xs uppercase font-bold tracking-wider"
            >
              <Send className="w-4 h-4 text-[#D4AF37] dark:text-[#121316]" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
