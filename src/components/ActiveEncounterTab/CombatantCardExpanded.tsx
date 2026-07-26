import React from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { buildConditionSummary } from '../../lib/conditions';
import { Combatant, Character, NPC } from '../../types';
import { ConditionChips } from '../ui/ConditionChips';
import { CombatantRechargeTracker } from './CombatantRechargeTracker';
import { CombatantLegendaryTracker } from './CombatantLegendaryTracker';
import { ResourcePoolsSection } from '../ui/ResourcePoolsSection';
import { StatTile } from '../ui/StatTile';
import { 
  parseAbilityScores, 
  parseProficiencies, 
  proficiencyBonusFromLevel,
  AbilityName,
  SkillName
} from '../../lib/abilityScores';
import { StatBlockScoresTable } from '../ui/StatBlockScoresTable';
import { StatBlockSaves } from '../ui/StatBlockSaves';
import { StatBlockPassive } from '../ui/StatBlockPassive';
import { StatBlockSkills } from '../ui/StatBlockSkills';
import { NpcStatBlockSection, formatActionMeta } from '../ui/NpcStatBlockSection';
import { getEffectiveResistances } from '../../lib/combatLogic';
import { CombatMechanicsSummary } from './CombatMechanicsSummary';
import { CombatantIrvDisplay } from './CombatantIrvDisplay';
import { Button } from '../ui/Button';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { parseCommaSeparatedList } from '../../lib/stringUtils';

export interface CombatantCardExpandedProps {
  c: Combatant;
  isSyncing: boolean;
  currentRound: number;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  onRemoveCombatant: () => void | Promise<void>;
  onConcentrationPrompt?: (effectName: string, targetName: string) => void;
  recentRechargeRolls?: Record<string, number>;
  onMarkSpent: (abilityName: string) => void;
  onRollRecharge: (abilityName: string, rechargeOn: number) => void;
  onSpendAction: () => void;
  onSpendResistance: () => void;
  onRestoreActions: () => void;
  onRestoreResistances: () => void;
  pcCharacter?: Character;
  npcModel?: NPC;
  handleResourcePoolUpdate: (c: Combatant, updates: Partial<Character>) => void | Promise<void>;
  handleConditionAdded: (c: Combatant, label: string) => void | Promise<void>;
  handleConditionWithTimer: (
    c: Combatant,
    condName: string,
    rounds: number,
    currentRound: number,
    onUpdateCombatant: (updates: Partial<Combatant>) => void
  ) => void | Promise<void>;
  handleExhaustionDeath: (c: Combatant) => void | Promise<void>;
}

export function CombatantCardExpanded({
  c,
  isSyncing,
  currentRound,
  onUpdateCombatant,
  onRemoveCombatant,
  onConcentrationPrompt,
  recentRechargeRolls = {},
  onMarkSpent,
  onRollRecharge,
  onSpendAction,
  onSpendResistance,
  onRestoreActions,
  onRestoreResistances,
  pcCharacter,
  npcModel,
  handleResourcePoolUpdate,
  handleConditionAdded,
  handleConditionWithTimer,
  handleExhaustionDeath,
}: CombatantCardExpandedProps) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const conditionList = parseCommaSeparatedList(c.conditions || '', { toLowerCase: true });
  const mechanicalSummary = buildConditionSummary(conditionList);

  const abilityScores = npcModel 
    ? parseAbilityScores(npcModel.abilityScores) 
    : pcCharacter 
    ? parseAbilityScores(pcCharacter.abilityScores) 
    : parseAbilityScores('{}');
      
  const proficiencies = npcModel
    ? parseProficiencies(npcModel.proficiencies)
    : pcCharacter
    ? parseProficiencies(pcCharacter.proficiencies)
    : parseProficiencies('{}');
      
  const effectiveProfBonus = pcCharacter?.level
    ? (proficiencies.proficiencyBonus > 0 ? proficiencies.proficiencyBonus : proficiencyBonusFromLevel(pcCharacter.level))
    : proficiencies.proficiencyBonus;

  const traits = React.useMemo(() => {
    try {
      return JSON.parse(c.traits || '[]') as any[];
    } catch {
      return [];
    }
  }, [c.traits]);

  const actions = React.useMemo(() => {
    try {
      return JSON.parse(c.actions || '[]') as any[];
    } catch {
      return [];
    }
  }, [c.actions]);

  const bonusActions = React.useMemo(() => {
    try {
      return JSON.parse(c.bonusActions || '[]') as any[];
    } catch {
      return [];
    }
  }, [c.bonusActions]);

  const reactions = React.useMemo(() => {
    try {
      return JSON.parse(c.reactions || '[]') as any[];
    } catch {
      return [];
    }
  }, [c.reactions]);

  const legendaryActions = React.useMemo(() => {
    try {
      return JSON.parse(c.legendaryActionsList || '[]') as any[];
    } catch {
      return [];
    }
  }, [c.legendaryActionsList]);

  const showReferenceContent = c.type === 'npc' || pcCharacter?.gmControlled;

  return (
    <div className="px-6 pb-6 pt-2 bg-white space-y-5" id={`combatant-expanded-${c.id}`}>
      {c.notes && (
        <p className="text-sm text-[#8d8db9] opacity-60 italic">{c.notes}</p>
      )}

      {/* 1. Compact Stats Line */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-2 border-b border-[#e2e8f0]">
        {c.type === 'npc' && c.speed && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8d8db9]">Speed</span>
            <span className="text-sm font-bold text-slate-700">{c.speed}</span>
          </div>
        )}
        {c.type === 'npc' && c.challengeRating && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8d8db9]">CR</span>
            <span className="text-sm font-bold text-slate-700">{c.challengeRating}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8d8db9]">Prof</span>
          <span className="text-sm font-bold text-slate-700">+{effectiveProfBonus}</span>
        </div>
        
        {/* HP Stats in the same line */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8d8db9]">Temp</span>
            <input
              type="number"
              value={c.tempHp || ''}
              onChange={e => onUpdateCombatant({ tempHp: e.target.value ? parseInt(e.target.value) : 0 })}
              placeholder="0"
              disabled={isSyncing}
              className="w-12 bg-[#f9f8ff] border border-[#e2e8f0] text-center font-bold text-[#2563eb] text-sm rounded focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8d8db9]">Max</span>
            <div className="flex items-center gap-2">
              {c.tempHpMax && c.tempHpMax > 0 ? (
                <span className="font-bold text-sm text-[#2563eb]" title={`Temp max (original: ${c.maxHp})`}>
                  {c.tempHpMax}
                </span>
              ) : (
                <span className="font-bold text-sm text-slate-900">{c.maxHp}</span>
              )}
              {c.type === 'npc' && (c.currentHp < c.maxHp || (c.tempHp || 0) > 0) && (
                <button
                  onClick={() => onUpdateCombatant({ currentHp: c.maxHp, tempHp: 0 })}
                  disabled={isSyncing}
                  title="Reset HP"
                  className="p-1 text-[#8d8db9] hover:text-[#2563eb] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ability Scores Table */}
      <StatBlockScoresTable abilityScores={abilityScores} />

      {/* 3. Grid: Saves | Passive+Senses+Languages */}
      <div data-testid="saves-passive-grid" className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <StatBlockSaves
          abilityScores={abilityScores}
          savingThrows={proficiencies.savingThrows}
          effectiveProfBonus={effectiveProfBonus}
          readOnly={true}
          onToggle={() => {}}
        />
        <div className="flex flex-col gap-2">
          <StatBlockPassive
            abilityScores={abilityScores}
            proficiencies={proficiencies}
            effectiveProfBonus={effectiveProfBonus}
            readOnly={true}
            onPassiveBonusChange={() => {}}
          />
          {c.type === 'npc' && c.senses && c.senses.trim() !== '' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8d8db9] whitespace-nowrap">SENSES</span>
              <span className="text-sm font-bold text-slate-700">{c.senses}</span>
            </div>
          )}
          {c.type === 'npc' && c.languages && c.languages.trim() !== '' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8d8db9] whitespace-nowrap">LANGUAGES</span>
              <span className="text-sm font-bold text-slate-700">{c.languages}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Grid: Skills | IRV */}
      <div data-testid="skills-irv-grid" className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <StatBlockSkills
          abilityScores={abilityScores}
          skills={proficiencies.skills}
          jackOfAllTrades={proficiencies.jackOfAllTrades}
          effectiveProfBonus={effectiveProfBonus}
          readOnly={true}
          onSkillCycle={() => {}}
          onJackOfAllTradesToggle={() => {}}
        />
        <CombatantIrvDisplay
          resistances={getEffectiveResistances(c)}
          immunities={c.immunities || ''}
          vulnerabilities={c.vulnerabilities || ''}
        />
      </div>

      {/* 5. Grid: Recharge | Conditions */}
      <div data-testid="recharge-conditions-grid" className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          {c.type === 'npc' && c.rechargeAbilities && c.rechargeAbilities.length > 0 && (
            <CombatantRechargeTracker
              rechargeAbilities={c.rechargeAbilities}
              onMarkSpent={onMarkSpent}
              onRollRecharge={onRollRecharge}
              combatantId={c.id}
              recentRechargeRolls={recentRechargeRolls}
              isSyncing={isSyncing}
            />
          )}
          {c.type === 'pc' && pcCharacter && (
            <ResourcePoolsSection
              character={pcCharacter}
              isSyncing={isSyncing}
              onUpdate={(updates) => handleResourcePoolUpdate(c, updates)}
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-[#8d8db9] mb-2">Conditions</label>
          <ConditionChips
            value={c.conditions || ''}
            onChange={val => onUpdateCombatant({ conditions: val })}
            immunities={c.immunities || ''}
            disabled={isSyncing}
            onAddWithTimer={(condName, rounds) => handleConditionWithTimer(c, condName, rounds, currentRound, onUpdateCombatant)}
            currentRound={currentRound}
            onConcentrationEffectAdded={(effectName) => {
              if (onConcentrationPrompt) {
                onConcentrationPrompt(effectName, c.name);
              }
            }}
            onConditionAdded={(label) => handleConditionAdded(c, label)}
            onExhaustionDeath={() => handleExhaustionDeath(c)}
          />
        </div>
      </div>

      <CombatMechanicsSummary mechanicalSummary={mechanicalSummary} />

      {/* 7. Reference Content: Traits, Actions, etc. */}
      {showReferenceContent && (
        <div className="space-y-4 pt-2">
          {traits.length > 0 && (
            <NpcStatBlockSection
              title="Traits"
              items={traits.map(t => ({
                name: t.name,
                description: t.description,
              }))}
            />
          )}

          {actions.length > 0 && (
            <NpcStatBlockSection
              title="Actions"
              items={actions.map(a => ({
                name: a.name,
                description: a.description,
                meta: formatActionMeta(a),
              }))}
            />
          )}

          {bonusActions.length > 0 && (
            <NpcStatBlockSection
              title="Bonus Actions"
              items={bonusActions.map(ba => ({
                name: ba.name,
                description: ba.description,
                meta: formatActionMeta(ba),
              }))}
            />
          )}

          {reactions.length > 0 && (
            <NpcStatBlockSection
              title="Reactions"
              items={reactions.map(r => ({
                name: r.name,
                description: r.description,
              }))}
            />
          )}

          {/* 8. Legendary Section */}
          {c.type === 'npc' && (c.legendaryActions || c.legendaryResistances) && (
            <CombatantLegendaryTracker
              legendaryActions={c.legendaryActions}
              legendaryResistances={c.legendaryResistances}
              onSpendAction={onSpendAction}
              onSpendResistance={onSpendResistance}
              onRestoreActions={onRestoreActions}
              onRestoreResistances={onRestoreResistances}
              combatantId={c.id}
              isSyncing={isSyncing}
            />
          )}

          {c.type === 'npc' && legendaryActions.length > 0 && (
            <NpcStatBlockSection
              title="Legendary Actions"
              items={legendaryActions.map(la => ({
                name: la.cost && la.cost > 1
                  ? `${la.name} (Costs ${la.cost})`
                  : la.name,
                description: la.description,
              }))}
            />
          )}
        </div>
      )}

      {/* Display active condition timers as pill badges */}
      {c.conditionTimers && Object.keys(c.conditionTimers).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2" id={`condition-timers-list-${c.id}`}>
          {Object.entries(c.conditionTimers).map(([condName, expiresAt]) => (
            <span
              key={condName}
              className="inline-flex items-center gap-2 bg-[#f9f8ff]/80 border border-[#e2e8f0] hover:border-[#2563eb] text-[#8d8db9] text-xs font-bold px-3 py-1 rounded-full transition-colors"
            >
              <span>{condName} ends round {expiresAt}</span>
              <button
                onClick={() => {
                  const newTimers = { ...(c.conditionTimers || {}) };
                  delete newTimers[condName];
                  onUpdateCombatant({
                    conditionTimers: newTimers,
                  });
                }}
                className="hover:text-red-600 transition-colors cursor-pointer text-xs leading-none ml-1 font-black"
                title="Remove timer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-[#e2e8f0]">
        <span className="text-xs text-[#8d8db9] opacity-40 font-mono tracking-tighter">{c.id.split('-').pop()}</span>
        <Button intent="destructive" size="small" onClick={() => setIsConfirmOpen(true)} disabled={isSyncing} className="flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Remove Combatant
        </Button>
        <ConfirmationDialog
          isOpen={isConfirmOpen}
          title="Remove Combatant?"
          description={`This will remove ${c.name} from the current encounter. This cannot be undone.`}
          confirmLabel="Remove"
          onConfirm={onRemoveCombatant}
          onClose={() => setIsConfirmOpen(false)}
        />
      </div>
    </div>
  );
}
