import { NpcAction, NpcReaction } from '../types';

export function resetActionUsages(
  jsonBlob: string | undefined,
  restType: 'short' | 'long'
): string {
  if (!jsonBlob || typeof jsonBlob !== 'string' || jsonBlob.trim() === '') {
    return '[]';
  }

  try {
    const parsed = JSON.parse(jsonBlob);
    if (!Array.isArray(parsed)) {
      return '[]';
    }

    let hasChanges = false;
    const updated = parsed.map((item: NpcAction | NpcReaction) => {
      if (item.maxUses !== undefined && typeof item.maxUses === 'number') {
        const resetType = item.usesReset;
        const shouldReset = restType === 'long' 
          ? (resetType === 'short' || resetType === 'long')
          : resetType === 'short';

        if (shouldReset && item.currentUses !== item.maxUses) {
          hasChanges = true;
          return { ...item, currentUses: item.maxUses };
        }
      }
      return item;
    });

    return hasChanges ? JSON.stringify(updated) : jsonBlob;
  } catch {
    return '[]';
  }
}
