import React, { useState } from 'react';
import { LogIn, AlertCircle, BookOpen, Sun, Moon } from 'lucide-react';
import { storage } from '../../services/storage';
import { User } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = storage.login(email, password);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Неверный логин или пароль');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#0F1117] text-[#1B1B19] dark:text-[#F3F3EE] flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#1B1B19] selection:text-[#F8F7F4] relative">
      {/* Theme Switcher Button on Login View */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          className={`absolute top-4 right-4 sm:top-6 sm:right-6 px-3 py-1.5 border font-mono text-xs uppercase transition flex items-center gap-1.5 shadow-2xs cursor-pointer select-none z-20 ${
            theme === 'dark'
              ? 'bg-[#1E222D] hover:bg-[#282D3C] text-[#E5C048] border-[#E5C048]'
              : 'bg-white hover:bg-[#F8F7F4] text-[#1B1B19] border-[#1B1B19]'
          }`}
          title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#E5C048]" />
              <span className="text-[10px] uppercase font-bold text-[#E5C048]">Светлая тема</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#1B1B19]" />
              <span className="text-[10px] uppercase font-bold">Тёмная тема</span>
            </>
          )}
        </button>
      )}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-10 h-10 bg-[#1B1B19] dark:bg-[#E5C048] flex items-center justify-center text-[#F8F7F4] dark:text-[#121316] shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1B1B19] dark:text-[#F3F3EE]">
              Book<span className="italic font-normal text-[#D4AF37] dark:text-[#E5C048]">Tutor</span>
            </span>
          </div>
          <div className="label-academic flex items-center justify-center text-[#D4AF37]">
            <span className="marker-academic"></span>
            Academic Portal 2026
          </div>
          <p className="text-xs text-[#1B1B19]/60 dark:text-gray-400 font-mono">
            Преподаватель: Мальцев Роман Михайлович
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#16181F] py-8 px-6 sm:px-8 border border-[#1B1B19] dark:border-[#323642] shadow-sm space-y-6">
          <div className="border-b border-[#1B1B19]/15 dark:border-[#323642] pb-4">
            <h2 className="font-serif text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE]">Вход в личный кабинет</h2>
            <p className="text-xs text-[#1B1B19]/60 dark:text-gray-400 mt-0.5 font-sans">
              Подготовка к ЕГЭ/ОГЭ: Математика, Физика, Информатика, Русский язык
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#1B1B19] dark:text-[#F3F3EE] mb-1.5 font-bold">
                Email / Логин
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] px-3.5 py-2.5 border border-[#1B1B19] dark:border-[#323642] focus:outline-none focus:ring-1 focus:ring-[#1B1B19] text-xs font-mono transition"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#1B1B19] dark:text-[#F3F3EE] mb-1.5 font-bold">
                Пароль
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F8F7F4] dark:bg-[#121316] text-[#1B1B19] dark:text-[#F3F3EE] px-3.5 py-2.5 border border-[#1B1B19] dark:border-[#323642] focus:outline-none focus:ring-1 focus:ring-[#1B1B19] text-xs font-mono transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 font-mono text-xs uppercase tracking-widest py-3 px-4 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#D4AF37] dark:text-[#121316]" />
              {loading ? 'Проверка...' : 'Войти в систему'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
