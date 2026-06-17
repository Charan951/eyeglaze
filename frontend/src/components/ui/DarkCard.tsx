import React from 'react';

interface DarkCardProps {
  children: React.ReactNode;
  className?: string;
  goldBorder?: boolean;
}

export default function DarkCard({ children, className = '', goldBorder = false }: DarkCardProps) {
  return (
    <div
      className={`bg-[#131314] rounded-xl p-4 border ${goldBorder ? 'border-[#D4A04D]' : 'border-[#2A2A2D]'} ${className}`}
    >
      {children}
    </div>
  );
}
