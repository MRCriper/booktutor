import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LogOut,
  Calendar,
  BookOpen,
  FileEdit,
  TrendingUp,
  Users,
  Menu,
  X,
  FileCode2,
  Palette,
  ExternalLink,
  Gift,
  FileText,
  ChevronDown,
  Calculator,
  MessageSquare,
  Sparkles,
  Sun,
  Moon,
  Scale,
  Sliders,
  Database,
} from 'lucide-react';
import { User } from '../../types';
import { UserAvatar } from './UserAvatar';
import { StudentGamificationState } from '../../utils/gamification';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  activeView: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (view: string) => void;
  onSwitchUser?: (user: User) => void;
  onOpenSandbox: () => void;
  onOpenChat: () => void;
  onOpenAi: () => void;
  onOpenCalculator?: () => void;
  onOpenDatabase?: () => void;
  onLogout: () => void;
  gamificationStats?: StudentGamificationState;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  theme,
  onToggleTheme,
  onNavigate,
  onOpenSandbox,
  onOpenChat,
  onOpenAi,
  onOpenCalculator,
  onOpenDatabase,
  onLogout,
  gamificationStats,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isTutor = currentUser.role === 'tutor';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tutorNav = [
    { id: 'schedule', label: 'Расписание', icon: Calendar },
    { id: 'students', label: 'Ученики', icon: Users },
    { id: 'variants', label: 'Варианты', icon: FileText },
    { id: 'tasks', label: 'Банк задач', icon: BookOpen },
    { id: 'homeworks', label: 'ДЗ & Материалы', icon: FileCode2 },
    { id: 'specs', label: 'Спецификации & Шкалы', icon: Scale },
    { id: 'notes', label: 'Журнал', icon: FileEdit },
    { id: 'progress', label: 'Аналитика', icon: TrendingUp },
  ];

  const studentNav = [
    { id: 'schedule', label: 'Мои уроки', icon: Calendar },
    { id: 'variants', label: 'Варианты КИМ', icon: FileText },
    { id: 'homeworks', label: 'Домашние задания', icon: FileCode2 },
    { id: 'materials', label: 'Конспекты', icon: BookOpen },
    { id: 'specs', label: 'Спецификации & Шкалы', icon: Scale },
    { id: 'rewards', label: 'Награды XP', icon: Gift },
    { id: 'progress', label: 'Мой прогресс', icon: TrendingUp },
  ];

  const currentNav = isTutor ? tutorNav : studentNav;

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8F7F4]/95 dark:bg-[#121316]/95 backdrop-blur-md border-b border-[#1B1B19]/15 dark:border-[#323642] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand: BookTutor with Book Icon */}
        <div className="flex items-center gap-5 xl:gap-7">
          <div
            onClick={() => onNavigate('schedule')}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div className="w-8 h-8 rounded-xs bg-[#1B1B19] dark:bg-[#E5C048] flex items-center justify-center text-[#F8F7F4] dark:text-[#121316] shadow-2xs group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] tracking-tight group-hover:opacity-85 transition">
              Book<span className="italic font-normal text-[#D4AF37] dark:text-[#E5C048]">Tutor</span>
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-4 ml-1">
            {currentNav.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`font-mono text-[10px] xl:text-[11px] uppercase tracking-wider py-1 transition relative whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-[#1B1B19] dark:text-[#E5C048] font-bold border-b-2 border-[#1B1B19] dark:border-[#E5C048]'
                      : 'text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right User & Quick Utility Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Student Gamification Bar in Header (on wide screens) */}
          {!isTutor && gamificationStats && (
            <div
              onClick={() => onNavigate('progress')}
              className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-[#1A1C24] border border-[#1B1B19]/20 dark:border-[#323642] cursor-pointer hover:bg-[#F8F7F4] dark:hover:bg-[#202430] transition shadow-2xs select-none shrink-0"
              title={`Уровень ${gamificationStats.currentLevel}: ${gamificationStats.levelTitle}`}
            >
              <span className="w-4 h-4 bg-[#1B1B19] dark:bg-[#E5C048] text-[#F8F7F4] dark:text-[#121316] flex items-center justify-center text-[9px] font-mono font-bold">
                L{gamificationStats.currentLevel}
              </span>
              <span className="font-mono text-[10px] text-[#1B1B19] dark:text-[#F3F3EE] font-bold">
                {gamificationStats.totalXp} XP
              </span>
            </div>
          )}

          {/* Tools Menu Button (Single button containing all tools: Calculator, Chat, AI, Python Sandbox, Theme) */}
          <div className="relative shrink-0" ref={toolsMenuRef}>
            <button
              onClick={() => {
                setToolsMenuOpen(!toolsMenuOpen);
                setUserDropdownOpen(false);
              }}
              className={`font-mono text-xs uppercase tracking-wider font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 border transition flex items-center gap-1.5 sm:gap-2 shadow-2xs cursor-pointer select-none ${
                toolsMenuOpen
                  ? 'bg-[#1B1B19] text-[#F8F7F4] border-[#1B1B19] dark:bg-[#E5C048] dark:text-[#121316] dark:border-[#E5C048]'
                  : 'bg-white dark:bg-[#1A1C24] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] border-[#1B1B19]/20 dark:border-[#323642]'
              }`}
              title="Инструменты платформы"
            >
              <Sliders className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#121316]" />
              <span className="hidden sm:inline">Инструменты</span>
              <ChevronDown
                className={`w-3 h-3 text-[#1B1B19]/60 dark:text-gray-400 transition-transform ${
                  toolsMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {toolsMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] shadow-2xl z-50 py-1.5 font-mono text-xs animate-in fade-in duration-100">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#1B1B19]/50 dark:text-gray-400 border-b border-[#1B1B19]/10 dark:border-[#323642] mb-1">
                  Инструменты и сервисы
                </div>

                {onOpenCalculator && (
                  <button
                    onClick={() => {
                      setToolsMenuOpen(false);
                      onOpenCalculator();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center justify-between group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-xs bg-amber-500/10 text-amber-600 dark:text-[#E5C048] flex items-center justify-center">
                        <Calculator className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[11px]">Калькулятор для физики</div>
                        <div className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 font-sans">
                          Дроби, степени, константы КИМ
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition font-mono">→</span>
                  </button>
                )}

                {onOpenChat && (
                  <button
                    onClick={() => {
                      setToolsMenuOpen(false);
                      onOpenChat();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center justify-between group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-xs bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[11px]">Чат платформы</div>
                        <div className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 font-sans">
                          Сообщения ученика и преподавателя
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition font-mono">→</span>
                  </button>
                )}

                {onOpenAi && (
                  <button
                    onClick={() => {
                      setToolsMenuOpen(false);
                      onOpenAi();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center justify-between group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[11px]">ИИ-тьютор BookTutor</div>
                        <div className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 font-sans">
                          Подсказки и разбор задач
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition font-mono">→</span>
                  </button>
                )}

                {onOpenSandbox && (
                  <button
                    onClick={() => {
                      setToolsMenuOpen(false);
                      onOpenSandbox();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center justify-between group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <FileCode2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[11px]">Песочница Python</div>
                        <div className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 font-sans">
                          IDE для задач КИМ по информатике
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition font-mono">→</span>
                  </button>
                )}

                {onOpenDatabase && (
                  <button
                    onClick={() => {
                      setToolsMenuOpen(false);
                      onOpenDatabase();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center justify-between group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-xs bg-amber-500/10 text-amber-600 dark:text-[#E5C048] flex items-center justify-center">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[11px]">База данных & Бэкап (Vercel)</div>
                        <div className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 font-sans">
                          Где хранятся данные, 1-клик JSON дамп
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition font-mono">→</span>
                  </button>
                )}

                <div className="border-t border-[#1B1B19]/10 dark:border-[#323642] my-1" />

                <button
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-[#1B1B19] dark:text-[#F3F3EE] flex items-center justify-between group transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-xs bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                      {theme === 'dark' ? (
                        <Sun className="w-3.5 h-3.5 text-[#E5C048]" />
                      ) : (
                        <Moon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[11px]">
                        {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
                      </div>
                      <div className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 font-sans">
                        Переключить тему оформления
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Dropdown (Clean, No Account Switching) */}
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2 sm:py-1 bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] transition text-left cursor-pointer"
              title="Профиль пользователя"
            >
              <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-[#1B1B19] dark:text-[#F3F3EE] leading-tight truncate max-w-[85px] md:max-w-[105px]">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="font-mono text-[9px] uppercase text-[#1B1B19]/60 dark:text-gray-400 tracking-wider">
                  {isTutor ? 'Репетитор' : currentUser.grade || 'Ученик'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-[#1B1B19]/50 dark:text-gray-400 hidden sm:inline" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1 w-60 bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] shadow-2xl z-50 py-2 font-mono text-xs animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-[#1B1B19]/15 dark:border-[#323642] space-y-0.5">
                  <div className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 truncate">{currentUser.email}</div>
                  <div className="text-[10px] text-[#D4AF37] font-semibold">
                    {isTutor ? 'Преподаватель' : `${currentUser.grade || '11 класс'} • ${currentUser.targetExam || 'ЕГЭ'}`}
                  </div>
                </div>

                {/* Whiteboard link inside user menu if available */}
                {!isTutor && currentUser.miroBoardUrl && (
                  <a
                    href={currentUser.miroBoardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 dark:hover:bg-white/5 border-b border-[#1B1B19]/15 dark:border-[#323642]"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Интерактивная онлайн-доска</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                  </a>
                )}

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Выйти из аккаунта
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 rounded transition cursor-pointer"
            aria-label="Меню"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F8F7F4] dark:bg-[#16181F] border-b border-[#1B1B19] dark:border-[#323642] px-4 py-3 space-y-2">
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left py-2 px-3 font-mono text-xs uppercase tracking-wider flex items-center gap-2.5 transition ${
                  isActive
                    ? 'bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold'
                    : 'text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}

          {!isTutor && currentUser.miroBoardUrl && (
            <a
              href={currentUser.miroBoardUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-[#1B1B19] dark:text-[#F3F3EE] bg-amber-500/10 border border-amber-600/30 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
                Интерактивная онлайн-доска
              </span>
              <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
            </a>
          )}

          {/* Mobile Tools Quick Actions */}
          <div className="pt-2 border-t border-[#1B1B19]/15 dark:border-[#323642] space-y-1">
            <div className="px-3 py-1 font-mono text-[10px] uppercase font-bold tracking-wider text-[#1B1B19]/50 dark:text-gray-400">
              Инструменты
            </div>
            {onOpenCalculator && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCalculator();
                }}
                className="w-full text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <Calculator className="w-3.5 h-3.5 text-[#D4AF37]" />
                Калькулятор для физики
              </button>
            )}
            {onOpenChat && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenChat();
                }}
                className="w-full text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                Чат платформы
              </button>
            )}
            {onOpenAi && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAi();
                }}
                className="w-full text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                ИИ-тьютор BookTutor
              </button>
            )}
            {onOpenSandbox && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSandbox();
                }}
                className="w-full text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <FileCode2 className="w-3.5 h-3.5 text-emerald-500" />
                Песочница Python
              </button>
            )}
            {onOpenDatabase && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDatabase();
                }}
                className="w-full text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
                База данных & Бэкап (Vercel)
              </button>
            )}
            <button
              onClick={() => {
                onToggleTheme();
              }}
              className="w-full text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-[#1B1B19] dark:text-[#F3F3EE] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#E5C048]" /> : <Moon className="w-3.5 h-3.5" />}
              {theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            </button>
          </div>
        </div>
      )}

    </header>
  );
};
