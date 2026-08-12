import { useRef, useState } from 'react';

interface PowerPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  /** Set true when the option list has no natural negative/positive split (renders as a single column). */
  singleColumn?: boolean;
}

export default function PowerPicker({ label, value, onChange, options, placeholder = 'Select', disabled = false, singleColumn = false }: PowerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const negColRef = useRef<HTMLDivElement>(null);
  const posColRef = useRef<HTMLDivElement>(null);
  const singleColRef = useRef<HTMLDivElement>(null);

  const negativeOptions = options.filter(v => v.trim().startsWith('-'));
  const positiveOptions = options.filter(v => !v.trim().startsWith('-'));
  const hasSplit = !singleColumn && negativeOptions.length > 0 && positiveOptions.length > 0;

  const scrollCol = (ref: typeof negColRef, dir: 'up' | 'down') => {
    ref.current?.scrollBy({ top: dir === 'up' ? -120 : 120, behavior: 'smooth' });
  };

  const Row = ({ opt }: { opt: string }) => {
    const isSelected = value === opt;
    return (
      <button
        type="button"
        onClick={() => {
          onChange(opt);
          setIsOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors cursor-pointer text-left ${
          isSelected ? 'bg-[#D4A04D]/10 text-[#D4A04D]' : 'text-gray-200 hover:bg-[#1C1C1E]'
        }`}
      >
        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[#D4A04D]' : 'border-gray-600'}`}>
          {isSelected && <span className="w-2 h-2 rounded-full bg-[#D4A04D]" />}
        </span>
        {opt}
      </button>
    );
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`w-full border rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-between transition-all cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${
          value
            ? 'border-[#D4A04D] text-[#D4A04D] bg-[#D4A04D]/10'
            : 'bg-[#18181A] border-[#2A2A2D] text-gray-400 hover:border-gray-500 hover:text-white'
        }`}
      >
        <span className="truncate">{value || placeholder}</span>
        <span className="text-[10px] opacity-70 ml-1">▼</span>
      </button>

      {isOpen && !disabled && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#131314] border border-[#2A2A2D] rounded-2xl w-full max-w-md shadow-2xl relative select-none overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2D]">
              <h3 className="text-white text-base sm:text-lg font-extrabold">{label}</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 text-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {hasSplit ? (
              <>
                {/* Column Headers */}
                <div className="grid grid-cols-2 divide-x divide-[#2A2A2D] border-b border-[#2A2A2D] bg-[#0B0B0C]">
                  <div className="text-center py-2.5 text-[#D4A04D] text-xs sm:text-sm font-extrabold">(−) Negative</div>
                  <div className="text-center py-2.5 text-[#D4A04D] text-xs sm:text-sm font-extrabold">(+) Positive</div>
                </div>

                {/* Two scrollable columns */}
                <div className="grid grid-cols-2 divide-x divide-[#2A2A2D]">
                  <div className="relative">
                    <div ref={negColRef} className="max-h-64 overflow-y-auto scrollbar-none divide-y divide-[#2A2A2D]/60">
                      {negativeOptions.map((opt) => <Row key={opt} opt={opt} />)}
                    </div>
                    <div className="absolute right-0.5 top-1 bottom-1 flex flex-col justify-between">
                      <button type="button" onClick={() => scrollCol(negColRef, 'up')} className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#D4A04D] text-[10px] cursor-pointer">▲</button>
                      <button type="button" onClick={() => scrollCol(negColRef, 'down')} className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#D4A04D] text-[10px] cursor-pointer">▼</button>
                    </div>
                  </div>
                  <div className="relative">
                    <div ref={posColRef} className="max-h-64 overflow-y-auto scrollbar-none divide-y divide-[#2A2A2D]/60">
                      {positiveOptions.map((opt) => <Row key={opt} opt={opt} />)}
                    </div>
                    <div className="absolute right-0.5 top-1 bottom-1 flex flex-col justify-between">
                      <button type="button" onClick={() => scrollCol(posColRef, 'up')} className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#D4A04D] text-[10px] cursor-pointer">▲</button>
                      <button type="button" onClick={() => scrollCol(posColRef, 'down')} className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#D4A04D] text-[10px] cursor-pointer">▼</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative">
                <div ref={singleColRef} className="max-h-72 overflow-y-auto scrollbar-none divide-y divide-[#2A2A2D]/60">
                  {options.map((opt) => <Row key={opt} opt={opt} />)}
                </div>
                <div className="absolute right-0.5 top-1 bottom-1 flex flex-col justify-between">
                  <button type="button" onClick={() => scrollCol(singleColRef, 'up')} className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#D4A04D] text-[10px] cursor-pointer">▲</button>
                  <button type="button" onClick={() => scrollCol(singleColRef, 'down')} className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-[#D4A04D] text-[10px] cursor-pointer">▼</button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end px-5 py-3 border-t border-[#2A2A2D]">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs text-gray-400 hover:text-white font-bold transition-colors cursor-pointer"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
