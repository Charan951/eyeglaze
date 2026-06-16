import React from 'react';

interface DarkCardProps {
  children: React.ReactNode;
  className?: string;
  goldBorder?: boolean;
}

export default function DarkCard({ children, className = '', goldBorder = false }: DarkCardProps) {
  return (
    <div
      className={`bg-[#1A1A1A] rounded-xl p-4 border ${goldBorder ? 'border-[#C9A84C]' : 'border-[#2A2A2A]'} ${className}`}
    >
      {children}
    </div>
  );
}
