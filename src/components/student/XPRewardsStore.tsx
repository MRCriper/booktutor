import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  BookOpen,
  Clock,
  Crown,
  Video,
  Check,
  Lock,
  ArrowRight,
  Gift,
  ExternalLink,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, XPReward } from '../../types';
import { storage } from '../../services/storage';

interface XPRewardsStoreProps {
  currentUser: User;
  currentXP: number;
  currentLevel: number;
}

export const XPRewardsStore: React.FC<XPRewardsStoreProps> = ({
  currentUser,
  currentXP,
  currentLevel,
}) => {
  const [rewards, setRewards] = useState<XPReward[]>(storage.getXPRewards());
  const [claimedRewardIds, setClaimedRewardIds] = useState<string[]>(
    currentUser.claimedRewards || []
  );
  const [activeModalReward, setActiveModalReward] = useState<XPReward | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-[#D4AF37]" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-500" />;
      case 'Video':
        return <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-yellow-500" />;
      case 'Award':
      default:
        return <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const handleClaim = (reward: XPReward) => {
    if (currentXP < reward.costXP) return;

    storage.claimXPReward(reward.id, currentUser.id);
    const updated = [...claimedRewardIds, reward.id];
    setClaimedRewardIds(updated);

    // Notify Roman Maltsev in chat
    const tutor = storage.getUsers().find((u) => u.role === 'tutor');
    if (tutor) {
      storage.sendChatMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'student',
        receiverId: tutor.id,
        content: `🎉 Я обменял ${reward.costXP} XP на награду: «${reward.title}»!`,
      });
    }

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });

    setActiveModalReward(reward);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block" />
            <span className="label-academic text-[#D4AF37]">Академический магазин BookTutor</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] mt-1">
            Награды и привилегии за опыт (XP)
          </h2>
          <p className="text-xs text-[#1B1B19]/70 dark:text-gray-400 font-mono mt-1">
            Решайте домашние задания, закрывайте темы кодификатора и тренировочные варианты, чтобы открывать реальные бонусы.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19] dark:border-[#323642] text-center font-mono">
            <span className="label-academic block">Уровень</span>
            <span className="text-2xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
              LVL {currentLevel}
            </span>
          </div>
          <div className="p-3 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] border border-[#1B1B19] dark:border-[#E5C048] text-center font-mono">
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
              Баланс опыта
            </span>
            <span className="text-2xl font-bold">{currentXP} XP</span>
          </div>
        </div>
      </div>

      {/* Rewards Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const isClaimed = claimedRewardIds.includes(reward.id);
          const canAfford = currentXP >= reward.costXP;

          return (
            <div
              key={reward.id}
              className={`bg-white dark:bg-[#16181F] border p-5 shadow-2xs flex flex-col justify-between space-y-4 transition ${
                isClaimed
                  ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : canAfford
                  ? 'border-[#1B1B19] dark:border-[#323642] hover:border-[#D4AF37]'
                  : 'border-[#1B1B19]/25 dark:border-[#2A2D36] opacity-75'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642]">
                    {getIcon(reward.icon)}
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 border border-[#1B1B19] dark:border-[#323642] bg-[#F8F7F4] dark:bg-[#121316] text-[#D4AF37]">
                    {reward.costXP} XP
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE] leading-snug">
                  {reward.title}
                </h3>

                <p className="text-xs text-[#1B1B19]/70 dark:text-gray-400 font-mono leading-relaxed">
                  {reward.description}
                </p>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between font-mono text-xs">
                {isClaimed ? (
                  <button
                    onClick={() => setActiveModalReward(reward)}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Получено (Открыть)
                  </button>
                ) : canAfford ? (
                  <button
                    onClick={() => handleClaim(reward)}
                    className="w-full py-2 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-2xs"
                  >
                    <Gift className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#121316]" /> Получить награду
                  </button>
                ) : (
                  <div className="w-full py-2 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19]/20 dark:border-[#323642] text-[#1B1B19]/50 dark:text-gray-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5" /> Нужно ещё {reward.costXP - currentXP} XP
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Secret Reward Modal */}
      {activeModalReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] shadow-2xl p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#1B1B19]/15 dark:border-[#323642] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block" />
                <span className="font-serif text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                  Награда разблокирована!
                </span>
              </div>
              <button
                onClick={() => setActiveModalReward(null)}
                className="p-1 text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                {activeModalReward.title}
              </h4>

              <div className="p-4 bg-[#F8F7F4] dark:bg-[#121316] border border-[#1B1B19] dark:border-[#323642] space-y-2">
                <span className="label-academic text-[#D4AF37] block">Ваш ключ доступа / инструкция:</span>
                <p className="text-xs text-[#1B1B19] dark:text-[#F3F3EE] select-all font-bold">
                  {activeModalReward.secretContent || 'Награда успешно активирована в вашем профиле.'}
                </p>
              </div>

              <p className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400 leading-relaxed">
                Преподаватель (Мальцев Роман Михайлович) автоматически получил уведомление о получении этой награды в чате диалога.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModalReward(null)}
                className="px-4 py-2 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold uppercase tracking-wider"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
