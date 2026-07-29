import React from 'react';
import { AbilityScores, AbilityName, calculateModifier } from '../../lib/abilityScores';

function AbilityScoreInput({
  value,
  onChange,
  id,
  ariaLabel,
}: {
  value: number;
  onChange: (val: number) => void;
  id?: string;
  ariaLabel?: string;
}) {
  const [local, setLocal] = React.useState(String(value));

  React.useEffect(() => {
    setLocal(String(value));
  }, [value]);

  const commit = () => {
    const parsed = parseInt(local, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(1, Math.min(30, parsed)));
    } else {
      setLocal(String(value));
    }
  };

  return (
    <input
      type="number"
      min="1"
      max="30"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }}
      onFocus={e => e.target.select()}
      className="bg-transparent border border-transparent rounded text-slate-900 text-lg font-bold text-center w-full focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/30 focus:outline-none"
      id={id}
      aria-label={ariaLabel}
    />
  );
}

interface StatBlockScoresTableProps {
  abilityScores: AbilityScores;
  onScoreChange?: (ability: AbilityName, value: number) => void;
}

export const StatBlockScoresTable: React.FC<StatBlockScoresTableProps> = ({
  abilityScores,
  onScoreChange,
}) => {
  const abilities: { label: AbilityName; value: number }[] = [
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
                  {onScoreChange ? (
                    <AbilityScoreInput
                      value={ability.value}
                      onChange={(val) => onScoreChange(ability.label, val)}
                      id={`ability-score-${ability.label.toLowerCase()}`}
                      ariaLabel={`${ability.label} score`}
                    />
                  ) : (
                    <div className="text-lg font-bold text-slate-900 leading-tight">
                      {ability.value}
                    </div>
                  )}
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
