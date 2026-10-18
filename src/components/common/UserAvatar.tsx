import React, { useState } from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  // Compute initials: e.g. "Александр Воронов" -> "АВ"
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (name[0] || 'U').toUpperCase();

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-base',
  };

  if (avatarUrl && !hasError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setHasError(true)}
        className={`${sizeClasses[size]} rounded-xl object-cover border border-slate-700/60 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl bg-slate-800 text-slate-200 border border-slate-700/60 font-semibold flex items-center justify-center select-none shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
};
