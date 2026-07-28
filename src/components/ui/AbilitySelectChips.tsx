import React from 'react';
import { AbilityName, abilitiesInOrder } from '../../lib/abilityFundamentals';
import { cn } from '../../lib/utils';

interface Props {
  selected: AbilityName[];
  onChange: (val: AbilityName[]) => void;
  singleSelect?: boolean;
}

export function AbilitySelectChips({ selected, onChange, singleSelect = false }: Props) {
  const toggleAbility = (ability: AbilityName) => {
    let nextSelected: AbilityName[];
    if (singleSelect) {
      nextSelected = selected.includes(ability) ? [] : [ability];
    } else {
      nextSelected = selected.includes(ability)
        ? selected.filter(a => a !== ability)
        : [...selected, ability];
      // Enforce order
      nextSelected.sort((a, b) => abilitiesInOrder.indexOf(a) - abilitiesInOrder.indexOf(b));
    }
    onChange(nextSelected);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {abilitiesInOrder.map(ability => {
        const isSelected = selected.includes(ability);
        return (
          <button
            key={ability}
            id={ability}
            onClick={() => toggleAbility(ability)}
            type="button"
            className={cn(
              "px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded border transition-colors",
              isSelected
                ? "bg-[#2563eb] text-white border-[#2563eb]"
                : "bg-[#f9f8ff] border-[#e2e8f0] text-[#8d8db9] hover:border-[#2563eb]"
            )}
          >
            {ability}
          </button>
        );
      })}
    </div>
  );
}
