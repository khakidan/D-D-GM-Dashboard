import React from 'react';
import { cn } from '../../lib/utils';
import { StatBlock } from './StatBlock';
import type { NpcFormData } from './NpcFormFields';
import { 
  AbilityScores, 
  Proficiencies, 
  serializeAbilityScores, 
  serializeProficiencies 
} from '../../lib/abilityScores';

interface NpcAbilitiesTabProps {
  data: NpcFormData;
  onChange: (data: NpcFormData) => void;
  parsedAbilityScores: AbilityScores;
  parsedProficiencies: Proficiencies;
  compact?: boolean;
}

export const NpcAbilitiesTab: React.FC<NpcAbilitiesTabProps> = ({
  data,
  onChange,
  parsedAbilityScores,
  parsedProficiencies,
  compact = false,
}) => {
  return (
    <div className={cn("space-y-4", compact && "space-y-2")} id="npc-abilities-tab">
      <StatBlock
        abilityScores={parsedAbilityScores}
        proficiencies={parsedProficiencies}
        readOnly={false}
        onChange={(scores, profs) => {
          onChange({
            ...data,
            abilityScores: serializeAbilityScores(scores),
            proficiencies: serializeProficiencies(profs),
          });
        }}
      />
    </div>
  );
};
