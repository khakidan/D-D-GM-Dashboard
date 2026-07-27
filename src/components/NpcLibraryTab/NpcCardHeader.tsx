import React from 'react';
import { Heart, Shield, Star } from 'lucide-react';
import { DebouncedInput } from '../ui/DebouncedInput';
import { CardHeaderChevron } from '../ui/CardHeaderChevron';
import { Badge } from '../ui/Badge';

export interface NpcCardHeaderProps {
  name: string;
  ac: number;
  maxHp: number;
  challengeRating?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSyncing: boolean;
  onUpdateName: (val: string) => void;
}

export const NpcCardHeader: React.FC<NpcCardHeaderProps> = ({
  name,
  ac,
  maxHp,
  challengeRating,
  isExpanded,
  onToggleExpand,
  isSyncing,
  onUpdateName,
}) => {
  return (
    <div className="p-4 flex items-center justify-between gap-3 px-5">
      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <DebouncedInput
            type="text"
            value={name}
            variant="inline"
            onChange={(val) => onUpdateName(val as string)}
            className="text-lg font-bold text-[#0f172a] font-serif w-full truncate disabled:opacity-50"
            disabled={isSyncing}
          />
        </div>

        {!isExpanded && (
          <div className="flex items-center gap-4 pl-4 border-l border-[#e2e8f0] whitespace-nowrap">
            {challengeRating && (
              <Badge color="slate" size="compact" className="hidden sm:inline-flex shrink-0">
                CR {challengeRating}
              </Badge>
            )}
            <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#2563eb]">
              <Heart className="w-4 h-4" />
              {maxHp}
            </div>
            <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#8d8db9]">
              <Shield className="w-4 h-4 opacity-50" />
              {ac}
            </div>
          </div>
        )}
      </div>

      <CardHeaderChevron isExpanded={isExpanded} onToggleExpand={onToggleExpand} label="NPC card" />
    </div>
  );
};
