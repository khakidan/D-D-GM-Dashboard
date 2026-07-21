import React, { useState, useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { parseDiceNotation, rollDice, performRechargeRoll } from '../../lib/diceRoller';
import { Combatant, DamageType, Character, NPC } from '../../types';
import { CombatantCardHeader } from './CombatantCardHeader';
import { CombatantCardExpanded } from './CombatantCardExpanded';
import { ResourcePool, serializeResourcePools } from '../../lib/resourcePools';
import { CardShell } from '../ui/CardShell';
import { NpcReferencePanel } from './NpcReferencePanel';
import { ExpandableContent } from '../ui/ExpandableContent';

export interface CombatantCardProps {
  c: Combatant;
  isExpanded: boolean;
  damageInput: string;
  healInput: string;
  currentRound: number;
  combatStarted: boolean;
  isActiveTurn: boolean;
  isSelected: boolean;
  isSelectable: boolean;
  isSyncing: boolean;
  hpMode?: 'damage' | 'heal';
  onDamageInputChange: (val: string) => void;
  onHealInputChange: (val: string) => void;
  onHealthSubmit: (isDamage: boolean, damageType?: DamageType | null) => void;
  onToggleExpand: () => void;
  onToggleSelect?: (id: string) => void;
  onUpdateCombatant: (updates: Partial<Combatant>) => void;
  onRemoveCombatant: () => void | Promise<void>;
  onConcentrationPrompt?: (effectName: string, targetName: string) => void;
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

export const CombatantCard = React.memo(function CombatantCard({
  c, isExpanded, damageInput, healInput,
  currentRound, combatStarted, onDamageInputChange, onHealInputChange, onHealthSubmit, onToggleExpand,
  onToggleSelect, onUpdateCombatant, onRemoveCombatant, onConcentrationPrompt, hpMode = 'damage',
  pcCharacter, npcModel, isActiveTurn, isSelected, isSelectable, isSyncing,
  handleResourcePoolUpdate, handleConditionAdded, handleConditionWithTimer, handleExhaustionDeath,
}: CombatantCardProps) {
  const [recentRechargeRolls, setRecentRechargeRolls] = useState<Record<string, number>>({});
  const rechargeTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      Object.values(rechargeTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const isActive = isActiveTurn && !!combatStarted;

  const handleUpdateResourcePools = (combatant: Combatant, updatedPools: ResourcePool[]) => {
    const serialized = serializeResourcePools(updatedPools);
    handleResourcePoolUpdate(combatant, { resourcePools: serialized });
  };

  const handleRechargeRoll = (abilityName: string, rechargeOn: number) => {
    const { rolledNum, isSuccess, updatedAbilities } = performRechargeRoll(
      c.rechargeAbilities || [],
      abilityName
    );

    setRecentRechargeRolls(prev => ({ ...prev, [abilityName]: rolledNum }));

    if (rechargeTimersRef.current[abilityName]) {
      clearTimeout(rechargeTimersRef.current[abilityName]);
    }

    rechargeTimersRef.current[abilityName] = setTimeout(() => {
      setRecentRechargeRolls(prev => {
        const cp = { ...prev };
        delete cp[abilityName];
        return cp;
      });
      delete rechargeTimersRef.current[abilityName];
    }, 2000);

    if (isSuccess) {
      toast.success(`${abilityName} recharged! (rolled ${rolledNum})`);
    } else {
      toast(`${abilityName} did not recharge (rolled ${rolledNum})`, {
        style: { backgroundColor: '#f3f4f6', color: '#1f2937', border: '1px solid #e5e7eb' }
      });
    }
    onUpdateCombatant({ rechargeAbilities: updatedAbilities });
  };

  const handleMarkSpent = (abilityName: string) => onUpdateCombatant({ rechargeAbilities: (c.rechargeAbilities || []).map(a => a.name === abilityName ? { ...a, isCharged: false } : a) });
  const handleSpendResistance = () => c.legendaryResistances && onUpdateCombatant({ legendaryResistances: { ...c.legendaryResistances, remaining: Math.max(0, c.legendaryResistances.remaining - 1) } });
  const handleRestoreResistances = () => c.legendaryResistances && onUpdateCombatant({ legendaryResistances: { ...c.legendaryResistances, remaining: c.legendaryResistances.max } });
  const handleSpendAction = () => c.legendaryActions && onUpdateCombatant({ legendaryActions: { ...c.legendaryActions, remaining: Math.max(0, c.legendaryActions.remaining - 1) } });
  const handleRestoreActions = () => c.legendaryActions && onUpdateCombatant({ legendaryActions: { ...c.legendaryActions, remaining: c.legendaryActions.max } });

  return (
    <CardShell
      id={`combatant-card-${c.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      highlight={isSelected ? 'selected' : (isActive && !isSelectable ? 'active-turn' : null)}
      cornerBadge={isActive && !isSelectable ? (
        <div className="bg-[#2563eb] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Zap className="w-3 h-3 fill-current" /> Active
        </div>
      ) : undefined}
      className={cn(
        'h-fit',
        (c.type === 'npc' && c.currentHp <= 0)
          ? 'bg-[#f9f8ff] opacity-60 grayscale-[0.5]'
          : ((c.currentHp <= 0 || (c.type === 'pc' && c.isStable)) ? 'opacity-60 grayscale-[0.5]' : '')
      )}
    >

      <CombatantCardHeader
        c={c}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        damageInput={damageInput}
        healInput={healInput}
        onDamageInputChange={onDamageInputChange}
        onHealInputChange={onHealInputChange}
        onHealthSubmit={onHealthSubmit}
        onUpdateCombatant={onUpdateCombatant}
        onToggleSelect={onToggleSelect}
        onMarkSpent={handleMarkSpent}
        hpMode={hpMode}
        onUpdateResourcePools={handleUpdateResourcePools}
        pcCharacter={pcCharacter}
        isActiveTurn={isActiveTurn}
        isSelected={isSelected}
        isSelectable={isSelectable}
        isSyncing={isSyncing}
      />

      {c.type === 'npc' && (
        <div className="px-6 pb-3">
          <NpcReferencePanel combatant={c} />
        </div>
      )}

      <ExpandableContent isExpanded={isExpanded}>
        <CombatantCardExpanded
          c={c} isSyncing={isSyncing} currentRound={currentRound} onUpdateCombatant={onUpdateCombatant}
          onRemoveCombatant={onRemoveCombatant} onConcentrationPrompt={onConcentrationPrompt}
          recentRechargeRolls={recentRechargeRolls} onMarkSpent={handleMarkSpent} onRollRecharge={handleRechargeRoll}
          onSpendAction={handleSpendAction} onSpendResistance={handleSpendResistance}
          onRestoreActions={handleRestoreActions} onRestoreResistances={handleRestoreResistances}
          pcCharacter={pcCharacter} npcModel={npcModel}
          handleResourcePoolUpdate={handleResourcePoolUpdate}
          handleConditionAdded={handleConditionAdded}
          handleConditionWithTimer={handleConditionWithTimer}
          handleExhaustionDeath={handleExhaustionDeath}
        />
      </ExpandableContent>
    </CardShell>
  );
}, (prevProps, nextProps) => {
  // Callback props (including the 4 handleX functions) are deliberately excluded from
  // this comparison, since ActiveEncounterTab's .map() call site creates fresh
  // references every render but every mutation path preserves object references for
  // unrelated data. isActiveTurn/isSelected/isSelectable/isSyncing are NEW here — they
  // used to come from a hook called inside this component, which meant they bypassed
  // this comparator entirely. Now that they're real props, they MUST be compared here,
  // or this memo would silently stop responding to e.g. a combatant's turn becoming
  // active or being selected.
  return (
    prevProps.c === nextProps.c &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.damageInput === nextProps.damageInput &&
    prevProps.healInput === nextProps.healInput &&
    prevProps.currentRound === nextProps.currentRound &&
    prevProps.combatStarted === nextProps.combatStarted &&
    prevProps.hpMode === nextProps.hpMode &&
    prevProps.pcCharacter === nextProps.pcCharacter &&
    prevProps.npcModel === nextProps.npcModel &&
    prevProps.isActiveTurn === nextProps.isActiveTurn &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelectable === nextProps.isSelectable &&
    prevProps.isSyncing === nextProps.isSyncing
  );
});
