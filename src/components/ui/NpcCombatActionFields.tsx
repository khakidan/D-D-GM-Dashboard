import React from 'react';
import { DebouncedTextarea } from './DebouncedTextarea';
import { AbilityName } from '../../lib/abilityFundamentals';
import { AbilityScores, calculateModifier } from '../../lib/abilityScores';
import { AbilitySelectChips } from './AbilitySelectChips';

export interface NpcCombatActionFieldsProps {
  idPrefix: string;
  name: string;
  onNameChange: (name: string) => void;
  namePlaceholder: string;
  secondaryField?: React.ReactNode;
  attackBonus: number | undefined;
  onAttackBonusChange: (val: number | undefined) => void;
  damage: string | undefined;
  onDamageChange: (val: string | undefined) => void;
  damagePlaceholder?: string;
  saveDC: number | undefined;
  onSaveDCChange: (val: number | undefined) => void;
  saveType: string | undefined;
  onSaveTypeChange: (val: string | undefined) => void;
  range?: React.ReactNode;
  description: string;
  onDescriptionChange: (description: string) => void;
  descriptionRows: number;
  
  // New props for DC Automation
  abilityScores: AbilityScores;
  proficiencyBonus: number;
  dcAbilities?: AbilityName[];
  onDcAbilitiesChange?: (val: AbilityName[]) => void;

  // Typed props
  recharge?: string;
  onRechargeChange?: (val: string | undefined) => void;
  rangeValue?: string;
  onRangeValueChange?: (val: string | undefined) => void;
  cost?: number;
  onCostChange?: (val: number) => void;
  showUsageTracking?: boolean;
  maxUses?: number;
  onMaxUsesChange?: (val: number | undefined) => void;
  usesReset?: 'short' | 'long' | 'none';
  onUsesResetChange?: (val: 'short' | 'long' | 'none' | undefined) => void;
}

export function NpcCombatActionFields({
  idPrefix,
  name,
  onNameChange,
  namePlaceholder,
  secondaryField,
  attackBonus,
  onAttackBonusChange,
  damage,
  onDamageChange,
  damagePlaceholder = '2d8+5 fire',
  saveDC,
  onSaveDCChange,
  saveType,
  onSaveTypeChange,
  range,
  description,
  onDescriptionChange,
  descriptionRows,
  
  abilityScores,
  proficiencyBonus,
  dcAbilities,
  onDcAbilitiesChange,

  recharge,
  onRechargeChange,
  rangeValue,
  onRangeValueChange,
  cost,
  onCostChange,
  showUsageTracking = false,
  maxUses,
  onMaxUsesChange,
  usesReset,
  onUsesResetChange,
}: NpcCombatActionFieldsProps) {
  const inputClass = "w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm py-1 px-2 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]";
  
  const handleAutoFillDC = () => {
    if (!dcAbilities || dcAbilities.length === 0) return;
    
    const modifierSum = dcAbilities.reduce((sum, ability) => {
      return sum + calculateModifier(abilityScores[ability]);
    }, 0);
    
    const newDC = 8 + proficiencyBonus + modifierSum;
    onSaveDCChange(newDC);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label htmlFor={`${idPrefix}-name`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Name</label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            className={inputClass}
            placeholder={namePlaceholder}
            aria-label={namePlaceholder}
          />
        </div>
        <div>
          {onRechargeChange !== undefined ? (
            <div>
              <label htmlFor={`${idPrefix}-recharge`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Recharge</label>
              <input
                id={`${idPrefix}-recharge`}
                type="text"
                value={recharge || ''}
                onChange={e => onRechargeChange(e.target.value || undefined)}
                className={inputClass}
                placeholder="e.g. Recharge 5–6"
                aria-label="Recharge condition"
              />
            </div>
          ) : onCostChange !== undefined ? (
            <div>
              <label htmlFor={`${idPrefix}-cost`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Cost</label>
              <input
                id={`${idPrefix}-cost`}
                type="number"
                min="1"
                max="3"
                value={cost !== undefined ? cost : 1}
                onChange={e => onCostChange(parseInt(e.target.value) || 1)}
                className={inputClass}
                placeholder="Cost (1-3)"
              />
            </div>
          ) : (
            secondaryField
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label htmlFor={`${idPrefix}-atk`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Atk</label>
          <input
            id={`${idPrefix}-atk`}
            type="number"
            value={attackBonus !== undefined ? attackBonus : ''}
            onChange={e => {
              const val = e.target.value;
              onAttackBonusChange(val !== '' ? parseInt(val) : undefined);
            }}
            className={inputClass}
            placeholder="+N"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-dmg`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Dmg</label>
          <input
            id={`${idPrefix}-dmg`}
            type="text"
            value={damage || ''}
            onChange={e => onDamageChange(e.target.value || undefined)}
            className={inputClass}
            placeholder={damagePlaceholder}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-dc`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">DC</label>
          <div className="flex gap-1">
            <input
              id={`${idPrefix}-dc`}
              type="number"
              value={saveDC !== undefined ? saveDC : ''}
              onChange={e => {
                const val = e.target.value;
                onSaveDCChange(val !== '' ? parseInt(val) : undefined);
              }}
              className={inputClass}
              placeholder="DC"
            />
            {onDcAbilitiesChange && (
              <button
                type="button"
                onClick={handleAutoFillDC}
                disabled={!dcAbilities || dcAbilities.length === 0}
                className="px-2 bg-[#f9f8ff] border border-[#e2e8f0] rounded text-[10px] uppercase font-bold text-[#8d8db9] hover:border-[#2563eb] disabled:opacity-50"
                aria-label="Auto-fill DC"
              >
                Auto
              </button>
            )}
          </div>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-save`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Save</label>
          <input
            id={`${idPrefix}-save`}
            type="text"
            value={saveType || ''}
            onChange={e => onSaveTypeChange(e.target.value || undefined)}
            className={inputClass}
            placeholder="Con"
          />
        </div>
      </div>
      
      {onDcAbilitiesChange && (
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">DC Basis</label>
          <AbilitySelectChips selected={dcAbilities || []} onChange={onDcAbilitiesChange} />
        </div>
      )}

      {showUsageTracking && onMaxUsesChange !== undefined && onUsesResetChange !== undefined && (
        <div className="grid grid-cols-2 gap-2" data-testid="pc-usage-tracking-fields">
          <div>
            <label htmlFor={`${idPrefix}-max-uses`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Max Uses</label>
            <input
              id={`${idPrefix}-max-uses`}
              type="number"
              min="1"
              value={maxUses !== undefined ? maxUses : ''}
              onChange={e => {
                const val = e.target.value;
                onMaxUsesChange(val !== '' ? parseInt(val, 10) : undefined);
              }}
              className={inputClass}
              placeholder="e.g. 1"
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-uses-reset`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Reset</label>
            <select
              id={`${idPrefix}-uses-reset`}
              value={usesReset || 'none'}
              onChange={e => {
                const val = e.target.value as 'short' | 'long' | 'none';
                onUsesResetChange(val !== 'none' ? val : undefined);
              }}
              className={`${inputClass} bg-white h-[30px] py-1 px-2`}
            >
              <option value="none">Manual</option>
              <option value="short">Short Rest</option>
              <option value="long">Long Rest</option>
            </select>
          </div>
        </div>
      )}

      {onRangeValueChange !== undefined ? (
        <div>
          <label htmlFor={`${idPrefix}-range`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Range</label>
          <input
            id={`${idPrefix}-range`}
            type="text"
            value={rangeValue || ''}
            onChange={e => onRangeValueChange(e.target.value || undefined)}
            className={inputClass}
            placeholder="reach 10 ft. / 30 ft. cone"
          />
        </div>
      ) : range ? (
        <div>
          {range}
        </div>
      ) : null}

      <div>
        <DebouncedTextarea
          value={description}
          onChange={onDescriptionChange}
          placeholder="Description"
          rows={descriptionRows}
          className="py-1 px-2 text-sm"
        />
      </div>
    </div>
  );
}
