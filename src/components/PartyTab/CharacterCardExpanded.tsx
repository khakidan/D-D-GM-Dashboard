import React from 'react';
import { Trash2 } from 'lucide-react';
import { Character, NpcTrait, NpcAction, NpcReaction } from '../../types';
import { cn } from '../../lib/utils';
import { DebouncedInput } from '../ui/DebouncedInput';
import { CardNumberInput } from '../ui/CardNumberInput';
import { DebouncedTextarea } from '../ui/DebouncedTextarea';
import { CharacterResourceSection } from './CharacterResourceSection';
import { IrvSection } from '../ui/IrvSection';
import { ResourcePoolsSection } from '../ui/ResourcePoolsSection';
import { getHitDiceStatus, getTotalHitDiceCount, parseHitDiceUsed, serializeHitDiceUsed } from '../../lib/hitDice';
import { getResourceForEffect, parseResourcePools, spendResourcePip, serializeResourcePools } from '../../lib/resourcePools';
import { toast } from 'sonner';
import { StatBlockScoresTable } from '../ui/StatBlockScoresTable';
import { StatBlockSaves } from '../ui/StatBlockSaves';
import { StatBlockPassive } from '../ui/StatBlockPassive';
import { StatBlockSkills } from '../ui/StatBlockSkills';
import { AbilityName, SkillName } from '../../lib/abilityScores';
import { LabeledField } from '../ui/LabeledField';
import { PipTracker } from '../ui/PipTracker';
import { parseAbilityScores, parseProficiencies, serializeAbilityScores, serializeProficiencies, proficiencyBonusFromLevel } from '../../lib/abilityScores';
import { findStaleAutomatedValues, recalculateAutomatedValues } from '../../lib/automation';
import { SpellcastingStatsRow } from '../ui/SpellcastingStatsRow';
import { serializeSpellcastingAbility } from '../../lib/spellcasting';
import { Button } from '../ui/Button';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { effectiveMaxHp } from '../../lib/conditions';
import { NpcListEditor } from '../ui/NpcListEditor';
import { createNpcListRenderers } from '../ui/npcListFieldRenderers';

export interface CharacterCardExpandedProps {
  character: Character;
  isSyncing: boolean;
  onUpdate: (updates: Partial<Character>) => void;
  onDelete: () => void;
}

export const CharacterCardExpanded: React.FC<CharacterCardExpandedProps> = ({
  character,
  isSyncing,
  onUpdate,
  onDelete,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const traits = React.useMemo(() => {
    try {
      const parsed = JSON.parse(character.traits || '[]');
      return Array.isArray(parsed) ? (parsed as NpcTrait[]) : [];
    } catch {
      return [] as NpcTrait[];
    }
  }, [character.traits]);

  const actions = React.useMemo(() => {
    try {
      const parsed = JSON.parse(character.actions || '[]');
      return Array.isArray(parsed) ? (parsed as NpcAction[]) : [];
    } catch {
      return [] as NpcAction[];
    }
  }, [character.actions]);

  const reactions = React.useMemo(() => {
    try {
      const parsed = JSON.parse(character.reactions || '[]');
      return Array.isArray(parsed) ? (parsed as NpcReaction[]) : [];
    } catch {
      return [] as NpcReaction[];
    }
  }, [character.reactions]);

  const bonusActions = React.useMemo(() => {
    try {
      const parsed = JSON.parse(character.bonusActions || '[]');
      return Array.isArray(parsed) ? (parsed as NpcAction[]) : [];
    } catch {
      return [] as NpcAction[];
    }
  }, [character.bonusActions]);


  const parsedAbilityScores = 
    parseAbilityScores(character.abilityScores);
  const parsedProficiencies = 
    parseProficiencies(character.proficiencies);

  const {
    renderTraitFields,
    renderActionFields,
    renderReactionFields,
    renderBonusActionFields,
  } = React.useMemo(() => createNpcListRenderers(
    'char-card',
    parsedAbilityScores,
    proficiencyBonusFromLevel(character.level)
  ), [parsedAbilityScores, character.level]);

  const handleConditionAdded = (label: string) => {
    const resourceName = getResourceForEffect(label);
    if (!resourceName) return;

    const pools = parseResourcePools(character.resourcePools || '');
    const matchedPool = pools.find(
      (p) => p.name.toLowerCase() === resourceName.toLowerCase()
    );

    if (!matchedPool) return;

    if (matchedPool.current > 0) {
      const updatedPools = spendResourcePip(pools, resourceName, 1);
      onUpdate({
        resourcePools: serializeResourcePools(updatedPools),
      });
    } else {
      toast.warning(`${matchedPool.name} is already depleted.`);
    }
  };

  return (
    <div className="p-6 flex flex-col font-sans gap-5 bg-white">
      {/* Compact Stat Row */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] font-sans -mt-2">
        {/* Left Side: Plain Text Proficiency */}
        <div className="text-xs font-bold text-[#8d8db9] uppercase tracking-wider">
          PROF +{proficiencyBonusFromLevel(character.level || 1)}
        </div>

        {/* Right Side: Grouped inputs */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* LEVEL */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#8d8db9] uppercase tracking-wider">LEVEL</span>
            <CardNumberInput
              value={character.level || 1}
              onChange={v => {
                const newProfBonus = proficiencyBonusFromLevel(v);
                if (character.autoRefreshMechanics) {
                  onUpdate({
                    level: v,
                    actions: JSON.stringify(recalculateAutomatedValues(actions, parsedAbilityScores, newProfBonus)),
                    reactions: JSON.stringify(recalculateAutomatedValues(reactions, parsedAbilityScores, newProfBonus)),
                    bonusActions: JSON.stringify(recalculateAutomatedValues(bonusActions, parsedAbilityScores, newProfBonus)),
                  });
                } else {
                  onUpdate({ level: v });
                  const staleCount =
                    findStaleAutomatedValues(actions, parsedAbilityScores, newProfBonus) +
                    findStaleAutomatedValues(reactions, parsedAbilityScores, newProfBonus) +
                    findStaleAutomatedValues(bonusActions, parsedAbilityScores, newProfBonus);
                  if (staleCount > 0) {
                    toast(`${staleCount} action value${staleCount === 1 ? ' is' : 's are'} out of date.`, {
                      action: {
                        label: 'Recalculate',
                        onClick: () => {
                          onUpdate({
                            actions: JSON.stringify(recalculateAutomatedValues(actions, parsedAbilityScores, newProfBonus)),
                            reactions: JSON.stringify(recalculateAutomatedValues(reactions, parsedAbilityScores, newProfBonus)),
                            bonusActions: JSON.stringify(recalculateAutomatedValues(bonusActions, parsedAbilityScores, newProfBonus)),
                          });
                        },
                      },
                    });
                  }
                }
              }}
              fallback={1}
              min={1}
              max={20}
              placeholder="1"
              className="w-11 text-xs font-bold text-[#0f172a] text-center bg-[#f9f8ff] border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded py-1 px-0.5 outline-none transition-all disabled:opacity-50"
              disabled={isSyncing}
            />
          </div>

          {/* AC */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#8d8db9] uppercase tracking-wider">AC</span>
            <CardNumberInput
              value={character.ac || 0}
              onChange={v => onUpdate({ ac: v })}
              fallback={0}
              min={0}
              className="w-11 text-xs font-bold text-[#0f172a] text-center bg-[#f9f8ff] border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded py-1 px-0.5 outline-none transition-all disabled:opacity-50"
              disabled={isSyncing}
            />
          </div>

          {/* HP */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#8d8db9] uppercase tracking-wider">HP</span>
            <CardNumberInput
              value={character.currentHp ?? 0}
              onChange={v => onUpdate({ currentHp: v })}
              fallback={0}
              max={effectiveMaxHp(character.maxHp, character.tempHpMax)}
              className="w-12 text-xs font-bold text-[#0f172a] text-center bg-[#f9f8ff] border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded py-1 px-0.5 outline-none transition-all disabled:opacity-50"
              disabled={isSyncing}
            />
          </div>

          {/* TEMP */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#8d8db9] uppercase tracking-wider">TEMP</span>
            <CardNumberInput
              value={character.tempHp ?? 0}
              onChange={v => onUpdate({ tempHp: v })}
              fallback={0}
              min={0}
              className="w-11 text-xs font-bold text-[#0f172a] text-center bg-[#f9f8ff] border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded py-1 px-0.5 outline-none transition-all disabled:opacity-50"
              disabled={isSyncing}
            />
          </div>

          {/* MAX */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#8d8db9] uppercase tracking-wider">MAX</span>
            <CardNumberInput
              value={character.maxHp || 0}
              onChange={v => onUpdate({ maxHp: v })}
              fallback={1}
              min={1}
              className={cn(
                "w-12 text-xs font-bold text-center bg-[#f9f8ff] border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] rounded py-1 px-0.5 outline-none transition-all disabled:opacity-50",
                character.tempHpMax && character.tempHpMax > 0 ? "text-[#2563eb] cursor-help" : "text-[#0f172a]"
              )}
              title={character.tempHpMax && character.tempHpMax > 0 ? `Temp max (original: ${character.maxHp})` : undefined}
              disabled={isSyncing}
            />
          </div>
        </div>
      </div>

      {(() => {
        const handleStatBlockChange = (scores: any, profs: any) => {
          const profBonus = proficiencyBonusFromLevel(character.level);
          if (character.autoRefreshMechanics) {
            onUpdate({
              abilityScores: serializeAbilityScores(scores),
              proficiencies: serializeProficiencies(profs),
              actions: JSON.stringify(recalculateAutomatedValues(actions, scores, profBonus)),
              reactions: JSON.stringify(recalculateAutomatedValues(reactions, scores, profBonus)),
              bonusActions: JSON.stringify(recalculateAutomatedValues(bonusActions, scores, profBonus)),
            });
          } else {
            onUpdate({
              abilityScores: serializeAbilityScores(scores),
              proficiencies: serializeProficiencies(profs),
            });
            const staleCount =
              findStaleAutomatedValues(actions, scores, profBonus) +
              findStaleAutomatedValues(reactions, scores, profBonus) +
              findStaleAutomatedValues(bonusActions, scores, profBonus);
            if (staleCount > 0) {
              toast(`${staleCount} action value${staleCount === 1 ? ' is' : 's are'} out of date.`, {
                action: {
                  label: 'Recalculate',
                  onClick: () => {
                    onUpdate({
                      actions: JSON.stringify(recalculateAutomatedValues(actions, scores, profBonus)),
                      reactions: JSON.stringify(recalculateAutomatedValues(reactions, scores, profBonus)),
                      bonusActions: JSON.stringify(recalculateAutomatedValues(bonusActions, scores, profBonus)),
                    });
                  },
                },
              });
            }
          }
        };

        const handleAbilityChange = (ability: AbilityName, value: number) => {
          handleStatBlockChange(
            { ...parsedAbilityScores, [ability]: value },
            parsedProficiencies
          );
        };

        const handleSavingThrowToggle = (ability: AbilityName) => {
          const isProf = parsedProficiencies.savingThrows.includes(ability);
          handleStatBlockChange(parsedAbilityScores, {
            ...parsedProficiencies,
            savingThrows: isProf
              ? parsedProficiencies.savingThrows.filter((a) => a !== ability)
              : [...parsedProficiencies.savingThrows, ability],
          });
        };

        const handlePassiveBonusChange = (key: 'perception' | 'insight' | 'investigation', valueStr: string) => {
          const val = parseInt(valueStr, 10);
          handleStatBlockChange(parsedAbilityScores, {
            ...parsedProficiencies,
            passiveBonuses: {
              ...parsedProficiencies.passiveBonuses,
              [key]: isNaN(val) ? 0 : Math.max(-10, Math.min(10, val)),
            },
          });
        };

        const handleSkillCycle = (skill: SkillName) => {
          const currentProf = parsedProficiencies.skills[skill] ?? 'none';
          const nextProf = currentProf === 'none' ? 'proficient' : currentProf === 'proficient' ? 'expertise' : 'none';
          const updatedSkills = { ...parsedProficiencies.skills };
          if (nextProf === 'none') delete updatedSkills[skill];
          else updatedSkills[skill] = nextProf;
          handleStatBlockChange(parsedAbilityScores, {
            ...parsedProficiencies,
            skills: updatedSkills,
          });
        };

        const handleSkillToggle = (skill: SkillName) => {
          const currentProf = parsedProficiencies.skills[skill] ?? 'none';
          const nextProf = currentProf === 'none' ? 'proficient' : 'none';
          const updatedSkills = { ...parsedProficiencies.skills };
          if (nextProf === 'none') delete updatedSkills[skill];
          else updatedSkills[skill] = nextProf;
          handleStatBlockChange(parsedAbilityScores, {
            ...parsedProficiencies,
            skills: updatedSkills,
          });
        };

        const handleSkillChange = (skill: SkillName, value: 'none' | 'proficient' | 'expertise') => {
          const updatedSkills = { ...parsedProficiencies.skills };
          if (value === 'none') {
            delete updatedSkills[skill];
          } else {
            updatedSkills[skill] = value;
          }
          handleStatBlockChange(parsedAbilityScores, {
            ...parsedProficiencies,
            skills: updatedSkills,
          });
        };

        const handleJackOfAllTradesToggle = () => {
          handleStatBlockChange(parsedAbilityScores, {
            ...parsedProficiencies,
            jackOfAllTrades: !parsedProficiencies.jackOfAllTrades,
          });
        };

        return (
          <div className="space-y-6">
            <StatBlockScoresTable
              abilityScores={parsedAbilityScores}
              onScoreChange={handleAbilityChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e2e8f0]/40">
              {/* Left Column: Saves + Skills */}
              <div className="space-y-6">
                <StatBlockSaves
                  abilityScores={parsedAbilityScores}
                  savingThrows={parsedProficiencies.savingThrows}
                  effectiveProfBonus={proficiencyBonusFromLevel(character.level)}
                  readOnly={false}
                  onToggle={handleSavingThrowToggle}
                />
                <StatBlockSkills
                  abilityScores={parsedAbilityScores}
                  skills={parsedProficiencies.skills}
                  jackOfAllTrades={parsedProficiencies.jackOfAllTrades}
                  effectiveProfBonus={proficiencyBonusFromLevel(character.level)}
                  readOnly={false}
                  onSkillCycle={handleSkillCycle}
                  onSkillToggle={handleSkillToggle}
                  onSkillChange={handleSkillChange}
                  onJackOfAllTradesToggle={handleJackOfAllTradesToggle}
                />
              </div>

              {/* Right Column: Passive + Spellcasting + Conditions */}
              <div className="space-y-6">
                <StatBlockPassive
                  abilityScores={parsedAbilityScores}
                  proficiencies={parsedProficiencies}
                  effectiveProfBonus={proficiencyBonusFromLevel(character.level)}
                  readOnly={false}
                  onPassiveBonusChange={handlePassiveBonusChange}
                />

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Spellcasting
                  </div>
                  <SpellcastingStatsRow
                    abilityScores={parsedAbilityScores}
                    profBonus={proficiencyBonusFromLevel(character.level)}
                    className={character.class}
                    overrideAbility={parsedProficiencies.spellcastingAbility}
                    onOverrideChange={(ability) => {
                      const updated = { ...parsedProficiencies };
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

                {character.gmControlled && (
                  <>
                    <LabeledField label="Speed">
                      <DebouncedInput
                        type="text"
                        value={character.speed || ''}
                        onChange={(v) => onUpdate({ speed: v as string })}
                        placeholder="e.g. 30 ft., fly 60 ft."
                        className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50"
                        disabled={isSyncing}
                      />
                    </LabeledField>

                    <LabeledField label="Senses">
                      <DebouncedInput
                        type="text"
                        value={character.senses || ''}
                        onChange={(v) => onUpdate({ senses: v as string })}
                        placeholder="e.g. darkvision 60 ft."
                        className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50"
                        disabled={isSyncing}
                      />
                    </LabeledField>

                    <LabeledField label="Languages">
                      <DebouncedInput
                        type="text"
                        value={character.languages || ''}
                        onChange={(v) => onUpdate({ languages: v as string })}
                        placeholder="e.g. Common"
                        className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50"
                        disabled={isSyncing}
                      />
                    </LabeledField>
                  </>
                )}

                <CharacterResourceSection
                  conditions={character.conditions || ''}
                  onConditionsChange={(v) => onUpdate({ conditions: v })}
                  immunities={character.immunities || ''}
                  combatantId={character.id}
                  onConditionAdded={handleConditionAdded}
                  characterId={character.id}
                  onUpdateCharacter={(id, updates) => onUpdate(updates)}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Two-column grid for Hit-Dice/Resources and IRV */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Hit Dice and Resource Pools */}
        <div className="space-y-4">
          {/* Hit Dice Config and Display Section */}
          <div className="border border-[#e2e8f0] hover:border-[#2563eb]/30 rounded-xl bg-white p-4 space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#e2e8f0]/50 pb-2">
              <div className="text-[10px] uppercase text-[#8d8db9] font-bold tracking-widest px-1">
                Hit Dice
              </div>
              {/* Config Input directly inline */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8d8db9]/70">Config:</span>
                <DebouncedInput
                  type="text"
                  value={character.hitDiceConfig || ''}
                  onChange={(value) => onUpdate({ hitDiceConfig: value as string })}
                  placeholder="e.g. 5d8 or 2d10+3d8"
                  className="text-xs bg-[#ffffff] hover:bg-white focus:bg-white text-[#0f172a] border border-[#e2e8f0] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none px-2 py-1 rounded w-36 transition-all font-mono"
                  disabled={isSyncing}
                  id={`hit-dice-config-input-${character.id}`}
                />
              </div>
            </div>

            {/* Pool Display */}
            {!character.hitDiceConfig ? (
              <p className="text-xs text-[#8d8db9]/60 italic px-1" id={`hit-dice-empty-helper-${character.id}`}>
                No hit dice configured. Enter a formula (e.g., "5d8" or "2d10+3d8") to track rest pools.
              </p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const pools = getHitDiceStatus(character.hitDiceConfig, character.hitDiceUsed || '{}');
                  if (pools.length === 0) {
                    return (
                      <p className="text-xs text-[#2563eb] italic px-1">
                        Invalid hit dice config formula. Use e.g. "5d8" or "1d10+4d8".
                      </p>
                    );
                  }
                  return pools.map((pool) => {
                    return (
                      <div key={pool.die} className="flex items-center justify-between text-xs py-1 px-1 border-b border-[#ffffff]/50 last:border-b-0" id={`pool-display-d${pool.die}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-[#0f172a] inline-block bg-[#f9f8ff] px-1.5 py-0.5 rounded text-[10px]">
                            d{pool.die}
                          </span>
                          <span className="font-mono text-[#8d8db9]">
                            {pool.remaining} / {getTotalHitDiceCount(character.hitDiceConfig || '')} remaining
                          </span>
                        </div>
                        {/* Visual spent indicators */}
                        <PipTracker
                          max={pool.count}
                          remaining={pool.remaining}
                          onChange={(newValue) => {
                            const used = parseHitDiceUsed(character.hitDiceUsed || '{}');
                            const newUsed = pool.count - newValue;
                            const updatedUsed = { ...used, [`d${pool.die}`]: Math.max(0, newUsed) };
                            onUpdate({ hitDiceUsed: serializeHitDiceUsed(updatedUsed) });
                          }}
                          color="blue"
                          size="default"
                          label={`d${pool.die} hit die`}
                        />
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          <ResourcePoolsSection
            character={character}
            isSyncing={isSyncing}
            onUpdate={onUpdate}
          />
        </div>

        {/* Right Column: IRV column stacked */}
        <div>
          <IrvSection
            resistances={character.resistances || ''}
            immunities={character.immunities || ''}
            vulnerabilities={character.vulnerabilities || ''}
            onUpdate={onUpdate}
            labels={{
              resistances: 'Resistances',
              immunities: 'Immunities',
              vulnerabilities: 'Vulnerabilities',
            }}
            placeholders={{
              resistances: 'e.g. fire',
              immunities: 'e.g. poison',
              vulnerabilities: 'e.g. cold',
            }}
            gap="gap-4"
            direction="column"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={character.autoRefreshMechanics || false}
              onChange={(e) => onUpdate({ autoRefreshMechanics: e.target.checked })}
              className="rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb] w-4 h-4"
              disabled={isSyncing}
            />
            <span className="text-sm font-medium text-[#0f172a]">
              Auto-refresh action mechanics
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={character.gmControlled || false}
              onChange={(e) => onUpdate({ gmControlled: e.target.checked })}
              className="rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb] w-4 h-4"
              disabled={isSyncing}
            />
            <span className="text-sm font-medium text-[#0f172a]">
              GM-Controlled Character
            </span>
          </label>
        </div>

        {character.gmControlled && (
          <div className="space-y-4 pl-4 border-l border-stone-100">
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

          </div>
        )}
      </div>

      <LabeledField label="Notes">
        <DebouncedTextarea 
          value={character.notes}
          onChange={(v) => onUpdate({ notes: v })}
          placeholder="Notes..."
          className="w-full text-sm text-[#0f172a] bg-transparent p-3 rounded-lg italic resize-none border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all h-24 placeholder:text-[#8d8db9]/40 disabled:opacity-50"
          disabled={isSyncing}
        />
      </LabeledField>

      <div className="pt-4">
        <Button intent="destructive" size="large" onClick={() => setIsConfirmOpen(true)} disabled={isSyncing} className="w-full flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" />
          Delete Player
        </Button>
        <ConfirmationDialog
          isOpen={isConfirmOpen}
          title="Delete Player?"
          description={`This will permanently remove ${character.characterName} from your party roster. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={onDelete}
          onClose={() => setIsConfirmOpen(false)}
        />
      </div>
    </div>
  );
};
