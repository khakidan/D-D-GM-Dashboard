import React from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';
import { StoredAudioFile } from '../lib/audioFileStore';
import { MOODS, MoodId } from '../lib/constants';
import { IconButton } from './ui/IconButton';
import { MoodAssignmentPopover } from './MoodAssignmentPopover';

interface AudioFileRowProps {
  file: StoredAudioFile;
  isPreviewing: boolean;
  onPlayPreview: (file: StoredAudioFile) => void;
  onRequestDelete: (file: StoredAudioFile) => void;
  showMoodPicker: boolean;
  currentMood: MoodId | null;
  moodPickerOpen: boolean;
  onToggleMoodPicker: (fileId: string) => void;
  onAssignMood: (fileId: string, moodId: MoodId) => void;
  onUnassignMood: (fileId: string) => void;
  assignments: Record<MoodId, string | null>;
  ambientTracks: StoredAudioFile[];
}

export function AudioFileRow({
  file,
  isPreviewing,
  onPlayPreview,
  onRequestDelete,
  showMoodPicker,
  currentMood,
  moodPickerOpen,
  onToggleMoodPicker,
  onAssignMood,
  onUnassignMood,
  assignments,
  ambientTracks,
}: AudioFileRowProps) {
  const moodObj = currentMood ? MOODS.find((m) => m.id === currentMood) : null;

  return (
    <div className="group flex flex-row items-center p-2 bg-[#f9f8ff]/50 border border-stone-200/40 rounded-lg text-xs w-full">
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onPlayPreview(file)}
          className={`w-6 h-6 flex items-center justify-center rounded-full border shrink-0 ${
            isPreviewing
              ? 'bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/30'
              : 'bg-white border-stone-200 text-stone-500 hover:text-stone-700'
          }`}
          title="Preview 3s"
        >
          {isPreviewing ? (
            <Pause className="w-2.5 h-2.5 fill-current" />
          ) : (
            <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Mood Selector Trigger/Badge Button */}
        {showMoodPicker && (
          <div className="relative shrink-0 mr-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMoodPicker(file.id);
              }}
              className={`w-6 h-6 flex items-center justify-center rounded-md border text-xs transition-colors shrink-0 ${
                currentMood
                  ? 'bg-[#f9f8ff] border-[#e2e8f0] text-stone-700 opacity-100'
                  : 'bg-stone-50/50 border-stone-200/50 text-stone-400 opacity-60 group-hover:opacity-100'
              } hover:border-[#2563eb] hover:bg-[#f9f8ff]/50 cursor-pointer`}
              title={currentMood ? `Mood: ${moodObj?.label}` : 'Assign Mood'}
            >
              {currentMood ? moodObj?.emoji : '➕'}
            </button>

            {moodPickerOpen && (
              <div
                className="absolute left-0 top-7 z-50 bg-white border border-stone-250 rounded-lg shadow-lg p-2.5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-100 min-w-[220px]"
                onClick={(e) => e.stopPropagation()}
              >
                <MoodAssignmentPopover
                  fileId={file.id}
                  currentMood={currentMood}
                  assignments={assignments}
                  ambientTracks={ambientTracks}
                  onAssign={onAssignMood}
                  onUnassign={onUnassignMood}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-grow min-w-0 px-2 overflow-hidden">
        <p className="font-sans font-medium text-stone-700 leading-tight break-words" title={file.name}>
          {file.name}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        <p className="text-[9.5px] font-mono text-stone-400 mt-0.5 whitespace-nowrap text-right min-w-[40px]">
          {(file.blob.size / 1024).toFixed(1)} KB
        </p>
        <IconButton
          icon={<Trash2 className="w-3.5 h-3.5" />}
          intent="destructive"
          onClick={() => onRequestDelete(file)}
          aria-label="Delete File"
          title="Delete File"
        />
      </div>
    </div>
  );
}
