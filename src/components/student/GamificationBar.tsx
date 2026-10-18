import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Lock,
  X,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentGamificationState, Badge } from '../../utils/gamification';

interface GamificationBarProps {
  stats: StudentGamificationState;
  compact?: boolean;
}

export const GamificationBar: React.FC<GamificationBarProps> = ({ stats, compact = false }) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showXpModal, setShowXpModal] = useState(false);

  const earnedBadgesCount = stats.badges.filter((b) => b.earned).length;

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    if (badge.earned) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/15 dark:border-[#323642] p-5 shadow-xs space-y-5 transition-colors">
      {/* Top Header: Level, XP Counter and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Level & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] flex items-center justify-center font-mono font-bold text-sm border border-[#1B1B19] dark:border-[#E5C048] shrink-0 shadow-2xs">
            L{stats.currentLevel}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-serif text-xl font-semibold text-[#1B1B19] dark:text-[#F3F3EE] leading-tight">
                {stats.levelTitle}
              </h3>
              <button
                onClick={() => setShowXpModal(true)}
                className="px-2.5 py-0.5 rounded-xs bg-[#F8F7F4] dark:bg-[#202430] hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/25 dark:border-[#323642] text-[11px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                title="Нажмите, чтобы увидеть детали начисления XP"
              >
                <Zap className="w-3 h-3 text-[#D4AF37] dark:text-[#E5C048] fill-current" />
                {stats.totalXp} XP
                <HelpCircle className="w-2.5 h-2.5 opacity-60 ml-0.5" />
              </button>
            </div>
            <p className="text-xs text-[#1B1B19]/60 dark:text-gray-400 font-mono mt-0.5">
              До уровня {stats.currentLevel + 1}: осталось еще {stats.xpNeededForNext} XP
            </p>
          </div>
        </div>

        {/* Badges Counter Link */}
        <div className="flex items-center sm:justify-end gap-3 text-xs">
          <div className="p-2 sm:px-3 sm:py-2 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642] flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] dark:bg-[#E5C048] inline-block" />
            <div>
              <span className="label-academic block leading-none text-[9px] text-[#1B1B19]/60 dark:text-gray-400">Достижения:</span>
              <span className="font-mono text-xs font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                {earnedBadgesCount} / {stats.badges.length} открыто
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth Framed Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-3 bg-[#1B1B19]/10 dark:bg-white/10 border border-[#1B1B19]/15 dark:border-[#323642] overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.levelProgressPercent}%` }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-[#1B1B19] dark:bg-[#E5C048] relative overflow-hidden"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent w-1/2"
            />
          </motion.div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-[#1B1B19]/60 dark:text-gray-400 px-0.5">
          <span>{stats.currentLevelBaseXp} XP</span>
          <span className="text-[#1B1B19] dark:text-[#F3F3EE] font-bold">{stats.levelProgressPercent}% завершено</span>
          <span>{stats.nextLevelXp} XP</span>
        </div>
      </div>

      {/* Badges Ribbon / Quick Shelf */}
      {!compact && (
        <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="label-academic text-[#1B1B19]/70 dark:text-gray-400">Коллекция наград:</span>
            <span className="text-[10px] text-[#1B1B19]/50 dark:text-gray-400">Нажмите на бейдж для подробностей</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {stats.badges.map((b) => (
              <button
                key={b.id}
                onClick={() => handleBadgeClick(b)}
                className={`px-3 py-2 border flex items-center gap-2 whitespace-nowrap transition cursor-pointer shrink-0 text-left ${
                  b.earned
                    ? 'bg-white dark:bg-[#202430] border-[#1B1B19] dark:border-[#E5C048]/50 hover:bg-[#1B1B19] hover:text-[#F8F7F4] dark:hover:bg-[#E5C048] dark:hover:text-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] group shadow-2xs'
                    : 'bg-[#F8F7F4] dark:bg-[#16181F] border-[#1B1B19]/15 dark:border-[#323642] text-[#1B1B19]/60 dark:text-gray-400 hover:border-[#1B1B19]/40 dark:hover:border-gray-500 opacity-75'
                }`}
              >
                <span className="text-base select-none">{b.icon}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif text-sm font-semibold">{b.title}</span>
                    {b.earned ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] dark:bg-[#E5C048] shrink-0" />
                    ) : (
                      <Lock className="w-2.5 h-2.5 text-[#1B1B19]/40 dark:text-gray-400 shrink-0" />
                    )}
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#1B1B19]/50 dark:text-gray-400 group-hover:text-inherit block">
                    {b.progress}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: BADGE DETAIL */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-xl space-y-4 text-center relative"
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 mx-auto bg-[#F8F7F4] dark:bg-[#202430] border border-[#1B1B19]/20 dark:border-[#323642] flex items-center justify-center text-3xl shadow-inner">
                {selectedBadge.icon}
              </div>

              <div>
                <span className="label-academic px-2 py-0.5 border border-[#1B1B19]/20 dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#16181F] text-[#1B1B19] dark:text-[#F3F3EE]">
                  {selectedBadge.earned ? 'Награда открыта' : 'В процессе выполнения'}
                </span>
                <h3 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] mt-2">
                  {selectedBadge.title}
                </h3>
                <p className="text-xs text-[#1B1B19]/70 dark:text-gray-400 mt-2 leading-relaxed">
                  {selectedBadge.description}
                </p>
              </div>

              <div className="p-3 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642] text-xs font-mono">
                <span className="text-[#1B1B19]/50 dark:text-gray-400 block text-[10px] uppercase tracking-wider">
                  Текущий прогресс:
                </span>
                <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">{selectedBadge.progress}</span>
              </div>

              {selectedBadge.earned && (
                <button
                  onClick={() => {
                    confetti({ particleCount: 50, spread: 70 });
                  }}
                  className="w-full font-mono text-xs uppercase tracking-wider py-2.5 px-3 bg-[#1B1B19] hover:bg-black dark:bg-[#E5C048] dark:text-[#121316] dark:hover:bg-[#d4ae36] text-[#F8F7F4] font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#121316]" />
                  Праздновать достижение!
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: XP BREAKDOWN */}
      <AnimatePresence>
        {showXpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-xl space-y-4 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1B1B19]/15 dark:border-[#323642]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] flex items-center justify-center font-mono font-bold">
                    <Zap className="w-4 h-4 text-[#D4AF37] dark:text-[#121316] fill-current" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                      Как начисляется опыт (XP)
                    </h3>
                    <p className="font-mono text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                      Всего накоплено: {stats.totalXp} XP
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowXpModal(false)}
                  className="text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {stats.breakdown.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#1B1B19] dark:text-[#F3F3EE]">{item.label}</h4>
                      <p className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                    <span className="font-mono font-bold text-[#1B1B19] dark:text-[#E5C048] shrink-0 text-sm">
                      +{item.amount} XP
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-stone-50 dark:bg-[#202430] border border-[#1B1B19]/15 dark:border-[#323642] text-[11px] text-[#1B1B19]/70 dark:text-gray-300 leading-relaxed font-sans">
                Выполняйте домашние задания, сдавайте решения на 90%+ баллов и осваивайте темы кодификатора, чтобы повышать академический уровень и открывать редкие достижения!
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
