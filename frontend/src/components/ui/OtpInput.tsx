import React, { useRef, useState } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  onChange?: (otp: string) => void;
}

export default function OtpInput({ length = 6, onComplete, onChange }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newValues = [...values];
    newValues[index] = val.slice(-1);
    setValues(newValues);
    onChange?.(newValues.join(''));
    if (val && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
    if (newValues.every(v => v !== '')) {
      onComplete?.(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {values.map((val, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-xl font-bold bg-[#131314] border border-[#2A2A2D] rounded-xl text-white focus:border-[#D4A04D] focus:outline-none"
        />
      ))}
    </div>
  );
}
