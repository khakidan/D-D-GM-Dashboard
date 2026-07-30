// src/components/settings/GMTestingTools.tsx

import { Skull, Zap, Heart, Moon, Flame, Dice6, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useDashboardStore } from '../../hooks/dashboardStore';
import { fetchSpreadsheetMetadata, batchUpdateSpreadsheet } from '../../services/dbOperations/shared';
import { updateNpcFullDB } from '../../services/dbOperations/npcs';
import { reconstructChallengeRating } from '../../lib/challengeRatingRepair';
import { resolveActiveSpreadsheetId } from '../../services/sheetsService';
import { toast } from 'sonner';
import { SettingsPanel } from '../ui/SettingsPanel';

interface GMTestingToolsProps {
  fireDeathEvent: (payload: { characterName: string }) => void;
  fireDamageEvent: (payload: { combatantNames: string[]; damageAmount: number; damageType?: string }) => void;
  fireHealEvent: (payload: { combatantNames: string[]; healAmount: number }) => void;
  fireUnconsciousEvent: (payload: { characterName: string }) => void;
  fireRageEvent: (payload: { characterName: string }) => void;
  fireInitiativeEvent: (isActive: true) => void;
}

export function GMTestingTools({
  fireDeathEvent,
  fireDamageEvent,
  fireHealEvent,
  fireUnconsciousEvent,
  fireRageEvent,
  fireInitiativeEvent,
}: GMTestingToolsProps) {
  return (
    <div className="space-y-6">
      <SettingsPanel id="gm-tools-testing-section">
      <div>
        <h3 className="text-lg font-bold text-[#0f172a] font-serif pb-1">GM Tools & Testing</h3>
        <p className="text-xs text-[#8d8db9]">
          Utility actions for testing presentation effects and validating active overlays.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          id="test-death-animation-btn"
          type="button"
          onClick={() => {
            fireDeathEvent({ characterName: 'Aldric the Brave' });
            toast('Death animation triggered', {
              description: 'Check the Player View to see the overlay.',
              duration: 3000,
            });
          }}
          className="border border-[#e2e8f0] hover:bg-[#f9f8ff] text-[#8d8db9] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Skull className="w-4 h-4" />
          Test Death Animation
        </button>

        <button
          id="test-damage-animation-btn"
          type="button"
          onClick={() => {
            fireDamageEvent({ combatantNames: ['Thorin Ironforge'], damageAmount: 47 });
            toast('Damage animation triggered — check the Player View.', {
              duration: 3000,
            });
          }}
          className="border border-[#e2e8f0] hover:bg-[#f9f8ff] text-[#8d8db9] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Test Damage Animation
        </button>

        <button
          id="test-heal-animation-btn"
          type="button"
          onClick={() => {
            fireHealEvent({ combatantNames: ['Seraphina Brightwell'], healAmount: 34 });
            toast('Heal animation triggered — check the Player View.', {
              duration: 3000,
            });
          }}
          className="border border-[#eef5e6] bg-[#f8fbf5] hover:bg-[#f2f8ec] text-[#2e5a2c] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Heart className="w-4 h-4" />
          Test Heal Animation
        </button>

        <button
          id="test-unconscious-animation-btn"
          type="button"
          onClick={() => {
            fireUnconsciousEvent({ characterName: 'Gareth of Stonehaven' });
            toast('Unconscious animation triggered — check the Player View.', {
              duration: 3000,
            });
          }}
          className="border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#475569] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Moon className="w-4 h-4" />
          Test Unconscious Animation
        </button>

        <button
          id="test-rage-animation-btn"
          type="button"
          onClick={() => {
            fireRageEvent({ characterName: 'Bjorn the Unbroken' });
            toast('Rage animation triggered — check the Player View.', {
              duration: 3000,
            });
          }}
          className="border border-[#ffcdce] bg-[#fff5f5] hover:bg-[#ffeded] text-[#9b2c2c] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Flame className="w-4 h-4" />
          Test Rage Animation
        </button>

        <button
          id="test-initiative-animation-btn"
          type="button"
          onClick={() => {
            fireInitiativeEvent(true);
            toast('Toggle initiative animation');
          }}
          className="border border-[#2563eb] bg-[#f9f8ff]/50 hover:bg-[#f1f5f9] text-[#2563eb] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Dice6 className="w-4 h-4" />
          Test Initiative Animation
        </button>
      </div>
    </SettingsPanel>
      <ChallengeRatingRepair />
    </div>
  );
}



function ChallengeRatingRepair() {
  const [isScanning, setIsScanning] = useState(false);
  const [repairCandidates, setRepairCandidates] = useState<{ id: string, name: string, corruptedValue: string, proposedValue: string }[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  
  const npcs = useDashboardStore(s => s.npcs);
  const updateState = useDashboardStore(s => s.updateState);

  const handleScan = async () => {
    setIsScanning(true);
    setHasScanned(false);
    try {
      const campaignId = resolveActiveSpreadsheetId();
      if (!campaignId) throw new Error('No active campaign');

      const metadata = await fetchSpreadsheetMetadata(campaignId);
      const npcsSheet = metadata.sheets?.find((s: any) => s.properties?.title === 'NPCs');
      if (!npcsSheet) throw new Error('NPCs sheet not found in metadata.');
      const sheetId = npcsSheet.properties.sheetId;

      await batchUpdateSpreadsheet(campaignId, [
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              startColumnIndex: 16,
              endColumnIndex: 17
            },
            cell: {
              userEnteredFormat: {
                numberFormat: {
                  type: 'TEXT'
                }
              }
            },
            fields: 'userEnteredFormat.numberFormat'
          }
        }
      ]);

      const candidates = [];
      for (const npc of npcs) {
        const crNumber = Number(npc.challengeRating);
        if (!isNaN(crNumber) && npc.challengeRating.trim() !== '') {
          const { match } = reconstructChallengeRating(crNumber);
          if (match) {
            candidates.push({
              id: npc.id,
              name: npc.name,
              corruptedValue: npc.challengeRating,
              proposedValue: match
            });
          }
        }
      }
      
      setRepairCandidates(candidates);
      setHasScanned(true);
      toast.success('Scan complete', { description: `Found ${candidates.length} corrupted Challenge Ratings.` });
    } catch (error: any) {
      console.error('Scan failed:', error);
      toast.error('Scan failed', { description: error.message });
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmRepair = async (candidateId: string, proposedValue: string) => {
    const npc = npcs.find(n => n.id === candidateId);
    if (!npc) return;
    
    try {
      const campaignId = resolveActiveSpreadsheetId();
      if (!campaignId) throw new Error('No active campaign');

      const updatedNpc = { ...npc, challengeRating: proposedValue };
      await updateNpcFullDB(campaignId, updatedNpc);
      updateState(prev => ({
        ...prev,
        npcs: prev.npcs.map(n => n.id === candidateId ? updatedNpc : n)
      }));
      
      setRepairCandidates(prev => prev.filter(c => c.id !== candidateId));
      toast.success('NPC Repaired', { description: `${npc.name}'s Challenge Rating updated to ${proposedValue}.` });
    } catch (error: any) {
      console.error('Repair failed:', error);
      toast.error('Repair failed', { description: error.message });
    }
  };

  return (
    <SettingsPanel id="gm-tools-cr-repair-section">
      <div>
        <h3 className="text-lg font-bold text-[#0f172a] font-serif pb-1">Data Repair Tools</h3>
        <p className="text-xs text-[#8d8db9]">
          Scan for and repair corrupted Challenge Rating values (e.g. fraction values converted to dates by Google Sheets).
        </p>
      </div>
      
      <div className="mt-4">
        <button
          id="scan-cr-corruption-btn"
          type="button"
          onClick={handleScan}
          disabled={isScanning}
          className="border border-[#2563eb] bg-[#f9f8ff]/50 hover:bg-[#f1f5f9] text-[#2563eb] font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Wrench className="w-4 h-4" />
          {isScanning ? 'Scanning...' : 'Scan for Corrupted CRs'}
        </button>
      </div>

      {hasScanned && repairCandidates.length === 0 && (
        <div className="mt-4 text-sm text-[#2e5a2c] bg-[#f8fbf5] p-3 rounded-lg border border-[#eef5e6]">
          No corrupted Challenge Ratings found.
        </div>
      )}

      {repairCandidates.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-bold text-[#0f172a]">Repair Candidates Found ({repairCandidates.length})</h4>
          <div className="divide-y divide-[#e2e8f0] border border-[#e2e8f0] rounded-xl overflow-hidden">
            {repairCandidates.map(c => (
              <div key={c.id} className="p-3 bg-white flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-[#0f172a]">{c.name}</div>
                  <div className="text-xs text-[#8d8db9]">
                    Value: <span className="line-through text-red-500 mr-1">{c.corruptedValue}</span> 
                    → <span className="font-bold text-[#2563eb]">{c.proposedValue}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRepairCandidates(prev => prev.filter(cand => cand.id !== c.id))}
                    className="px-3 py-1.5 text-xs font-bold text-[#475569] bg-[#f8fafc] hover:bg-[#e2e8f0] rounded-md transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => handleConfirmRepair(c.id, c.proposedValue)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-md transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SettingsPanel>
  );
}
