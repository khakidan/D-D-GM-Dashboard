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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse font-sans">
        <thead>
          <tr className="border-b border-[#e2e8f0]">
            {abilities.map((ability) => (
              <th
                key={ability.label}
                className="py-1.5 px-1 text-center text-[10px] font-bold uppercase tracking-widest text-[#8d8db9]"
              >
                {ability.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {abilities.map((ability) => {
              const mod = calculateModifier(ability.value);
              const modStr = mod >= 0 ? `(+${mod})` : `(${mod})`;
              return (
                <td key={ability.label} className="py-2 px-1 text-center">
                  <div className="text-sm font-bold text-slate-900 leading-tight">
                    {ability.value}
                  </div>
                  <div className="text-[10px] font-medium text-[#8d8db9] leading-tight">
                    {modStr}
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
