import { useEffect } from 'react';
import { syncProficiencyBonusToCR } from '../lib/abilityScores';

interface UseNpcCrAutomationParams {
  challengeRating: string;
  proficiencies: string;
  onChange: (updatedProficiencies: string) => void;
}

export function useNpcCrAutomation({
  challengeRating,
  proficiencies,
  onChange,
}: UseNpcCrAutomationParams) {
  useEffect(() => {
    if (!challengeRating) return;
    try {
      const updated = syncProficiencyBonusToCR(proficiencies, challengeRating);
      if (updated !== proficiencies) {
        onChange(updated);
      }
    } catch {
      // silently ignore invalid CR strings
    }
  }, [challengeRating]);
}
