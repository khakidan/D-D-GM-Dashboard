// src/components/AudioLibrary.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, X, Music, Volume2, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { StoredAudioFile } from '../lib/audioFileStore';
import { STORAGE_KEYS, TIMERS, MoodId, campaignKey } from '../lib/constants';
import { SoundboardSlot } from './Soundboard';
import { cn } from '../lib/utils';
import { IconButton } from './ui/IconButton';
import { ConfirmationDialog } from './ui/ConfirmationDialog';
import { AudioLibraryDropzone } from './AudioLibraryDropzone';
import { AudioFileRow } from './AudioFileRow';

interface AudioLibraryProps {
  storedFiles: StoredAudioFile[];
  addFiles: (files: FileList | File[], category: 'ambient' | 'effect') => Promise<void>;
  removeFile: (fileId: string) => Promise<void>;
  clearAllFiles?: (category: 'ambient' | 'effect' | 'all') => Promise<void>;
  assignTrackToMood?: (fileId: string, moodId: MoodId) => void;
  unassignTrack?: (fileId: string) => void;
  getMoodForTrack?: (fileId: string) => MoodId | null;
  resetAllMoods?: () => void;
  assignments?: Record<MoodId, string | null>;
  campaignId?: string;
}

export function AudioLibrary({ 
  storedFiles, 
  addFiles, 
  removeFile,
  clearAllFiles = async () => {},
  assignTrackToMood = () => {},
  unassignTrack = () => {},
  getMoodForTrack = () => null,
  resetAllMoods = () => {},
  assignments = { sweet: null, adventuring: null, tense: null, scary: null, combat: null },
  campaignId,
}: AudioLibraryProps) {
  const [instructionsDismissed, setInstructionsDismissed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.instructionsDismissed);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [activeSubTab, setActiveSubTab] = useState<'ambient' | 'effect'>('ambient');
  
  // Confirmation states
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showResetMoodsConfirm, setShowResetMoodsConfirm] = useState<boolean>(false);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<StoredAudioFile | null>(null);

  // Drag over styling state
  const [dragOverCategory, setDragOverCategory] = useState<'ambient' | 'effect' | null>(null);

  // Hidden inputs refs
  const ambientInputRef = useRef<HTMLInputElement>(null);
  const effectInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [previewingFileId, setPreviewingFileId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<any>(null);

  // Active Picker state
  const [activePickerFileId, setActivePickerFileId] = useState<string | null>(null);

  // Uploading state
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string, name: string, category: 'ambient' | 'effect' }[]>([]);

  // Close picker on click away
  useEffect(() => {
    const handleOutsideClick = () => {
      setActivePickerFileId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Stop any active preview
  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setPreviewingFileId(null);
  };

  // Preview play - plays for 3s max
  const handlePlayPreview = (file: StoredAudioFile) => {
    stopPreview();

    if (previewingFileId === file.id) {
      return;
    }

    try {
      const url = URL.createObjectURL(file.blob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      setPreviewingFileId(file.id);

      audio.play().catch((err) => {
        console.warn('[Audio Library] Preview play failed:', err);
        toast.error(`Failed to play preview for "${file.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
        stopPreview();
      });

      previewTimerRef.current = setTimeout(() => {
        stopPreview();
        URL.revokeObjectURL(url);
      }, TIMERS.audioPreviewMs);
    } catch (err) {
      console.error('[Audio Library] Failed to setup preview playback:', err);
      toast.error(`Failed to setup preview for "${file.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
      stopPreview();
    }
  };

  // Dismiss instructions
  const handleDismissInstructions = () => {
    setInstructionsDismissed(true);
    localStorage.setItem(STORAGE_KEYS.instructionsDismissed, 'true');
  };

  // Cleanup preview audio on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  // Filter lists
  const ambientTracks = storedFiles.filter((f) => f.category === 'ambient');
  const effectFiles = storedFiles.filter((f) => f.category === 'effect');

  // Unified remove handler including layout cascade deletion
  const handleRemoveFile = async (fileId: string) => {
    // 1. Remove from database
    await removeFile(fileId);

    // 2. Scan and edit soundboard layout in localStorage
    try {
      const layoutKey = campaignKey(STORAGE_KEYS.soundboardLayout, campaignId || 'default');
      const rawLayout = localStorage.getItem(layoutKey);
      if (rawLayout) {
        const layout: SoundboardSlot[] = JSON.parse(rawLayout);
        const updatedLayout = layout.filter((s) => s.fileId !== fileId);
        localStorage.setItem(layoutKey, JSON.stringify(updatedLayout));
        
        // Dispatch synthetic change event to alert mounted widgets
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.warn('[Audio Library] Failed cascading sound removal layout:', err);
    }
  };

  // Drag-and-drop mechanics
  const handleDragOver = (e: React.DragEvent, category: 'ambient' | 'effect') => {
    e.preventDefault();
    setDragOverCategory(category);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
  };

  const processUpload = async (audioFiles: File[], category: 'ambient' | 'effect') => {
    if (audioFiles.length === 0) return;
    
    const uploadTasks = audioFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      category
    }));
    
    setUploadingFiles(prev => [...prev, ...uploadTasks]);
    
    try {
      await addFiles(audioFiles, category);
    } catch (err) {
      console.error('[Audio Library] Upload failed:', err);
      toast.error(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploadingFiles(prev => prev.filter(t => !uploadTasks.find(u => u.id === t.id)));
    }
  };

  const handleDrop = async (e: React.DragEvent, category: 'ambient' | 'effect') => {
    e.preventDefault();
    setDragOverCategory(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Filter out non-audio files
      const audioFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (
          file.type.match('audio/.*') ||
          file.name.endsWith('.mp3') ||
          file.name.endsWith('.wav') ||
          file.name.endsWith('.ogg') ||
          file.name.endsWith('.m4a')
        ) {
          audioFiles.push(file);
        }
      }
      if (audioFiles.length > 0) {
        await processUpload(audioFiles, category);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>, category: 'ambient' | 'effect') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processUpload(Array.from(files), category);
    }
  };

  const triggerFileInput = (category: 'ambient' | 'effect') => {
    if (category === 'ambient') {
      ambientInputRef.current?.click();
    } else {
      effectInputRef.current?.click();
    }
  };

  const handleClearConfirm = async () => {
    await clearAllFiles(activeSubTab);
    setShowClearConfirm(false);
  };

  const currentFiles = activeSubTab === 'ambient' ? ambientTracks : effectFiles;

  return (
    <div id="audio-library-panel" className="flex flex-col h-full text-stone-800">
      {/* Import Instructions Box */}
      {!instructionsDismissed && (
        <div id="library-import-instructions" className="relative p-3 bg-[#f9f8ff] border border-[#e2e8f0] rounded-xl mb-4 font-sans text-xs text-stone-700/90 leading-normal pr-8">
          <IconButton
            icon={<X className="w-4 h-4" />}
            onClick={handleDismissInstructions}
            aria-label="Dismiss Instructions"
            title="Dismiss Instructions"
            id="dismiss-instructions-btn"
            className="absolute top-2.5 right-2"
          />
          <p className="font-semibold text-[#0f172a] mb-1 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#2563eb]" />
            Audio Import Guidelines
          </p>
          Drag your MP3 files here or click to browse. Ambient tracks loop continuously. Sound effects play on demand from the Soundboard. Files are saved in your browser and available every session.
        </div>
      )}

      {/* Sub-tabs header */}
      <div className="flex items-center justify-between border-b border-stone-200/60 mb-4 pb-0">
        <div className="flex items-center gap-4 px-1">
          <button
            onClick={() => { setActiveSubTab('ambient'); setShowClearConfirm(false); }}
            className={cn(
              "pb-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 font-sans flex items-center gap-1.5",
              activeSubTab === 'ambient' ? "border-[#2563eb] text-[#0f172a]" : "border-transparent text-stone-400 hover:text-stone-600"
            )}
          >
            Ambient Tracks 
            <span className="bg-stone-100 text-[#8d8db9] px-1.5 py-0.5 rounded pl-1.5 font-mono text-[9px]">({ambientTracks.length})</span>
          </button>
          
          <button
            onClick={() => { setActiveSubTab('effect'); setShowClearConfirm(false); }}
            className={cn(
              "pb-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 font-sans flex items-center gap-1.5",
              activeSubTab === 'effect' ? "border-[#2563eb] text-[#0f172a]" : "border-transparent text-stone-400 hover:text-stone-600"
            )}
          >
            Sound Effects
            <span className="bg-stone-100 text-[#8d8db9] px-1.5 py-0.5 rounded pl-1.5 font-mono text-[9px]">({effectFiles.length})</span>
          </button>
        </div>

        {/* Clear All action (per tab) */}
        {currentFiles.length > 0 && !showClearConfirm && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="pb-2 flex items-center gap-1 text-[10px] text-stone-400 hover:text-red-600 font-sans font-medium uppercase tracking-wider transition-colors"
            title={`Clear all ${activeSubTab === 'ambient' ? 'ambient tracks' : 'sound effects'}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {showClearConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs text-red-800 font-medium">
            Remove all {currentFiles.length} {activeSubTab === 'ambient' ? 'ambient tracks' : 'sound effects'}? This cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-black/5 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClearConfirm}
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Remove all
            </button>
          </div>
        </div>
      )}

      {/* Active Tab Content */}
      <div className="flex flex-col h-full min-w-0" id={`library-${activeSubTab}-section`}>
        {/* Upload Dropzone */}
        <AudioLibraryDropzone
          category={activeSubTab}
          isDragOver={dragOverCategory === activeSubTab}
          onDragOver={(e) => handleDragOver(e, activeSubTab)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, activeSubTab)}
          onClick={() => triggerFileInput(activeSubTab)}
          inputRef={activeSubTab === 'ambient' ? ambientInputRef : effectInputRef}
          onFileInputChange={(e) => handleFileInputChange(e, activeSubTab)}
        />

        {/* Stored files list */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 pb-8" id={`list-${activeSubTab}`}>
          {currentFiles.length === 0 && uploadingFiles.filter(f => f.category === activeSubTab).length === 0 ? (
            <span className="text-xs text-stone-400 font-sans text-center py-8 border border-dashed border-stone-200 rounded-xl bg-stone-50/50 flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-stone-300" />
              {activeSubTab === 'ambient' 
                ? 'No ambient tracks loaded yet.\nDrop MP3, WAV, OGG, or M4A files above to add them.'
                : 'No sound effects loaded yet.\nDrop MP3, WAV, OGG, or M4A files above to add them.'
              }
            </span>
          ) : (
            <>
              {uploadingFiles.filter(f => f.category === activeSubTab).map(file => (
                <div
                  key={file.id}
                  className="group flex flex-row items-center p-2 bg-[#f9f8ff]/30 border border-stone-200/40 rounded-lg text-xs w-full opacity-70"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full border shrink-0 bg-[#2563eb]/10 border-[#2563eb]/30">
                      <Loader2 className="w-3.5 h-3.5 text-[#2563eb] animate-spin" />
                    </div>
                    {activeSubTab === 'ambient' && <div className="w-6 h-6 mr-2" />}
                  </div>
                  <div className="flex-grow min-w-0 px-2 overflow-hidden">
                    <p className="font-sans font-medium text-stone-500 leading-tight break-words truncate">
                      {file.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <p className="text-[9.5px] font-mono text-[#2563eb] mt-0.5 whitespace-nowrap text-right min-w-[40px] italic">
                      Uploading...
                    </p>
                    <div className="w-6 h-6" /> {/* Placeholder for delete button to maintain layout */}
                  </div>
                </div>
              ))}
              {currentFiles.map((file) => (
                <AudioFileRow
                  key={file.id}
                  file={file}
                  isPreviewing={previewingFileId === file.id}
                  onPlayPreview={handlePlayPreview}
                  onRequestDelete={setPendingDeleteFile}
                  showMoodPicker={activeSubTab === 'ambient'}
                  currentMood={getMoodForTrack(file.id)}
                  moodPickerOpen={activePickerFileId === file.id}
                  onToggleMoodPicker={(fileId) => setActivePickerFileId(activePickerFileId === fileId ? null : fileId)}
                  onAssignMood={(fileId, moodId) => {
                    assignTrackToMood(fileId, moodId);
                    setActivePickerFileId(null);
                  }}
                  onUnassignMood={(fileId) => {
                    unassignTrack(fileId);
                    setActivePickerFileId(null);
                  }}
                  assignments={assignments}
                  ambientTracks={ambientTracks}
                />
              ))}
            </>
          )}
        </div>
        
        {/* Reset Moods Action */}
        <div className="shrink-0 pt-4 border-t border-stone-200/50 flex items-center justify-end mt-auto">
          {!showResetMoodsConfirm ? (
            <button
              onClick={() => {
                setShowResetMoodsConfirm(true);
              }}
              className="text-[10px] uppercase tracking-wider font-bold text-stone-400 hover:text-red-600 transition-colors font-sans"
            >
              Reset mood assignments
            </button>
          ) : (
            <div className="flex items-center justify-between w-full bg-stone-50 p-2 rounded-lg border border-stone-200 animate-in fade-in slide-in-from-right-4 duration-200">
              <span className="text-xs text-stone-600 font-medium pl-1">
                Clear all mood assignments? Your tracks will remain.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetMoodsConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-black/5 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetAllMoods();
                    setShowResetMoodsConfirm(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Reset moods
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={pendingDeleteFile !== null}
        title="Delete File?"
        description={
          pendingDeleteFile
            ? `This will permanently remove "${pendingDeleteFile.name}" from your audio library. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={async () => {
          if (pendingDeleteFile) {
            await handleRemoveFile(pendingDeleteFile.id);
          }
        }}
        onClose={() => setPendingDeleteFile(null)}
      />
    </div>
  );
}

