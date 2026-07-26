import React from 'react';
import { AbilityScores, calculateModifier } from '../../lib/abilityScores';

interface StatBlockScoresTableProps {
  abilityScores: AbilityScores;
}

export const StatBlockScoresTable: React.FC<StatBlockScoresTableProps> = ({ abilityScores }) => {
  const abilities = [
    { label: 'STR', value: abilityScores.STR },
    { label: 'DEX', value: abilityScores.DEX },
    { label: 'CON', value: abilityScores.CON },
    { label: 'INT', value: abilityScores.INT },
    { label: 'WIS', value: abilityScores.WIS },
    { label: 'CHA', value: abilityScores.CHA },
  ];

  return (
    <div className="w-full overflow-hidden border border-[#e2e8f0] rounded-xl shadow-sm">
      <table className="w-full border-collapse font-sans">
        <thead>
          <tr className="bg-[#f9f8ff]">
            {abilities.map((ability) => (
              <th
                key={ability.label}
                className="py-1.5 px-1 text-center border-b border-[#e2e8f0] border-r last:border-r-0"
              >
                <div className="text-xs font-bold uppercase tracking-widest text-[#8d8db9]">
                  {ability.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {abilities.map((ability) => {
              const mod = calculateModifier(ability.value);
              const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
              return (
                <td key={ability.label} className="py-2 px-1 text-center border-r last:border-r-0">
                  <div className="text-lg font-bold text-slate-900 leading-tight">
                    {ability.value}
                  </div>
                  <div className="text-sm font-medium text-[#8d8db9] leading-tight">
                    ({modStr})
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
