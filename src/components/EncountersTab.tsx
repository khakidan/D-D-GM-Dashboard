import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Swords, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { Callout } from './ui/Callout';
import { EmptyState } from './ui/EmptyState';
import { useEncounters } from './EncountersTab/hooks/useEncounters';
import { EncounterCard } from './EncountersTab/EncounterCard';
import { NewEncounterDialog } from './EncountersTab/NewEncounterDialog';
import { DifficultyLevel } from '../types';
import { DashboardLayout } from './ui/DashboardLayout';

export function EncountersTab({ 
  onSelectEncounter, 
  onSyncRequested 
}: { 
  onSelectEncounter: (id: string) => void;
  onSyncRequested: () => Promise<void>; 
}) {
  const { state: appState, updateState } = useAppState();
  const {
    state,
    isAdding,
    isDeletingId,
    globalError,
    completedEncounterIds,
    handleCreateEncounter,
    handleDelete,
    handleUpdateEncounter,
  } = useEncounters({ onSelectEncounter, onSyncRequested });

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  useEffect(() => {
    if (appState.openDialog === 'newEncounter') {
      setIsNewDialogOpen(true);
      updateState(prev => ({ ...prev, openDialog: null }));
    }
  }, [appState.openDialog, updateState]);

  const difficulties: DifficultyLevel[] = Object.entries(state.difficulties).map(([id, name]) => ({
    id: parseInt(id),
    name: name as string
  }));

  return (
    <DashboardLayout
      title="Encounters"
      description="Manage your campaign encounters. Tap to view details or trigger dynamic combat."
      actions={
        <Button 
          onClick={() => setIsNewDialogOpen(true)}
          disabled={isAdding}
          loading={isAdding}
          loadingLabel="Adding..."
          intent="primary"
          id="new-encounter-btn"
          className="flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> New Encounter
        </Button>
      }
    >
      {globalError && (
        <Callout severity="error" className="mb-6">
          <p>{globalError}</p>
        </Callout>
      )}

      {state.encounters.length === 0 ? (
        <EmptyState
          icon={Swords}
          title="No encounters found"
          description="Your encounter library is empty. Start by creating a new scenario for your players to overcome."
          actionLabel="Create Your First Encounter"
          onAction={() => setIsNewDialogOpen(true)}
          actionDisabled={isAdding}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {state.encounters.map(enc => (
            <EncounterCard 
              key={enc.id} 
              enc={enc} 
              isCompleted={completedEncounterIds.has(enc.id)}
              isDeleting={isDeletingId === enc.id}
              encounterCombatants={appState.encounterCombatants}
              difficulties={state.difficulties}
              onDelete={handleDelete} 
              onStart={(e) => onSelectEncounter(e.id)} 
              onSyncRequested={onSyncRequested} 
              onUpdate={handleUpdateEncounter}
            />
          ))}
        </div>
      )}

      <NewEncounterDialog
        isOpen={isNewDialogOpen}
        onClose={() => setIsNewDialogOpen(false)}
        onConfirm={(data) => {
          handleCreateEncounter(data);
          setIsNewDialogOpen(false);
        }}
        difficulties={difficulties}
      />
    </DashboardLayout>
  );
}
