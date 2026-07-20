import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Combatant } from '../../types';
import { performRechargeRoll } from '../../lib/diceRoller';

export interface RechargeToastContentProps {
  combatant: Combatant;
  unrechargedAbilities: Array<{ name: string; rechargeOn: number; isCharged: boolean }>;
  toastId: string | number;
  onUpdateCombatant: (id: string, updates: Partial<Combatant>) => void;
}

export function RechargeToastContent({
  combatant,
  unrechargedAbilities,
  toastId,
  onUpdateCombatant,
}: RechargeToastContentProps) {
  // Track rolls made in this toast session to prevent multiple retries on the same turn
  const [rolls, setRolls] = useState<Record<string, { rolledNum: number; isSuccess: boolean }>>({});

  const handleRoll = (abilityName: string) => {
    const { rolledNum, isSuccess, updatedAbilities } = performRechargeRoll(
      combatant.rechargeAbilities || [],
      abilityName
    );

    setRolls(prev => ({
      ...prev,
      [abilityName]: { rolledNum, isSuccess }
    }));

    onUpdateCombatant(combatant.id, { rechargeAbilities: updatedAbilities });
  };

  // Auto-close when all un-recharged abilities have been rolled
  useEffect(() => {
    const allRolled = unrechargedAbilities.every(ability => rolls[ability.name] !== undefined);
    if (allRolled && unrechargedAbilities.length > 0) {
      const timer = setTimeout(() => {
        toast.dismiss(toastId);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [rolls, unrechargedAbilities, toastId]);

  return (
    <div className="flex flex-col gap-2 p-1 text-sm text-neutral-900 pointer-events-auto w-full" id={`recharge-toast-${combatant.id}`}>
      <div className="font-semibold text-neutral-900">
        Recharge Roll Reminder: {combatant.name}
      </div>
      <div className="text-xs text-neutral-500 mb-1">
        Roll d6 at start of turn to recharge expended abilities.
      </div>

      <div className="flex flex-col gap-2">
        {unrechargedAbilities.map(ability => {
          const rollResult = rolls[ability.name];
          const elementIdName = ability.name.replace(/\s+/g, '-');
          return (
            <div
              key={ability.name}
              id={`recharge-row-${combatant.id}-${elementIdName}`}
              className="flex items-center justify-between bg-neutral-50 p-2 rounded border border-neutral-100"
            >
              <div className="flex flex-col">
                <span className="font-medium text-xs text-neutral-800">{ability.name}</span>
                <span className="text-[10px] text-neutral-400">Recharges on {ability.rechargeOn}+</span>
              </div>

              {rollResult ? (
                <div className="flex items-center gap-1.5" id={`recharge-result-${combatant.id}-${elementIdName}`}>
                  <span className="text-xs font-mono bg-neutral-200 px-1.5 py-0.5 rounded text-neutral-700">
                    Rolled {rollResult.rolledNum}
                  </span>
                  {rollResult.isSuccess ? (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      Success!
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                      Failed
                    </span>
                  )}
                </div>
              ) : (
                <button
                  id={`roll-recharge-${combatant.id}-${elementIdName}`}
                  onClick={() => handleRoll(ability.name)}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Roll
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-1">
        <button
          id={`dismiss-recharge-${combatant.id}`}
          onClick={() => toast.dismiss(toastId)}
          className="text-xs text-neutral-500 hover:text-neutral-800 px-2 py-1 cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
