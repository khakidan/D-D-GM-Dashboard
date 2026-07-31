import React from 'react';
import { AbilityName } from '../../../lib/abilityFundamentals';
import { AbilityScores, calculateModifier } from '../../../lib/abilityScores';
import { AbilitySelectChips } from './AbilitySelectChips';
import { DamageComponent } from '../../../types';
import { DAMAGE_TYPE_OPTIONS } from '../../../lib/irvOptions';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { compileDamageComponents } from '../../../lib/automation';

export { compileDamageComponents };

interface DamageComponentsBuilderProps {
  idPrefix: string;
  components: DamageComponent[];
  onChange: (val: DamageComponent[]) => void;
  abilityScores: AbilityScores;
}

export function DamageComponentsBuilder({
  idPrefix,
  components,
  onChange,
  abilityScores,
}: DamageComponentsBuilderProps) {
  const [revealedBonusRows, setRevealedBonusRows] = React.useState<Record<string, boolean>>({});

  const handleComponentChange = (index: number, updated: Partial<DamageComponent>) => {
    const newComponents = components.map((comp, idx) => {
      if (idx !== index) {
        // Enforce at most one row carrying bonus/bonusAbility
        if (updated.bonusAbility !== undefined) {
          return {
            ...comp,
            bonusAbility: undefined,
            bonus: undefined,
          };
        }
        return comp;
      }
      return {
        ...comp,
        ...updated,
      };
    });
    onChange(newComponents);
  };

  const handleAddComponent = () => {
    const newRow: DamageComponent = {
      dice: '',
      _key: Math.random().toString(36).substring(2, 9),
    };
    onChange([...components, newRow]);
  };

  const handleRemoveComponent = (index: number) => {
    if (components.length <= 1) return;
    const newComponents = components.filter((_, idx) => idx !== index);
    onChange(newComponents);
  };

  const handleAutoFillBonus = (index: number) => {
    const comp = components[index];
    if (!comp.bonusAbility) return;
    const score = abilityScores[comp.bonusAbility];
    const mod = calculateModifier(score);
    handleComponentChange(index, { bonus: mod, bonusAutoComputed: true });
  };

  const isRowRevealed = (comp: DamageComponent, index: number) => {
    const key = comp._key || String(index);
    return revealedBonusRows[key] || !!comp.bonusAbility || comp.bonus !== undefined;
  };

  return (
    <div className="flex flex-col gap-2 border border-[#e2e8f0] rounded-lg p-2.5 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#8d8db9] uppercase tracking-wider">Damage Components</span>
        <button
          id={`${idPrefix}-add-dmg-component`}
          type="button"
          onClick={handleAddComponent}
          className="flex items-center gap-1 px-2 py-0.5 bg-[#f9f8ff] border border-[#e2e8f0] rounded text-[10px] font-bold text-[#2563eb] hover:border-[#2563eb] hover:bg-[#f3f0ff] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Type
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {components.map((comp, index) => {
          const key = comp._key || String(index);
          const isBonusStale = Boolean(
            comp.bonusAutoComputed &&
            comp.bonusAbility !== undefined &&
            comp.bonus !== calculateModifier(abilityScores[comp.bonusAbility])
          );
          return (
            <div
              key={key}
              id={`${idPrefix}-dmg-row-${index}`}
              data-testid={`${idPrefix}-dmg-row-${index}`}
              className="flex flex-col gap-1.5 p-2 bg-[#f9f8ff] border border-[#e2e8f0] rounded-md"
            >
              <div className="flex items-center gap-1.5">
                {/* Dice */}
                <div className="flex-1 min-w-0">
                  <input
                    id={`${idPrefix}-dice-${index}`}
                    type="text"
                    value={comp.dice || ''}
                    onChange={e => handleComponentChange(index, { dice: e.target.value })}
                    placeholder="e.g. 2d6"
                    className="w-full px-2 py-1 text-xs border border-[#e2e8f0] rounded bg-white text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    aria-label={`Damage dice for row ${index}`}
                  />
                </div>

                {/* Type */}
                <div className="flex-1 min-w-0">
                  <input
                    id={`${idPrefix}-type-${index}`}
                    type="text"
                    list={`dmg-type-datalist-${idPrefix}-${index}`}
                    value={comp.type || ''}
                    onChange={e => handleComponentChange(index, { type: e.target.value })}
                    placeholder="e.g. fire"
                    className="w-full px-2 py-1 text-xs border border-[#e2e8f0] rounded bg-white text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    aria-label={`Damage type for row ${index}`}
                  />
                  <datalist id={`dmg-type-datalist-${idPrefix}-${index}`}>
                    {DAMAGE_TYPE_OPTIONS.map(opt => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>

                {/* Bonus */}
                <div className="w-16">
                  <input
                    id={`${idPrefix}-bonus-${index}`}
                    type="number"
                    value={comp.bonus !== undefined ? comp.bonus : ''}
                    onChange={e => {
                      const val = e.target.value;
                      handleComponentChange(index, { bonus: val !== '' ? parseInt(val) : undefined, bonusAutoComputed: false });
                    }}
                    placeholder="+Dmg"
                    className="w-full px-2 py-1 text-xs border border-[#e2e8f0] rounded bg-white text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    aria-label={`Damage bonus for row ${index}`}
                  />
                </div>

                {/* Toggle Ability picker */}
                <button
                  id={`${idPrefix}-toggle-ability-${index}`}
                  type="button"
                  onClick={() => {
                    setRevealedBonusRows(prev => ({
                      ...prev,
                      [key]: !isRowRevealed(comp, index),
                    }));
                  }}
                  className={cn(
                    "px-1.5 py-1 rounded text-[10px] font-bold uppercase transition-colors whitespace-nowrap",
                    isRowRevealed(comp, index)
                      ? "bg-[#2563eb] text-white"
                      : "bg-white border border-[#e2e8f0] text-[#8d8db9] hover:border-[#2563eb]"
                  )}
                  title="Toggle Ability Bonus Modifier"
                >
                  + Mod
                </button>

                {/* Remove row */}
                {components.length > 1 && (
                  <button
                    id={`${idPrefix}-remove-row-${index}`}
                    type="button"
                    onClick={() => handleRemoveComponent(index)}
                    className="p-1 text-[#ef4444] hover:bg-[#fee2e2] rounded transition-colors whitespace-nowrap"
                    title="Remove damage component"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Revealable Ability Picker & Auto button */}
              {isRowRevealed(comp, index) && (
                <div className="flex flex-col gap-1 pl-1.5 border-l-2 border-[#2563eb] mt-1">
                  <span className="text-[9px] font-semibold text-[#8d8db9] uppercase tracking-wider">
                    Bonus Ability (At most one row total)
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <AbilitySelectChips
                      selected={comp.bonusAbility ? [comp.bonusAbility] : []}
                      onChange={val => {
                        const selectedAbility = val[0];
                        handleComponentChange(index, { bonusAbility: selectedAbility });
                      }}
                      singleSelect={true}
                    />
                    <button
                      id={`${idPrefix}-auto-bonus-${index}`}
                      type="button"
                      disabled={!comp.bonusAbility}
                      onClick={() => handleAutoFillBonus(index)}
                      className={cn(
                        "px-2 py-1 bg-white border rounded text-[10px] uppercase font-bold text-[#8d8db9] hover:border-[#2563eb] disabled:opacity-50 flex items-center gap-1",
                        isBonusStale ? "border-[#f59e0b] text-[#b45309] bg-[#fffbeb]" : "border-[#e2e8f0]"
                      )}
                      aria-label="Auto-fill bonus"
                    >
                      Auto
                      {isBonusStale && (
                        <span
                          data-testid="stale-indicator"
                          className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] inline-block"
                          title="Value is stale — click Auto to refresh"
                        />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
