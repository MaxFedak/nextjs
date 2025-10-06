import clsx from 'clsx';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  } as const;

  const variants = {
    primary:
      'text-white shadow-sm bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 active:from-indigo-600 active:to-fuchsia-600 focus-visible:outline-indigo-500',
    secondary:
      'bg-white/90 text-slate-900 border border-slate-200 hover:bg-white focus-visible:outline-indigo-500',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-indigo-500',
    destructive:
      'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 focus-visible:outline-red-600',
  } as const;

  return (
    <button
      {...rest}
      className={clsx(base, sizes[size], variants[variant], className)}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
