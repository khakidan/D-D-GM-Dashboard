import React, { useState, useRef, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Combatant } from '../../types';

interface TempHpPopoverProps {
  tempHp: number | undefined | null;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  isSyncing: boolean;
}

export function TempHpPopover({
  tempHp,
  onUpdateCombatant,
  isSyncing,
}: TempHpPopoverProps) {
  const [showTempHpStepper, setShowTempHpStepper] = useState(false);
  const stepperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTempHpStepper) return;
    function handleClickOutside(event: MouseEvent) {
      if (stepperRef.current && !stepperRef.current.contains(event.target as Node)) {
        setShowTempHpStepper(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTempHpStepper]);

  return (
    <>
      {showTempHpStepper ? (
        <div 
          ref={stepperRef}
          className="flex items-center gap-1 bg-white border border-[#cbd5e1] rounded-lg px-1.5 py-0.5 shadow-sm shrink-0"
          onClick={e => e.stopPropagation()}
          data-testid="temphp-stepper-container"
        >
          <button
            type="button"
            onClick={() => {
              const currentVal = tempHp || 0;
              onUpdateCombatant({ tempHp: Math.max(0, currentVal - 1) });
            }}
            disabled={isSyncing}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 font-bold text-slate-600 disabled:opacity-50 text-sm cursor-pointer select-none"
            aria-label="Decrease Temp HP"
            data-testid="temphp-decrement"
          >
            −
          </button>
          <input
            type="number"
            value={tempHp || 0}
            onChange={e => {
              const val = e.target.value ? parseInt(e.target.value, 10) : 0;
              onUpdateCombatant({ tempHp: Math.max(0, val) });
            }}
            onFocus={e => e.target.select()}
            disabled={isSyncing}
            className="w-9 h-6 text-center font-bold text-[#2563eb] border border-slate-200 rounded outline-none text-xs bg-slate-50 focus:bg-white focus:border-blue-500 disabled:opacity-50"
            data-testid="temphp-input"
            aria-label="Temp HP"
          />
          <button
            type="button"
            onClick={() => {
              const currentVal = tempHp || 0;
              onUpdateCombatant({ tempHp: currentVal + 1 });
            }}
            disabled={isSyncing}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 font-bold text-slate-600 disabled:opacity-50 text-sm cursor-pointer select-none"
            aria-label="Increase Temp HP"
            data-testid="temphp-increment"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setShowTempHpStepper(false)}
            className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 cursor-pointer"
            data-testid="temphp-done"
          >
            Done
          </button>
        </div>
      ) : (
        tempHp && tempHp > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTempHpStepper(true);
            }}
            className="flex items-center gap-1 bg-blue-50/80 border border-blue-200 rounded-full px-2 py-0.5 text-xs font-semibold text-blue-800 hover:bg-blue-100/80 hover:border-blue-300 transition-colors cursor-pointer shrink-0 animate-none no-blue-hover"
            aria-label={`Temporary HP: ${tempHp}`}
            data-testid="temphp-pill"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
            <span>{tempHp}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTempHpStepper(true);
            }}
            className="w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 opacity-20 group-hover:opacity-100 focus:opacity-100 focus:outline-none transition-all cursor-pointer shrink-0 font-bold"
            aria-label="Add Temp HP"
            data-testid="add-temphp-ghost"
          >
            +
          </button>
        )
      )}
    </>
  );
}
