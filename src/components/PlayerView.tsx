import { parseCommaSeparatedList } from '../lib/stringUtils';
import { getHealthStatus } from '../lib/conditions';
import { useAppState } from '../hooks/useAppState';
import { cn } from '../lib/utils';
import { Skull, Heart, ShieldAlert, Shield, Swords, HeartCrack, ShieldCheck } from 'lucide-react';
import { motion } from "motion/react";
import { EmptyState } from './ui/EmptyState';
import { CardShell } from './ui/CardShell';
import { Badge } from './ui/Badge';
import { PipTracker } from './ui/PipTracker';

const healthStatusMap: Record<string, 'emerald' | 'green' | 'yellow' | 'red' | 'gray'> = {
  Full: 'emerald',
  Defeated: 'red',
  Healthy: 'green',
  Injured: 'yellow',
  Bloodied: 'red',
};

const formatConditionsForDisplay = (conditions: string): string =>
  parseCommaSeparatedList(conditions)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(', ');

export function PlayerView() {
  const { state: appState } = useAppState();
  const state = appState.combatState;

  if (!state.activeEncounterId || state.combatants.length === 0) {
    return (
      <motion.div
        className="min-h-screen bg-[#ffffff] p-8 flex flex-col items-center justify-center text-center"
        animate={{
          y: [0, -30, 0, 30, 0],
          x: [0, -30, 0, 30, 0],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Swords className="w-32 h-32 text-[#8d8db9] opacity-20 mb-8" />
        <h2 className="text-5xl font-serif font-bold text-[#0f172a] mb-4">Waiting for GM to start the encounter...</h2>
        <p className="text-3xl text-[#8d8db9] max-w-2xl">The GM has not activated combat yet. Standby...</p>
      </motion.div>
    );
  }

  const renderTable = (combatants: typeof state.combatants, isSecondary: boolean = false) => (
    <CardShell className="overflow-hidden h-fit">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#e2e8f0] border-b border-[#e2e8f0] text-[#475569] font-sans text-base uppercase tracking-widest text-left">
            <th className="p-4 font-bold w-16 text-center border-r border-[#e2e8f0]">Init</th>
            <th className="p-4 font-bold px-6">Combatant</th>
            <th className="p-4 font-bold text-center">Status</th>
            <th className="p-4 font-bold w-28 text-center min-w-[7rem]">HP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0] font-sans text-lg">
          {combatants.map((c) => {
            const isActive = c.id === state.activeTurnId;
            const health = getHealthStatus(c.currentHp, c.maxHp);
            const isDead = c.currentHp <= 0;
            const isPcDefeated = c.type === 'pc' && (c.deathSavesFails || 0) >= 3;
            const showPcStable = c.type === 'pc' && c.currentHp <= 0 && !isPcDefeated && c.isStable;
            const showPcUnconscious = c.type === 'pc' && c.currentHp <= 0 && !isPcDefeated && !c.isStable;

            return (
              <tr 
                key={c.id} 
                className={cn(
                  "transition-colors",
                  isActive ? "bg-[#f9f8ff]" : "bg-white",
                  isDead && "opacity-60"
                )}
              >
                <td className="p-4 border-r border-[#e2e8f0]">
                  <div className={cn(
                    "w-12 h-12 mx-auto rounded-full flex items-center justify-center font-bold text-2xl border transition-all shadow-sm",
                    isActive ? "bg-[#2563eb] border-transparent text-white scale-110" : "bg-white border-[#e2e8f0] text-[#475569]"
                  )}>
                    {c.initiative}
                  </div>
                </td>
                <td className="p-4 px-5">
                  <div className="flex flex-col items-start gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {isActive && <div className="w-2 h-2 rounded-full bg-[#2563eb] shrink-0"></div>}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className={cn(
                            "font-bold text-2xl md:text-3xl truncate transition-colors",
                            isActive ? "text-[#2563eb]" : "text-[#0f172a]",
                            isDead && "line-through text-[#64748b]"
                          )}>
                            {c.name}
                          </span>
                        </div>
                        {c.conditions && !isPcDefeated && !showPcStable && (
                          <div 
                            className="text-xl text-red-700 font-bold italic mt-1 truncate max-w-[300px]" 
                            title={formatConditionsForDisplay(c.conditions)}
                          >
                            {formatConditionsForDisplay(c.conditions)}
                          </div>
                        )}
                      </div>
                    </div>
                    {c.type === 'pc' && c.currentHp <= 0 && !isPcDefeated && !c.isStable && (
                      <div className="flex flex-col gap-2 mt-1 select-none shrink-0">
                        <div className="flex items-center gap-4 text-2xl md:text-3xl font-bold font-sans">
                          <span className="text-red-900 uppercase tracking-wide min-w-[140px] md:min-w-[170px]">FAILS</span>
                          <PipTracker
                            max={3}
                            remaining={c.deathSavesFails || 0}
                            color="red"
                            size="large"
                            readOnly
                            label="Death save failure"
                          />
                        </div>
                        <div className="flex items-center gap-4 text-2xl md:text-3xl font-bold font-sans">
                          <span className="text-emerald-900 uppercase tracking-wide min-w-[140px] md:min-w-[170px]">SUCCESSES</span>
                          <PipTracker
                            max={3}
                            remaining={c.deathSavesSuccesses || 0}
                            color="emerald"
                            size="large"
                            readOnly
                            label="Death save success"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4 font-bold text-base uppercase tracking-wider">
                <div className="flex justify-center">
                  {isPcDefeated ? (
                    <Badge color="gray" size="large" className="gap-2">
                      <Skull className="w-8 h-8" />
                      <span>Dead</span>
                    </Badge>
                  ) : showPcStable ? (
                    <Badge color="blue" size="large" className="gap-2">
                      <ShieldCheck className="w-8 h-8" />
                      <span>Stable</span>
                    </Badge>
                  ) : showPcUnconscious ? (
                    <Badge color="orange" size="large" className="gap-2">
                      <HeartCrack className="w-8 h-8" />
                      <span>Unconscious</span>
                    </Badge>
                  ) : (
                    <Badge color={healthStatusMap[health.label] || 'gray'} size="large" className="gap-2">
                      {isDead ? <Skull className="w-8 h-8" /> : (['Full', 'Healthy'].includes(health.label) ? <Heart className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />)}
                      <span>{health.label}</span>
                    </Badge>
                  )}
                </div>
                </td>
                <td className="p-4 text-center text-xl md:text-2xl min-w-[7rem] whitespace-nowrap">
                  {c.type === 'pc' ? (
                    <div className="font-sans font-bold text-[#0f172a] flex items-center justify-center gap-2 whitespace-nowrap">
                      <span>{c.currentHp} <span className="text-[#64748b] opacity-70">/ {c.maxHp}</span></span>
                      {c.tempHp && c.tempHp > 0 ? (
                        <span 
                          className="inline-flex items-center gap-1.5 bg-blue-50 border-2 border-blue-400 rounded-full px-3 py-1 text-lg md:text-xl font-black text-blue-800 shadow-sm shrink-0 select-none animate-none"
                          data-testid="player-temphp-pill"
                        >
                          <Shield className="w-6 h-6 md:w-7 md:h-7 text-blue-600 fill-blue-100" />
                          <span>{c.tempHp}</span>
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-[#64748b] opacity-50 font-bold text-lg">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </CardShell>
  );

  const useTwoCols = state.combatants.length > 10;
  const firstHalf = useTwoCols ? state.combatants.slice(0, Math.ceil(state.combatants.length / 2)) : state.combatants;
  const secondHalf = useTwoCols ? state.combatants.slice(Math.ceil(state.combatants.length / 2)) : [];

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#0f172a] p-4 md:p-8 font-serif flex flex-col items-center">
      
      <div className="w-full max-w-7xl mb-8 flex items-center justify-center">
        <div className="flex items-center gap-4 text-[#475569] bg-white border border-[#e2e8f0] px-8 py-3 rounded-full shadow-sm">
          <Shield className="w-7 h-7 opacity-70" />
          <span className="text-lg uppercase tracking-widest font-sans font-bold">Round {state.round}</span>
        </div>
      </div>

      <div className={cn(
        "w-full",
        !useTwoCols && "max-w-7xl",
        useTwoCols && "grid grid-cols-1 lg:grid-cols-2 gap-6"
      )}>
        {state.combatants.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="Peace reigns... for now."
            className="col-span-full"
          />
        ) : (
          <>
            {renderTable(firstHalf)}
            {useTwoCols && renderTable(secondHalf, true)}
          </>
        )}
      </div>

    </div>
  );
}
