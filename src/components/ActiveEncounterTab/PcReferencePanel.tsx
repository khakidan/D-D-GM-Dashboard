import React, { useState, useMemo } from 'react';
import { Combatant, NpcTrait, NpcAction, NpcReaction } from '../../types';
import { NpcStatBlockSection, formatActionMeta } from '../ui/NpcStatBlockSection';

export interface PcReferencePanelProps {
  combatant: Combatant;
}

const isFieldEmpty = (val?: string) => {
  if (!val) return true;
  const trimmed = val.trim();
  return trimmed === '' || trimmed === '[]';
};

export const PcReferencePanel: React.FC<PcReferencePanelProps> = ({ combatant }) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasNoContent = 
    isFieldEmpty(combatant.traits) &&
    isFieldEmpty(combatant.actions) &&
    isFieldEmpty(combatant.reactions);

  if (hasNoContent) return null;

  const traits = useMemo(() => {
    try {
      return JSON.parse(combatant.traits || '[]') as NpcTrait[];
    } catch {
      return [] as NpcTrait[];
    }
  }, [combatant.traits]);

  const actions = useMemo(() => {
    try {
      return JSON.parse(combatant.actions || '[]') as NpcAction[];
    } catch {
      return [] as NpcAction[];
    }
  }, [combatant.actions]);

  const reactions = useMemo(() => {
    try {
      return JSON.parse(combatant.reactions || '[]') as NpcReaction[];
    } catch {
      return [] as NpcReaction[];
    }
  }, [combatant.reactions]);

  return (
    <div className="w-full mt-2" data-testid="pc-reference-panel">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-[#8d8db9] hover:text-[#0f172a] font-medium bg-[#f9f8ff] rounded px-2 py-1 border border-[#e2e8f0] w-full text-left cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-1"
      >
        {isOpen ? '▼ Stat Block' : '▶ Stat Block'}
      </button>

      {isOpen && (
        <div className="bg-white border border-[#e2e8f0] rounded p-3 mt-1 space-y-3 text-sm text-left">
          {/* Traits section */}
          {traits.length > 0 && (
            <NpcStatBlockSection
              title="Traits"
              items={traits.map(t => ({
                name: t.name,
                description: t.description,
              }))}
            />
          )}

          {/* Actions section */}
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

          {/* Reactions section */}
          {reactions.length > 0 && (
            <NpcStatBlockSection
              title="Reactions"
              items={reactions.map(r => ({
                name: r.name,
                description: r.description,
              }))}
            />
          )}
        </div>
      )}
    </div>
  );
};
