import React, { Suspense } from 'react';
import { SettingsPage } from './settings/SettingsPage';
import { ErrorBoundary } from './ErrorBoundary';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

const PartyTab = React.lazy(() => import('./PartyTab').then(m => ({ default: m.PartyTab })));
const NpcLibraryTab = React.lazy(() => import('./NpcLibraryTab').then(m => ({ default: m.NpcLibraryTab })));
const EncountersTab = React.lazy(() => import('./EncountersTab').then(m => ({ default: m.EncountersTab })));
const ActiveEncounterTab = React.lazy(() => import('./ActiveEncounterTab').then(m => ({ default: m.ActiveEncounterTab })));

const TabLoadingFallback = () => (
  <div className="w-full h-[50vh] flex flex-col items-center justify-center gap-3 bg-white font-sans select-none" id="tab-loading-fallback">
    <RefreshCw className="w-7 h-7 text-[#2563eb] animate-spin" />
    <span className="text-xs text-[#8d8db9] font-semibold uppercase tracking-wider">
      Loading Tab...
    </span>
  </div>
);

export interface GMTabContentProps {
  activeTab: 'party' | 'encounters' | 'npc-library' | 'combat' | 'settings' | 'npcs';
  hasActiveEncounter: boolean;
  clearEncounter: () => void;
  startEncounter: (id: string) => void;
  isGoogleConnected: boolean;
  handleSignIn: () => void;
  handleSignOut: () => void;
  setIsGoogleConnected: (connected: boolean) => void;
  handleSyncWithSheets: (forcePrompt?: boolean) => Promise<void>;
  addLog: (log: string) => void;
}

export function GMTabContent({
  activeTab,
  hasActiveEncounter,
  clearEncounter,
  startEncounter,
  isGoogleConnected,
  handleSignIn,
  handleSignOut,
  setIsGoogleConnected,
  handleSyncWithSheets,
  addLog,
}: GMTabContentProps) {
  if ((activeTab === 'combat') && hasActiveEncounter) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<TabLoadingFallback />}>
          <ActiveEncounterTab onBack={clearEncounter} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (activeTab === 'party') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<TabLoadingFallback />}>
          <PartyTab />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (activeTab === 'npc-library' || activeTab === 'npcs') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<TabLoadingFallback />}>
          <NpcLibraryTab />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (activeTab === 'settings') {
    return (
      <ErrorBoundary>
        <SettingsPage
          isGoogleConnected={isGoogleConnected}
          handleSignIn={handleSignIn}
          handleSignOut={handleSignOut}
          setIsGoogleConnected={setIsGoogleConnected}
          handleSyncWithSheets={handleSyncWithSheets}
          addLog={addLog}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<TabLoadingFallback />}>
        <EncountersTab
          onSelectEncounter={startEncounter}
          onSyncRequested={async () => {
            toast.promise(handleSyncWithSheets(false), {
              loading: 'Syncing with Google Sheets...',
              success: 'Sync complete',
              error: 'Sync failed — changes saved locally',
            });
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
