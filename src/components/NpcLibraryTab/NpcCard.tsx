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
import { StatTile } from '../ui/StatTile';
import { ExpandableContent } from '../ui/ExpandableContent';
import { LabeledField } from '../ui/LabeledField';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { createNpcListRenderers } from '../ui/npcListFieldRenderers';

// Modular Sub-components
import { NpcCardHeader } from './NpcCardHeader';
import { IrvSection } from '../ui/IrvSection';
import { NpcLegendarySection } from './NpcLegendarySection';
import { StatBlock } from '../ui/StatBlock';
import { SpellcastingStatsRow } from '../ui/SpellcastingStatsRow';
import { serializeSpellcastingAbility } from '../../lib/spellcasting';
import { parseAbilityScores, parseProficiencies, serializeAbilityScores, serializeProficiencies, proficiencyBonusFromCR } from '../../lib/abilityScores';

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
        <div className="p-6 flex flex-col gap-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="AC">
              <CardNumberInput
                value={npc.ac}
                onChange={v => onUpdate({ ac: v })}
                fallback={0}
                min={0}
                className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50"
                disabled={isSyncing}
              />
            </StatTile>
            <StatTile label="Max HP">
              <CardNumberInput
                value={npc.maxHp}
                onChange={v => onUpdate({ maxHp: v })}
                fallback={1}
                min={1}
                className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50"
                disabled={isSyncing}
              />
            </StatTile>
            <StatTile label="CR" className="col-span-2 sm:col-span-1">
              <DebouncedInput
                type="text"
                value={npc.challengeRating || ''}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                onChange={(v) => onUpdate({ challengeRating: v as string })}
                className="text-lg font-bold text-[#0f172a] w-full text-center bg-transparent border-none focus:ring-0 p-0 disabled:opacity-50"
                placeholder="—"
                disabled={isSyncing}
              />
            </StatTile>
          </div>

          <StatBlock
            abilityScores={parsedScores}
            proficiencies={parsedProfs}
            readOnly={false}
            onChange={(scores, profs) => {
              onUpdate({
                abilityScores: serializeAbilityScores(scores),
                proficiencies: serializeProficiencies(profs),
              });
            }}
          />

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

          <LabeledField label="Speed">
            <DebouncedInput type="text" value={npc.speed || ''} onChange={(v) => onUpdate({ speed: v as string })} placeholder="e.g. 30 ft., fly 60 ft." className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled={isSyncing} />
          </LabeledField>

          <LabeledField label="Senses">
            <DebouncedInput type="text" value={npc.senses || ''} onChange={(v) => onUpdate({ senses: v as string })} placeholder="e.g. darkvision 60 ft." className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled={isSyncing} />
          </LabeledField>

          <LabeledField label="Languages">
            <DebouncedInput type="text" value={npc.languages || ''} onChange={(v) => onUpdate({ languages: v as string })} placeholder="e.g. Common" className="w-full text-xs text-[#0f172a] bg-[#ffffff] p-3 rounded-lg border border-[#e2e8f0] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#cccbcb] disabled:opacity-50" disabled={isSyncing} />
          </LabeledField>

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
  // Same reasoning as CharacterCard.tsx: NpcLibraryTab.tsx creates fresh callbacks
  // every render, but every state-update path in useNpcLibrary.ts uses
  // .map(n => matches ? {...n, ...updates} : n), preserving the same object
  // reference for every NPC that wasn't actually changed.
  return (
    prevProps.npc === nextProps.npc &&
    prevProps.isSyncing === nextProps.isSyncing &&
    prevProps.isExpanded === nextProps.isExpanded
  );
});