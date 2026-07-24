import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Combatant } from '../../types';

interface TempAcPopoverProps {
  ac: number;
  tempAcModifier: number | undefined | null;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  isSyncing: boolean;
}

export function TempAcPopover({
  ac,
  tempAcModifier,
  onUpdateCombatant,
  isSyncing,
}: TempAcPopoverProps) {
  const [showTempAcStepper, setShowTempAcStepper] = useState(false);
  const acStepperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTempAcStepper) return;
    function handleClickOutside(event: MouseEvent) {
      if (acStepperRef.current && !acStepperRef.current.contains(event.target as Node)) {
        setShowTempAcStepper(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTempAcStepper]);

  const baseAc = ac;
  const acMod = tempAcModifier || 0;
  const textClass = acMod !== 0 ? 'text-[#2563eb]' : 'text-[#567eff]';

  return (
    <div 
      className={cn("flex items-center gap-1 text-sm font-bold whitespace-nowrap select-none", textClass)}
      onClick={e => e.stopPropagation()}
    >
      <span>(AC {baseAc}</span>
      {showTempAcStepper ? (
        <div 
          ref={acStepperRef}
          className="inline-flex items-center gap-1 bg-white border border-[#cbd5e1] rounded-lg px-1 py-0.5 shadow-sm text-[#0f172a]"
          onClick={e => e.stopPropagation()}
          data-testid="tempac-stepper-container"
        >
          <button
            type="button"
            onClick={() => {
              const currentVal = tempAcModifier || 0;
              onUpdateCombatant({ tempAcModifier: currentVal - 1 });
            }}
            disabled={isSyncing}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 font-bold text-slate-600 disabled:opacity-50 text-sm cursor-pointer select-none"
            aria-label="Decrease Temp AC"
            data-testid="tempac-decrement"
          >
            −
          </button>
          <input
            type="number"
            value={tempAcModifier || 0}
            onChange={e => {
              const val = e.target.value ? parseInt(e.target.value, 10) : 0;
              onUpdateCombatant({ tempAcModifier: val });
            }}
            onFocus={e => e.target.select()}
            disabled={isSyncing}
            className="w-8 h-5 text-center font-bold text-[#2563eb] border border-slate-200 rounded outline-none text-xs bg-slate-50 focus:bg-white focus:border-blue-500 disabled:opacity-50"
            data-testid="tempac-input"
            aria-label="Temp AC"
          />
          <button
            type="button"
            onClick={() => {
              const currentVal = tempAcModifier || 0;
              onUpdateCombatant({ tempAcModifier: currentVal + 1 });
            }}
            disabled={isSyncing}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 font-bold text-slate-600 disabled:opacity-50 text-sm cursor-pointer select-none"
            aria-label="Increase Temp AC"
            data-testid="tempac-increment"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setShowTempAcStepper(false)}
            className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 cursor-pointer"
            data-testid="tempac-done"
          >
            Done
          </button>
        </div>
      ) : (
        acMod !== 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTempAcStepper(true);
            }}
            className="flex items-center justify-center bg-blue-50/80 border border-blue-200 rounded-full px-1.5 py-0.5 text-xs font-bold text-blue-800 hover:bg-blue-100/80 hover:border-blue-300 transition-colors cursor-pointer shrink-0 animate-none h-5 no-blue-hover"
            aria-label={`Temporary AC modifier: ${acMod > 0 ? '+' : ''}${acMod}`}
            data-testid="tempac-pill"
          >
            {acMod > 0 ? `+${acMod}` : acMod}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTempAcStepper(true);
            }}
            className="w-5 h-5 flex items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 opacity-20 group-hover:opacity-100 focus:opacity-100 focus:outline-none transition-all cursor-pointer shrink-0 font-bold text-xs"
            aria-label="Add Temp AC Modifier"
            data-testid="add-tempac-ghost"
          >
            +
          </button>
        )
      )}
      <span>)</span>
    </div>
  );
}
