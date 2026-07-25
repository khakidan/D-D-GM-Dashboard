import React from 'react';

interface ConditionDurationPromptProps {
  pendingCondition: string;
  timerRounds: string;
  onRoundsChange: (value: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
}

export const ConditionDurationPrompt: React.FC<ConditionDurationPromptProps> = ({
  pendingCondition,
  timerRounds,
  onRoundsChange,
  onConfirm,
  onSkip,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onConfirm();
    if (e.key === 'Escape') onSkip();
  };

  return (
    <div className="mt-2 p-2 bg-[#f9f8ff] border border-[#e2e8f0] rounded-xl flex items-center gap-2">
      <span className="text-xs font-bold text-[#8d8db9]">Duration for {pendingCondition}:</span>
      <input
        type="number"
        autoFocus
        min="1"
        placeholder="rounds"
        aria-label={`Duration in rounds for ${pendingCondition}`}
        value={timerRounds}
        onChange={e => onRoundsChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-20 bg-white border border-[#e2e8f0] rounded text-center px-2 py-1 text-xs outline-none focus:border-[#2563eb]"
      />
      <span className="text-[10px] text-[#8d8db9]/60">(optional)</span>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onConfirm}
        className="px-2 py-1 text-[10px] font-bold uppercase bg-[#2563eb] text-white rounded hover:bg-[#567eff]"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="px-2 py-1 text-[10px] font-bold uppercase text-[#8d8db9] hover:bg-[#e2e8f0] rounded"
      >
        Skip
      </button>
    </div>
  );
};
