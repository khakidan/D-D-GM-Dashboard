import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { StatBlock } from '../ui/StatBlock';
import { Tabs } from './Tabs';
import { NpcListEditor } from './NpcListEditor';
import { NpcIdentityTab } from './NpcIdentityTab';
import { NpcCombatTab } from './NpcCombatTab';
import { NpcAbilitiesTab } from './NpcAbilitiesTab';
import { NpcStatBlockTab } from './NpcStatBlockTab';
import { NpcSimpleFieldEditor } from './NpcSimpleFieldEditor';
import { NpcCombatActionFields } from './NpcCombatActionFields';
import {
  parseAbilityScores,
  parseProficiencies,
  serializeAbilityScores,
  serializeProficiencies,
  DEFAULT_ABILITY_SCORES,
  DEFAULT_PROFICIENCIES,
} from '../../lib/abilityScores';
import { useNpcCrAutomation } from '../../hooks/useNpcCrAutomation';
import type { NpcTrait, NpcAction, NpcReaction, NpcLegendaryAction } from '../../types';

export interface NpcFormData {
  name: string;
  ac: string | number;
  maxHp: string | number;
  notes: string;
  resistances: string;
  immunities: string;
  vulnerabilities: string;
  legendaryActions: number;
  legendaryResistances: number;
  abilityScores: string;
  proficiencies: string;
  speed: string;
  senses: string;
  languages: string;
  challengeRating: string;
  traits?: string;
  actions?: string;
  reactions?: string;
  legendaryActionsList?: string;
}

export const DEFAULT_NPC_FORM_DATA: NpcFormData = {
  name: '',
  ac: 10,
  maxHp: 10,
  notes: '',
  resistances: '',
  immunities: '',
  vulnerabilities: '',
  legendaryActions: 0,
  legendaryResistances: 0,
  abilityScores: serializeAbilityScores(DEFAULT_ABILITY_SCORES),
  proficiencies: serializeProficiencies(DEFAULT_PROFICIENCIES),
  speed: '',
  senses: '',
  languages: '',
  challengeRating: '',
  traits: '[]',
  actions: '[]',
  reactions: '[]',
  legendaryActionsList: '[]',
};



interface NpcFormFieldsProps {
  data: NpcFormData;
  onChange: (data: NpcFormData) => void;
  errors?: Partial<Record<keyof NpcFormData | string, string>>;
  compact?: boolean;
}

export function NpcFormFields({ data, onChange, errors = {}, compact = false }: NpcFormFieldsProps) {
  const handleChange = <K extends keyof NpcFormData>(key: K, value: NpcFormData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleTraitsChange = (updated: NpcTrait[]) => {
    onChange({
      ...data,
      traits: JSON.stringify(updated),
    });
  };

  const handleActionsChange = (updated: NpcAction[]) => {
    onChange({
      ...data,
      actions: JSON.stringify(updated),
    });
  };

  const handleReactionsChange = (updated: NpcReaction[]) => {
    onChange({
      ...data,
      reactions: JSON.stringify(updated),
    });
  };

  const handleLegendaryActionsListChange = (updated: NpcLegendaryAction[]) => {
    onChange({
      ...data,
      legendaryActionsList: JSON.stringify(updated),
    });
  };
  
  const parsedAbilityScores = 
    parseAbilityScores(
      data.abilityScores ?? 
      serializeAbilityScores(
        DEFAULT_ABILITY_SCORES));
  const parsedProficiencies = 
    parseProficiencies(
      data.proficiencies ?? 
      serializeProficiencies(
        DEFAULT_PROFICIENCIES));

  const traits = React.useMemo(() => {
    try {
      const parsed = JSON.parse(data.traits || '[]');
      return Array.isArray(parsed) ? (parsed as NpcTrait[]) : [];
    } catch {
      return [] as NpcTrait[];
    }
  }, [data.traits]);

  const actions = React.useMemo(() => {
    try {
      const parsed = JSON.parse(data.actions || '[]');
      return Array.isArray(parsed) ? (parsed as NpcAction[]) : [];
    } catch {
      return [] as NpcAction[];
    }
  }, [data.actions]);

  const reactions = React.useMemo(() => {
    try {
      const parsed = JSON.parse(data.reactions || '[]');
      return Array.isArray(parsed) ? (parsed as NpcReaction[]) : [];
    } catch {
      return [] as NpcReaction[];
    }
  }, [data.reactions]);

  const legendaryActionsList = React.useMemo(() => {
    try {
      const parsed = JSON.parse(data.legendaryActionsList || '[]');
      return Array.isArray(parsed) ? (parsed as NpcLegendaryAction[]) : [];
    } catch {
      return [] as NpcLegendaryAction[];
    }
  }, [data.legendaryActionsList]);

  const labelClass = cn(
    "block font-bold uppercase tracking-widest text-[#8d8db9] mb-1.5 px-1",
    compact ? "text-[10px]" : "text-xs"
  );
  
  const inputClass = cn(
    "w-full bg-white border border-[#e2e8f0] rounded-xl outline-none transition-all font-serif italic text-sm",
    compact ? "px-2 py-1.5" : "px-4 py-3",
    "focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
  );

  useNpcCrAutomation({
    challengeRating: data.challengeRating,
    proficiencies: data.proficiencies,
    onChange: (updatedProficiencies) => handleChange('proficiencies', updatedProficiencies),
  });

  const [activeTab, setActiveTab] =
    useState<'identity'|'combat'|'abilities'|'statblock'>('identity');

  return (
    <div className="space-y-0">
      <Tabs
        tabs={[
          { id: 'identity', label: 'Identity' },
          { id: 'combat', label: 'Combat' },
          { id: 'abilities', label: 'Abilities' },
          { id: 'statblock', label: 'Stat Block' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as 'identity' | 'combat' | 'abilities' | 'statblock')}
        className="mb-4"
      />

      {activeTab === 'identity' && (
        <NpcIdentityTab
          data={data}
          handleChange={handleChange}
          labelClass={labelClass}
          inputClass={inputClass}
          compact={compact}
        />
      )}

      {activeTab === 'combat' && (
        <NpcCombatTab
          data={data}
          handleChange={handleChange}
          labelClass={labelClass}
          inputClass={inputClass}
          compact={compact}
        />
      )}

      {activeTab === 'abilities' && (
        <NpcAbilitiesTab
          data={data}
          onChange={onChange}
          parsedAbilityScores={parsedAbilityScores}
          parsedProficiencies={parsedProficiencies}
          compact={compact}
        />
      )}

      {activeTab === 'statblock' && (
        <NpcStatBlockTab
          traits={traits}
          actions={actions}
          reactions={reactions}
          legendaryActionsList={legendaryActionsList}
          onTraitsChange={handleTraitsChange}
          onActionsChange={handleActionsChange}
          onReactionsChange={handleReactionsChange}
          onLegendaryActionsChange={handleLegendaryActionsListChange}
          compact={compact}
        />
      )}
    </div>
  );
}
