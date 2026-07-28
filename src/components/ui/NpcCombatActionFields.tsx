import React from 'react';
import { DebouncedTextarea } from './DebouncedTextarea';
import { AbilityName } from '../../lib/abilityFundamentals';
import { AbilityScores, calculateModifier } from '../../lib/abilityScores';
import { AbilitySelectChips } from './AbilitySelectChips';
import { DamageComponent } from '../../types';
import { DamageComponentsBuilder } from './DamageComponentsBuilder';
import { compileDamageComponents } from '../../lib/automation';
import { cn } from '../../lib/utils';

export interface NpcCombatActionFieldsProps {
  idPrefix: string;
  name: string;
  onNameChange: (name: string) => void;
  namePlaceholder: string;
  secondaryField?: React.ReactNode;
  attackBonus: number | undefined;
  onAttackBonusChange: (val: number | undefined, isAutoComputed?: boolean) => void;
  damage: string | undefined;
  onDamageChange: (val: string | undefined) => void;
  damagePlaceholder?: string;
  saveDC: number | undefined;
  onSaveDCChange: (val: number | undefined, isAutoComputed?: boolean) => void;
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
  dcAutoComputed?: boolean;

  // New props for Atk Automation
  atkAbility?: AbilityName;
  onAtkAbilityChange?: (val: AbilityName | undefined) => void;
  atkAutoComputed?: boolean;

  // New props for Dmg Automation
  damageComponents?: DamageComponent[];
  onDamageComponentsChange?: (val: DamageComponent[] | undefined) => void;

  // Typed props
  recharge?: string;
  onRechargeChange?: (val: string | undefined) => void;
  rangeValue?: string;
  onRangeValueChange?: (val: string | undefined) => void;
  cost?: number;
  onCostChange?: (val: number) => void;
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
  dcAutoComputed,

  atkAbility,
  onAtkAbilityChange,
  atkAutoComputed,

  damageComponents,
  onDamageComponentsChange,

  recharge,
  onRechargeChange,
  rangeValue,
  onRangeValueChange,
  cost,
  onCostChange,
}: NpcCombatActionFieldsProps) {
  const inputClass = "w-full bg-[#ffffff] border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm py-1 px-2 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]";
  
  const [isStructuredMode, setIsStructuredMode] = React.useState(!!damageComponents && damageComponents.length > 0);

  React.useEffect(() => {
    if (damageComponents && damageComponents.length > 0) {
      setIsStructuredMode(true);
    }
  }, [damageComponents]);

  const isDcStale = Boolean(
    dcAutoComputed &&
    dcAbilities &&
    dcAbilities.length > 0 &&
    saveDC !== (8 + proficiencyBonus + dcAbilities.reduce((sum, a) => sum + calculateModifier(abilityScores[a]), 0))
  );

  const isAtkStale = Boolean(
    atkAutoComputed &&
    atkAbility !== undefined &&
    attackBonus !== (proficiencyBonus + calculateModifier(abilityScores[atkAbility]))
  );
  
  const handleAutoFillDC = () => {
    if (!dcAbilities || dcAbilities.length === 0) return;
    
    const modifierSum = dcAbilities.reduce((sum, ability) => {
      return sum + calculateModifier(abilityScores[ability]);
    }, 0);
    
    const newDC = 8 + proficiencyBonus + modifierSum;
    onSaveDCChange(newDC, true);
  };

  const handleAutoFillAtk = () => {
    if (atkAbility === undefined) return;
    const modifier = calculateModifier(abilityScores[atkAbility]);
    const newAtk = proficiencyBonus + modifier;
    if (onAttackBonusChange) onAttackBonusChange(newAtk, true);
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
          <div className="flex gap-1">
            <input
              id={`${idPrefix}-atk`}
              type="number"
              value={attackBonus !== undefined ? attackBonus : ''}
              onChange={e => {
                const val = e.target.value;
                if (onAttackBonusChange) onAttackBonusChange(val !== '' ? parseInt(val) : undefined, false);
              }}
              className={inputClass}
              placeholder="+N"
            />
            {onAtkAbilityChange && (
              <button
                type="button"
                onClick={handleAutoFillAtk}
                disabled={atkAbility === undefined}
                className={cn(
                  "px-2 bg-[#f9f8ff] border rounded text-[10px] uppercase font-bold text-[#8d8db9] hover:border-[#2563eb] disabled:opacity-50 flex items-center gap-1",
                  isAtkStale ? "border-[#f59e0b] text-[#b45309] bg-[#fffbeb]" : "border-[#e2e8f0]"
                )}
                aria-label="Auto-fill Atk"
              >
                Auto
                {isAtkStale && (
                  <span
                    data-testid="stale-indicator"
                    className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] inline-block"
                    title="Value is stale — click Auto to refresh"
                  />
                )}
              </button>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between px-1">
            <label htmlFor={`${idPrefix}-dmg`} className="block text-[10px] font-semibold text-[#8d8db9] uppercase">Dmg</label>
            {onDamageComponentsChange && (
              <button
                type="button"
                onClick={() => {
                  if (isStructuredMode) {
                    onDamageComponentsChange(undefined);
                    setIsStructuredMode(false);
                  } else {
                    const initialRow = { dice: damage || '', _key: Math.random().toString(36).substring(2, 9) };
                    onDamageComponentsChange([initialRow]);
                    setIsStructuredMode(true);
                  }
                }}
                className="text-[9px] text-[#2563eb] font-bold uppercase hover:underline"
                aria-label="Toggle damage builder"
              >
                {isStructuredMode ? "Text" : "Build"}
              </button>
            )}
          </div>
          <input
            id={`${idPrefix}-dmg`}
            type="text"
            value={damage || ''}
            onChange={e => onDamageChange(e.target.value || undefined)}
            className={inputClass}
            placeholder={damagePlaceholder}
            disabled={isStructuredMode}
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
                onSaveDCChange(val !== '' ? parseInt(val) : undefined, false);
              }}
              className={inputClass}
              placeholder="DC"
            />
            {onDcAbilitiesChange && (
              <button
                type="button"
                onClick={handleAutoFillDC}
                disabled={!dcAbilities || dcAbilities.length === 0}
                className={cn(
                  "px-2 bg-[#f9f8ff] border rounded text-[10px] uppercase font-bold text-[#8d8db9] hover:border-[#2563eb] disabled:opacity-50 flex items-center gap-1",
                  isDcStale ? "border-[#f59e0b] text-[#b45309] bg-[#fffbeb]" : "border-[#e2e8f0]"
                )}
                aria-label="Auto-fill DC"
              >
                Auto
                {isDcStale && (
                  <span
                    data-testid="stale-indicator"
                    className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] inline-block"
                    title="Value is stale — click Auto to refresh"
                  />
                )}
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

      {isStructuredMode && onDamageComponentsChange && damageComponents && (
        <DamageComponentsBuilder
          idPrefix={idPrefix}
          components={damageComponents}
          onChange={(newComponents) => {
            onDamageComponentsChange(newComponents);
          }}
          abilityScores={abilityScores}
        />
      )}
      
      {onAtkAbilityChange && (
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">Atk Basis</label>
          <AbilitySelectChips
            selected={atkAbility ? [atkAbility] : []}
            onChange={val => onAtkAbilityChange(val[0])}
            singleSelect
          />
        </div>
      )}

      {onDcAbilitiesChange && (
        <div>
          <label className="block text-[10px] font-semibold text-[#8d8db9] uppercase px-1">DC Basis</label>
          <AbilitySelectChips selected={dcAbilities || []} onChange={onDcAbilitiesChange} />
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
