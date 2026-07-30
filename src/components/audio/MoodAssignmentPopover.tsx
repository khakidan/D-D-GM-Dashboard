import React from 'react';
import { X } from 'lucide-react';
import { MOODS, MoodId } from '../../lib/constants';
import { StoredAudioFile } from '../../lib/audioFileStore';

interface MoodAssignmentPopoverProps {
  fileId: string;
  currentMood: MoodId | null;
  assignments: Record<MoodId, string | null>;
  ambientTracks: StoredAudioFile[];
  onAssign: (fileId: string, moodId: MoodId) => void;
  onUnassign: (fileId: string) => void;
}

export function MoodAssignmentPopover({
  fileId,
  currentMood,
  assignments,
  ambientTracks,
  onAssign,
  onUnassign,
}: MoodAssignmentPopoverProps) {
  return (
    <>
      <p className="font-bold text-[10px] text-stone-500 uppercase tracking-widest pl-1 mb-1">
        Assign to mood
      </p>
      {MOODS.map((m) => {
        const assignedTrackId = assignments[m.id];
        const assignedTrack = assignedTrackId
          ? ambientTracks.find((f) => f.id === assignedTrackId)
          : null;
        const truncName = assignedTrack
          ? assignedTrack.name.length > 15
            ? assignedTrack.name.substring(0, 12) + '...'
            : assignedTrack.name
          : 'none';
        return (
          <button
            key={m.id}
            onClick={() => {
              onAssign(fileId, m.id);
            }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-stone-100 cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2">
              <span>{m.emoji}</span>
              <span className="font-sans font-medium">{m.label}</span>
            </div>
            <span className="text-[10px] text-stone-400 font-sans italic">
              currently: {truncName}
            </span>
          </button>
        );
      })}
      {currentMood && (
        <button
          onClick={() => {
            onUnassign(fileId);
          }}
          className="w-full mt-1 flex items-center gap-2 px-2 py-1.5 rounded hover:bg-red-50 text-red-600 cursor-pointer text-xs font-medium"
          title="Remove Assignment"
        >
          <X className="w-3.5 h-3.5" />
          Remove assignment
        </button>
      )}
    </>
  );
}
