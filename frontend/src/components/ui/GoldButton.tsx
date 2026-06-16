import React from 'react';

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'filled' | 'outline';
  fullWidth?: boolean;
}

export default function GoldButton({
  children,
  variant = 'filled',
  fullWidth = false,
  className = '',
  ...props
}: GoldButtonProps) {
  const base =
    'py-3 px-6 rounded-xl font-bold uppercase text-sm tracking-wide transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer';
  const filled = 'bg-[#C9A84C] text-black';
  const outline = 'border border-[#C9A84C] text-white bg-transparent';
  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${base} ${variant === 'filled' ? filled : outline} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
