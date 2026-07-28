import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, RefreshCcw, Zap, Swords, HelpCircle } from 'lucide-react';
import { Encounter, DamageType } from '../../types';
import { cn } from '../../lib/utils';
import { MultiTargetActionPanel } from './MultiTargetActionPanel';
import { ToggleBadge } from '../ui/ToggleBadge';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { Button } from '../ui/Button';

interface CombatHeaderProps {
  encounter?: Encounter;
  round: number;
  isMultiTargetMode: boolean;
  selectedCount: number;
  onOpenTools: () => void;
  onRollNpcInit: () => void;
  onResetCombat: () => void;
  onRecordEncounter: () => void;
  onCancelEncounter: () => void;
  onNextTurn: () => void;
  onToggleMultiTargetMode: () => void;
  onDeleteSelected: () => void;
  onCancelSelection: () => void;
  onBack: () => void;
  onCallInitiative: () => void;
  initiativeEvent: boolean;
  onOpenCheatSheet?: () => void;
  onApplyDamage?: (amount: number, type: DamageType | null) => void;
  onApplyHealing?: (amount: number) => void;
  onApplyCondition?: (condition: string) => void;
}

export function CombatHeader({
  encounter,
  round,
  isMultiTargetMode,
  selectedCount,
  onOpenTools,
  onRollNpcInit,
  onResetCombat,
  onRecordEncounter,
  onCancelEncounter,
  onNextTurn,
  onToggleMultiTargetMode,
  onDeleteSelected,
  onCancelSelection,
  onBack,
  onCallInitiative,
  initiativeEvent,
  onOpenCheatSheet,
  onApplyDamage,
  onApplyHealing,
  onApplyCondition,
}: CombatHeaderProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  return (
    <div className="bg-[#ffffff] border-b border-[#e2e8f0] flex flex-col w-full">
      <div className="p-6 flex flex-col gap-4">
        {/* Row 1: Title and Round Information on the left, Back button on the right */}
        <div className="flex flex-row items-start justify-between w-full">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <div className="flex items-center gap-4 flex-wrap h-8">
              <h2 className="text-xl font-bold text-[#0f172a] font-sans">{encounter ? encounter.name : 'Running Combat'}</h2>
              <div className="bg-white border border-[#e2e8f0] px-3 py-1 rounded-full text-[10px] text-[#8d8db9] uppercase font-sans tracking-wider font-bold">
                Round {round}
              </div>
            </div>
            {encounter && (
              <div className="text-xs text-[#8d8db9] font-sans italic opacity-70 mt-1">
                {encounter.location} &bull; {encounter.difficultyName}
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex-shrink-0 self-start h-8 flex items-center">
            <Button
              intent="tertiary"
              onClick={onBack}
              className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1 p-0 h-auto font-normal"
            >
              <span>&larr;</span>
              <span>Back to Encounters</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Buttons row */}
        <div className="flex flex-row items-center flex-wrap gap-2 justify-center w-full">
          {/* SELECT BUTTON */}
          <ToggleBadge
            active={isMultiTargetMode}
            activeColor="amber"
            inactiveColor="gray"
            onClick={onToggleMultiTargetMode}
            className="gap-2 px-4 py-1.5 text-xs font-sans h-8"
          >
            <Zap className={cn("w-3 h-3", isMultiTargetMode ? "fill-current" : "")} />
            <span>Select</span>
            <span className={cn(
              "text-[9px] px-1 py-0.5 rounded border font-mono",
              isMultiTargetMode 
                ? "bg-[#2563eb]/20 border-[#2563eb]/30" 
                : "bg-stone-100 border-stone-200"
            )}>S</span>
          </ToggleBadge>

          {/* TOOLS BUTTON */}
          <Button
            intent="secondary"
            onClick={onOpenTools}
            className="text-xs font-medium px-2 py-1 border border-gray-300 text-gray-500 rounded hover:text-gray-700 hover:border-gray-400 bg-transparent hover:bg-transparent flex items-center gap-1.5 transition-colors shadow-none"
          >
            <span>Tools</span>
            <span className="text-[9px] bg-stone-100 px-1 py-0.5 rounded border border-gray-200 font-mono">T</span>
          </Button>

          {/* BROADCAST LINK BUTTON */}
          <Link
            to="/player-view"
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-[#8d8db9] hover:bg-[#3f3f37] text-white rounded-full transition-colors"
          >
            <Eye className="w-3 h-3" />
            <span>Broadcast</span>
            <span className="text-[9px] bg-white/20 px-1 py-0.5 rounded border border-white/20 font-mono">B</span>
          </Link>

          {/* CALL FOR INITIATIVE BUTTON */}
          <Button
            intent="tertiary"
            onClick={onCallInitiative}
            disabled={initiativeEvent}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-sans font-bold uppercase bg-[#f9f8ff] border border-[#2563eb] text-[#2563eb] hover:bg-[#f0f7ff] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all font-bold"
            title="Trigger full-screen cinematic initiative call for all players"
          >
            <Swords className="w-3 h-3" />
            <span>Call for Initiative</span>
            <span className="text-[9px] bg-[#f9f8ff] px-1 py-0.5 rounded border border-[#2563eb]/20 font-mono">C</span>
          </Button>

          {/* ROLL NPC INIT BUTTON */}
          <Button
            intent="secondary"
            onClick={onRollNpcInit}
            className="text-xs font-medium px-2 py-1 border border-[#e2e8f0] text-[#8d8db9] rounded hover:text-[#0f172a] hover:border-[#2563eb] bg-transparent hover:bg-transparent flex items-center gap-1.5 transition-colors shadow-none"
            title="Roll 1d20 for all NPCs"
          >
            <span>Roll NPC Init</span>
            <span className="text-[9px] bg-[#f9f8ff] px-1 py-0.5 rounded border border-[#e2e8f0] font-mono text-[#8d8db9]">R</span>
          </Button>

          {/* RECORD / END ENCOUNTER BUTTON */}
          {encounter?.loggingRequested ? (
            <Button
              intent="secondary"
              onClick={onResetCombat}
              className="text-xs font-medium px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 bg-transparent flex items-center gap-1.5 transition-colors shadow-none"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>End Encounter</span>
            </Button>
          ) : (
            <Button
              intent="secondary"
              onClick={onRecordEncounter}
              className="text-xs font-medium px-2 py-1 border border-gray-300 text-gray-500 rounded hover:text-gray-700 hover:border-gray-400 bg-transparent hover:bg-transparent flex items-center gap-1.5 transition-colors shadow-none"
            >
              <span>Record Encounter</span>
            </Button>
          )}

          {/* CANCEL ENCOUNTER BUTTON */}
          <Button
            intent="destructive"
            onClick={() => setIsConfirmOpen(true)}
            className="uppercase text-xs font-bold px-3 py-2"
          >
            Cancel Encounter
          </Button>
          <ConfirmationDialog
            isOpen={isConfirmOpen}
            title="Cancel Encounter?"
            description="The combat log will be discarded and this cannot be undone."
            confirmLabel="Cancel Encounter"
            onConfirm={onCancelEncounter}
            onClose={() => setIsConfirmOpen(false)}
          />

          {/* NEXT TURN BUTTON */}
          <Button
            intent="primary"
            onClick={onNextTurn}
            className="flex items-center gap-2 px-4 py-2 text-xs font-sans font-bold uppercase hover:bg-[#567eff] rounded-full transition-colors shadow-sm"
          >
            <span>Next Turn</span>
            <span className="text-[9px] bg-[#2563eb]/20 px-1 py-0.5 rounded border border-[#2563eb]/30 font-mono">N</span>
          </Button>
        </div>
      </div>

      {isMultiTargetMode && (
        <MultiTargetActionPanel
          selectedCount={selectedCount}
          onApplyDamage={onApplyDamage || (() => {})}
          onApplyHealing={onApplyHealing || (() => {})}
          onApplyCondition={onApplyCondition || (() => {})}
          onDeleteSelected={onDeleteSelected}
          onCancelSelection={onCancelSelection}
        />
      )}
    </div>
  );
}
