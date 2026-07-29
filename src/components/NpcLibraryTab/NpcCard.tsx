import React from 'react';
import { NPC, NpcTrait, NpcAction, NpcReaction, NpcLegendaryAction } from '../../types';
import { Trash2, Zap, Shield as ShieldIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CardShell } from '../ui/CardShell';
import { DebouncedInput } from '../ui/DebouncedInput';
import { CardNumberInput } from '../ui/CardNumberInput';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';
import { NpcListEditor } from '../ui/NpcListEditor';
import { Button } from '../ui/Button';
import { ExpandableContent } from '../ui/ExpandableContent';
import { LabeledField } from '../ui/LabeledField';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { createNpcListRenderers } from '../ui/npcListFieldRenderers';

// Modular Sub-components
import { NpcCardHeader } from './NpcCardHeader';
import { IrvSection } from '../ui/IrvSection';
import { NpcLegendarySection } from './NpcLegendarySection';
import { StatBlockScoresTable } from '../ui/StatBlockScoresTable';
import { StatBlockSaves } from '../ui/StatBlockSaves';
import { StatBlockPassive } from '../ui/StatBlockPassive';
import { StatBlockSkills } from '../ui/StatBlockSkills';
import { SpellcastingStatsRow } from '../ui/SpellcastingStatsRow';
import { serializeSpellcastingAbility } from '../../lib/spellcasting';
import { toast } from 'sonner';
import { findStaleAutomatedValues, recalculateAutomatedValues } from '../../lib/automation';
import {
  parseAbilityScores,
  parseProficiencies,
  serializeAbilityScores,
  serializeProficiencies,
  proficiencyBonusFromCR,
  syncProficiencyBonusToCR,
  AbilityScores,
  AbilityName,
  SkillName,
} from '../../lib/abilityScores';

export interface NpcCardProps {
  npc: NPC;
  isSyncing: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<NPC>) => void;
  onDelete: () => void;
}

export const NpcCard: React.FC<NpcCardProps> = React.memo(function NpcCard({
  npc, isSyncing, isExpanded, onToggleExpand, onUpdate, onDelete
}) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const parsedProfs = parseProficiencies(npc.proficiencies || '');
  const parsedScores = parseAbilityScores(npc.abilityScores || '');

  const traits = React.useMemo(() => {
    try {
      const parsed = JSON.parse(npc.traits || '[]');
      return Array.isArray(parsed) ? (parsed as NpcTrait[]) : [];
    } catch {
      return [] as NpcTrait[];
    }
  }, [npc.traits]);

  const actions = React.useMemo(() => {
    try {
      const parsed = JSON.parse(npc.actions || '[]');
      return Array.isArray(parsed) ? (parsed as NpcAction[]) : [];
    } catch {
      return [] as NpcAction[];
    }
  }, [npc.actions]);

  const reactions = React.useMemo(() => {
    try {
      const parsed = JSON.parse(npc.reactions || '[]');
      return Array.isArray(parsed) ? (parsed as NpcReaction[]) : [];
    } catch {
      return [] as NpcReaction[];
    }
  }, [npc.reactions]);

  const bonusActions = React.useMemo(() => {
    try {
      const parsed = JSON.parse(npc.bonusActions || '[]');
      return Array.isArray(parsed) ? (parsed as NpcAction[]) : [];
    } catch {
      return [] as NpcAction[];
    }
  }, [npc.bonusActions]);

  const legendaryActions = React.useMemo(() => {
    try {
      const parsed = JSON.parse(npc.legendaryActionsList || '[]');
      return Array.isArray(parsed) ? (parsed as NpcLegendaryAction[]) : [];
    } catch {
      return [] as NpcLegendaryAction[];
    }
  }, [npc.legendaryActionsList]);

  const {
    renderTraitFields,
    renderActionFields,
    renderReactionFields,
    renderBonusActionFields,
    renderLegendaryActionFields,
  } = React.useMemo(() => createNpcListRenderers(
    'npc-card', 
    parsedScores, 
    proficiencyBonusFromCR(npc.challengeRating)
  ), [parsedScores, npc.challengeRating]);

  const handleCrChange = (v: string) => {
    const crVal = v;
    const newProfBonus = proficiencyBonusFromCR(crVal);
    if (npc.autoRefreshMechanics) {
      const updatedProfs = syncProficiencyBonusToCR(npc.proficiencies, crVal);
      onUpdate({
        challengeRating: crVal,
        proficiencies: updatedProfs,
        actions: JSON.stringify(recalculateAutomatedValues(actions, parsedScores, newProfBonus)),
        reactions: JSON.stringify(recalculateAutomatedValues(reactions, parsedScores, newProfBonus)),
        bonusActions: JSON.stringify(recalculateAutomatedValues(bonusActions, parsedScores, newProfBonus)),
        legendaryActionsList: JSON.stringify(recalculateAutomatedValues(legendaryActions, parsedScores, newProfBonus)),
      });
    } else {
      const updatedProfs = syncProficiencyBonusToCR(npc.proficiencies, crVal);
      onUpdate({
        challengeRating: crVal,
        proficiencies: updatedProfs,
      });
      const staleCount =
        findStaleAutomatedValues(actions, parsedScores, newProfBonus) +
        findStaleAutomatedValues(reactions, parsedScores, newProfBonus) +
        findStaleAutomatedValues(bonusActions, parsedScores, newProfBonus) +
        findStaleAutomatedValues(legendaryActions, parsedScores, newProfBonus);
      if (staleCount > 0) {
        toast(`${staleCount} action value${staleCount === 1 ? ' is' : 's are'} out of date.`, {
          action: {
            label: 'Recalculate',
            onClick: () => {
              onUpdate({
                actions: JSON.stringify(recalculateAutomatedValues(actions, parsedScores, newProfBonus)),
                reactions: JSON.stringify(recalculateAutomatedValues(reactions, parsedScores, newProfBonus)),
                bonusActions: JSON.stringify(recalculateAutomatedValues(bonusActions, parsedScores, newProfBonus)),
                legendaryActionsList: JSON.stringify(recalculateAutomatedValues(legendaryActions, parsedScores, newProfBonus)),
              });
            },
          },
        });
      }
    }
  };

  const handleStatBlockChange = (scores: AbilityScores, profs: any) => {
    const profBonus = proficiencyBonusFromCR(npc.challengeRating);
    if (npc.autoRefreshMechanics) {
      onUpdate({
        abilityScores: serializeAbilityScores(scores),
        proficiencies: serializeProficiencies(profs),
        actions: JSON.stringify(recalculateAutomatedValues(actions, scores, profBonus)),
        reactions: JSON.stringify(recalculateAutomatedValues(reactions, scores, profBonus)),
        bonusActions: JSON.stringify(recalculateAutomatedValues(bonusActions, scores, profBonus)),
        legendaryActionsList: JSON.stringify(recalculateAutomatedValues(legendaryActions, scores, profBonus)),
      });
    } else {
      onUpdate({
        abilityScores: serializeAbilityScores(scores),
        proficiencies: serializeProficiencies(profs),
      });
      const staleCount =
        findStaleAutomatedValues(actions, scores, profBonus) +
        findStaleAutomatedValues(reactions, scores, profBonus) +
        findStaleAutomatedValues(bonusActions, scores, profBonus) +
        findStaleAutomatedValues(legendaryActions, scores, profBonus);
      if (staleCount > 0) {
        toast(`${staleCount} action value${staleCount === 1 ? ' is' : 's are'} out of date.`, {
          action: {
            label: 'Recalculate',
            onClick: () => {
              onUpdate({
                actions: JSON.stringify(recalculateAutomatedValues(actions, scores, profBonus)),
                reactions: JSON.stringify(recalculateAutomatedValues(reactions, scores, profBonus)),
                bonusActions: JSON.stringify(recalculateAutomatedValues(bonusActions, scores, profBonus)),
                legendaryActionsList: JSON.stringify(recalculateAutomatedValues(legendaryActions, scores, profBonus)),
              });
            },
          },
        });
      }
    }
  };

  const handleAbilityChange = (ability: AbilityName, value: number) => {
    handleStatBlockChange(
      { ...parsedScores, [ability]: value },
      parsedProfs
    );
  };

  const handleSavingThrowToggle = (ability: AbilityName) => {
    const isProf = parsedProfs.savingThrows.includes(ability);
    handleStatBlockChange(parsedScores, {
      ...parsedProfs,
      savingThrows: isProf
        ? parsedProfs.savingThrows.filter((a) => a !== ability)
        : [...parsedProfs.savingThrows, ability],
    });
  };

  const handlePassiveBonusChange = (key: 'perception' | 'insight' | 'investigation', valueStr: string) => {
    const val = parseInt(valueStr, 10);
    handleStatBlockChange(parsedScores, {
      ...parsedProfs,
      passiveBonuses: {
        ...parsedProfs.passiveBonuses,
        [key]: isNaN(val) ? 0 : Math.max(-10, Math.min(10, val)),
      },
    });
  };

  const handleSkillCycle = (skill: SkillName) => {
    const currentProf = parsedProfs.skills[skill] ?? 'none';
    const nextProf = currentProf === 'none' ? 'proficient' : currentProf === 'proficient' ? 'expertise' : 'none';
    const updatedSkills = { ...parsedProfs.skills };
    if (nextProf === 'none') delete updatedSkills[skill];
    else updatedSkills[skill] = nextProf;
    handleStatBlockChange(parsedScores, {
      ...parsedProfs,
      skills: updatedSkills,
    });
  };

  const handleSkillToggle = (skill: SkillName) => {
    const currentProf = parsedProfs.skills[skill] ?? 'none';
    const nextProf = currentProf === 'none' ? 'proficient' : 'none';
    const updatedSkills = { ...parsedProfs.skills };
    if (nextProf === 'none') delete updatedSkills[skill];
    else updatedSkills[skill] = nextProf;
    handleStatBlockChange(parsedScores, {
      ...parsedProfs,
      skills: updatedSkills,
    });
  };

  const handleSkillChange = (skill: SkillName, value: 'none' | 'proficient' | 'expertise') => {
    const updatedSkills = { ...parsedProfs.skills };
    if (value === 'none') {
      delete updatedSkills[skill];
    } else {
      updatedSkills[skill] = value;
    }
    handleStatBlockChange(parsedScores, {
      ...parsedProfs,
      skills: updatedSkills,
    });
  };

  const handleJackOfAllTradesToggle = () => {
    handleStatBlockChange(parsedScores, {
      ...parsedProfs,
      jackOfAllTrades: !parsedProfs.jackOfAllTrades,
    });
  };

  return (
    <CardShell
      syncing={isSyncing}
      className={cn(
        "flex flex-col relative group",
        isExpanded ? "border-[#2563eb]/40" : "hover:border-[#2563eb]/20"
      )}
    >

      <NpcCardHeader
        name={npc.name} 
        ac={npc.ac} 
        maxHp={npc.maxHp}
        challengeRating={npc.challengeRating}
        isExpanded={isExpanded} 
        onToggleExpand={onToggleExpand} 
        isSyncing={isSyncing}
        onUpdateName={(val) => onUpdate({ name: val })}
      />

      {!isExpanded && (npc.spellcastingAbility || (npc.legendaryActions ?? 0) > 0 || (npc.legendaryResistances ?? 0) > 0) && (
        <div className="px-6 pb-3 -mt-1 flex flex-wrap items-center gap-x-4 gap-y-1" id={`collapsed-indicators-${npc.id}`}>
          {npc.spellcastingAbility && (
            <SpellcastingStatsRow
              abilityScores={parsedScores}
              profBonus={proficiencyBonusFromCR(npc.challengeRating)}
              className={undefined}
              overrideAbility={parsedProfs.spellcastingAbility}
            />
          )}
          {(npc.legendaryActions ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8d8db9]">
              <Zap className="w-3 h-3 text-amber-500" />
              {npc.legendaryActions} Legendary Actions
            </div>
          )}
          {(npc.legendaryResistances ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8d8db9]">
              <ShieldIcon className="w-3 h-3 text-blue-500" />
              {npc.legendaryResistances} Legendary Resistances
            </div>
          )}
        </div>
      )}

      <ExpandableContent isExpanded={isExpanded}>
        <div className="p-6 flex flex-col gap-6 font-sans">
          {/* Compact Stat Row */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] font-sans -mt-2">
            {/* Left Side: Plain Text Proficiency */}
            <div className="text-xs font-bold text-[#8d8db9] uppercase tracking-wider">
              PROF +{proficiencyBonusFromCR(npc.challengeRating)}
            </div>

            {/* Right Side: Grouped inputs: CR [box], AC [box], MAX HP [box] */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* CR */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#8d8db9] uppercase tracking-wider">CR</span>
                <DebouncedInput
                  type="text"
                  value={npc.challengeRating || ''}
                  onFocus={(e) => (e.target as HTMLInputElement).select()}
                  onChange={(v) => handleCrChange(v as string)}
                  className="w-12 text-xs font-bold text-[#0f172a] text-center bg-[#f9f8ff] border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded py-1 px-0.5 outline-none transition-all disabled:opacity-50"
                  placeholder="—"
                  disabled={isSyncing}
                />
              </div>

              {/* AC */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#8d8db9] uppercase tracking-wider">AC</span>
                <CardNumberInput
                  value={npc.ac || 0}
                  onChange={v => onUpdate({ ac: v })}
                  fallback={0}
                  min={0}
                  className="w-11 text-xs font-bold text-[#0f172a] text-center bg-[#f9f8ff] border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded py-1 px-0.5 outline-none transition-all disabled:opacity-50"
                  disabled={isSyncing}
                />
              </div>

              {/* MAX HP */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#8d8db9] uppercase tracking-wider">MAX HP</span>
                <CardNumberInput
                  value={npc.maxHp || 1}
                  onChange={v => onUpdate({ maxHp: v })}
                  fallback={1}
                  min={1}
                  className="w-12 text-xs font-bold text-[#0f172a] text-center bg-[#f9f8ff] border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded py-1 px-0.5 outline-none transition-all disabled:opacity-50"
                  disabled={isSyncing}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <StatBlockScoresTable
              abilityScores={parsedScores}
              onScoreChange={handleAbilityChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e2e8f0]/40">
              {/* Left Column: Saves + Skills */}
              <div className="space-y-6">
                <StatBlockSaves
                  abilityScores={parsedScores}
                  savingThrows={parsedProfs.savingThrows}
                  effectiveProfBonus={proficiencyBonusFromCR(npc.challengeRating)}
                  readOnly={false}
                  onToggle={handleSavingThrowToggle}
                />
                <StatBlockSkills
                  abilityScores={parsedScores}
                  skills={parsedProfs.skills}
                  jackOfAllTrades={parsedProfs.jackOfAllTrades}
                  effectiveProfBonus={proficiencyBonusFromCR(npc.challengeRating)}
                  readOnly={false}
                  onSkillCycle={handleSkillCycle}
                  onSkillToggle={handleSkillToggle}
                  onSkillChange={handleSkillChange}
                  onJackOfAllTradesToggle={handleJackOfAllTradesToggle}
                />
              </div>

              {/* Right Column: Passive + Spellcasting + Speed + Senses + Languages */}
              <div className="space-y-6">
                <StatBlockPassive
                  abilityScores={parsedScores}
                  proficiencies={parsedProfs}
                  effectiveProfBonus={proficiencyBonusFromCR(npc.challengeRating)}
                  readOnly={false}
                  onPassiveBonusChange={handlePassiveBonusChange}
                />

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Spellcasting
                  </div>
                  <SpellcastingStatsRow
                    abilityScores={parsedScores}
                    profBonus={proficiencyBonusFromCR(npc.challengeRating)}
                    className={undefined}
                    overrideAbility={parsedProfs.spellcastingAbility}
                    onOverrideChange={(ability) => {
                      const updated = { ...parsedProfs };
                      if (ability === undefined) {
                        delete updated.spellcastingAbility;
                      } else {
                        updated.spellcastingAbility = ability;
                      }
                      onUpdate({
                        proficiencies: serializeProficiencies(updated),
                        spellcastingAbility: serializeSpellcastingAbility(ability),
                      });
                    }}
                  />
                </div>

                <LabeledField label="Speed">
                  <DebouncedInput type="text" value={npc.speed || ''} onChange={(v) => onUpdate({ speed: v as string })} placeholder="e.g. 30 ft., fly 60 ft." className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled={isSyncing} />
                </LabeledField>

                <LabeledField label="Senses">
                  <DebouncedInput type="text" value={npc.senses || ''} onChange={(v) => onUpdate({ senses: v as string })} placeholder="e.g. darkvision 60 ft." className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled={isSyncing} />
                </LabeledField>

                <LabeledField label="Languages">
                  <DebouncedInput type="text" value={npc.languages || ''} onChange={(v) => onUpdate({ languages: v as string })} placeholder="e.g. Common" className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled={isSyncing} />
                </LabeledField>
              </div>
            </div>
          </div>

          <IrvSection
            resistances={npc.resistances || ''}
            immunities={npc.immunities || ''}
            vulnerabilities={npc.vulnerabilities || ''}
            onUpdate={onUpdate}
            labels={{
              resistances: 'Resists',
              immunities: 'Immune',
              vulnerabilities: 'Vuln',
            }}
            placeholders={{
              resistances: 'None',
              immunities: 'None',
              vulnerabilities: 'None',
            }}
            gap="gap-3"
          />

          <LabeledField label="Notes">
            <DebouncedTextarea value={npc.notes || ''} onChange={(v) => onUpdate({ notes: v as string })} placeholder="Special abilities or description..." rows={3} className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all resize-none placeholder:text-[#cccbcb] disabled:opacity-50 leading-relaxed font-sans" disabled={isSyncing} />
          </LabeledField>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={npc.autoRefreshMechanics || false}
              onChange={(e) => onUpdate({ autoRefreshMechanics: e.target.checked })}
              className="rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb] w-4 h-4"
              disabled={isSyncing}
            />
            <span className="text-sm font-medium text-[#0f172a]">
              Auto-refresh action mechanics
            </span>
          </label>

          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]/40">
            <NpcListEditor<NpcTrait>
              title="Traits"
              items={traits}
              defaultExpanded={traits.length > 0}
              emptyItem={{ name: '', description: '' }}
              renderFields={renderTraitFields}
              onChange={(updated) =>
                onUpdate({ traits: JSON.stringify(updated) })
              }
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]/40">
            <NpcListEditor<NpcAction>
              title="Actions"
              items={actions}
              defaultExpanded={actions.length > 0}
              emptyItem={{
                name: '',
                description: '',
                attackBonus: undefined,
                damage: undefined,
                saveDC: undefined,
                saveType: undefined,
                dcAbilities: undefined,
                atkAbility: undefined,
                damageComponents: undefined,
                range: undefined,
                recharge: undefined,
              }}
              renderFields={renderActionFields}
              onChange={(updated) =>
                onUpdate({ actions: JSON.stringify(updated) })
              }
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]/40">
            <NpcListEditor<NpcReaction>
              title="Reactions"
              items={reactions}
              defaultExpanded={reactions.length > 0}
              emptyItem={{
                name: '',
                description: '',
                attackBonus: undefined,
                damage: undefined,
                saveDC: undefined,
                saveType: undefined,
                dcAbilities: undefined,
                atkAbility: undefined,
                damageComponents: undefined,
                range: undefined,
                recharge: undefined,
              }}
              renderFields={renderReactionFields}
              onChange={(updated) =>
                onUpdate({ reactions: JSON.stringify(updated) })
              }
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]/40">
            <NpcListEditor<NpcAction>
              title="Bonus Actions"
              items={bonusActions}
              defaultExpanded={bonusActions.length > 0}
              emptyItem={{
                name: '',
                description: '',
                attackBonus: undefined,
                damage: undefined,
                saveDC: undefined,
                saveType: undefined,
                dcAbilities: undefined,
                atkAbility: undefined,
                damageComponents: undefined,
                range: undefined,
                recharge: undefined,
              }}
              renderFields={renderBonusActionFields}
              onChange={(updated) =>
                onUpdate({ bonusActions: JSON.stringify(updated) })
              }
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#e2e8f0]/40">
            <NpcLegendarySection legendaryActions={npc.legendaryActions} legendaryResistances={npc.legendaryResistances} isSyncing={isSyncing} onUpdate={onUpdate} />
            <NpcListEditor<NpcLegendaryAction>
              title="Legendary Actions"
              items={legendaryActions}
              defaultExpanded={legendaryActions.length > 0}
              emptyItem={{
                name: '',
                description: '',
                cost: 1,
                attackBonus: undefined,
                damage: undefined,
                saveDC: undefined,
                saveType: undefined,
              }}
              renderFields={renderLegendaryActionFields}
              onChange={(updated) =>
                onUpdate({
                  legendaryActionsList: JSON.stringify(updated)
                })
              }
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#e2e8f0]/40">
            <Button intent="destructive" size="large" onClick={() => setIsConfirmOpen(true)} disabled={isSyncing} className="flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete NPC
            </Button>
          </div>
        </div>
      </ExpandableContent>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Delete NPC?"
        description={`This will permanently remove ${npc.name} from your NPC library. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={onDelete}
        onClose={() => setIsConfirmOpen(false)}
      />
    </CardShell>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.npc === nextProps.npc &&
    prevProps.isSyncing === nextProps.isSyncing &&
    prevProps.isExpanded === nextProps.isExpanded
  );
});