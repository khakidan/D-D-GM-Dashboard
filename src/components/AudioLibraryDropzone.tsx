import React from 'react';
import { Upload } from 'lucide-react';

interface AudioLibraryDropzoneProps {
  category: 'ambient' | 'effect';
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AudioLibraryDropzone({
  category,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  inputRef,
  onFileInputChange,
}: AudioLibraryDropzoneProps) {
  return (
    <div
      id={`dropzone-${category}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-24 mb-4 shrink-0 ${
        isDragOver
          ? 'bg-[#f9f8ff]/5 border-[#2563eb] scale-[0.98]'
          : 'bg-[#f9f8ff]/40 border-stone-200 hover:border-stone-350 hover:bg-stone-50/20'
      }`}
    >
      <input
        type="file"
        ref={inputRef}
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/ogg;codecs=vorbis,audio/mp4,audio/x-m4a,.mp3,.wav,.ogg,.m4a"
        onChange={onFileInputChange}
        className="hidden"
        multiple
        aria-label="Add audio files"
      />
      <Upload className="w-5 h-5 text-stone-400 mb-1" />
      <span className="text-[10px] font-sans font-bold text-[#8d8db9] uppercase tracking-wider">
        + Add Files
      </span>
      <span className="text-[9px] text-stone-400 mt-0.5 font-sans">
         MP3 · WAV · OGG · M4A
      </span>
    </div>
  );
}
