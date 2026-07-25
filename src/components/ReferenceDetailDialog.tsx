import React from 'react';
import { Spell, Condition } from '../types';
import { Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DialogShell } from './ui/DialogShell';
import { SectionHeader } from './ui/SectionHeader';
import { baseMarkdownComponents } from './ui/markdownComponents';

interface ReferenceDetailDialogProps {
  reference:
    | { type: 'spell'; data: Spell }
    | { type: 'condition'; data: Condition }
    | null;
  onClose: () => void;
}

export function ReferenceDetailDialog({ reference, onClose }: ReferenceDetailDialogProps) {
  if (!reference) return null;

  const icon = reference.type === 'spell' ? (
    <Sparkles className="w-5 h-5 text-[#2563eb]" />
  ) : (
    <AlertCircle className="w-5 h-5 text-[#2563eb]" />
  );

  return (
    <DialogShell
      isOpen={!!reference}
      onClose={onClose}
      title={reference.data.name}
      icon={icon}
      maxWidth="max-w-lg"
      zIndex="z-[100]"
    >
      <div className="space-y-4 text-[#0f172a] text-sm leading-relaxed">
        {reference.type === 'condition' && (
          <div className="text-[#0f172a]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={baseMarkdownComponents}>
              {reference.data.description}
            </ReactMarkdown>
          </div>
        )}

        {reference.type === 'spell' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 animate-fade-in">
              <span className="bg-[#f9f8ff] text-[#2563eb] border border-[#9eb6ff] text-[10px] font-bold uppercase rounded-md px-2.5 py-1">
                {reference.data.level === 0 ? 'Cantrip' : `Level ${reference.data.level}`} · {reference.data.school}
              </span>
              <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                <strong className="text-[#0f172a] font-extrabold mr-1">Time:</strong> {reference.data.castingTime}
              </span>
              <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                <strong className="text-[#0f172a] font-extrabold mr-1">Range:</strong> {reference.data.range}
              </span>
              <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                <strong className="text-[#0f172a] font-extrabold mr-1">Components:</strong> {reference.data.components}
              </span>
              <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                <strong className="text-[#0f172a] font-extrabold mr-1">Duration:</strong> {reference.data.duration}
              </span>
              {reference.data.concentration && (
                <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold uppercase rounded-md px-2 py-1">
                  Concentration
                </span>
              )}
              {reference.data.ritual && (
                <span className="bg-[#f9f8ff] text-[#567eff] border border-[#c0d4ff] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                  Ritual
                </span>
              )}
              {reference.data.classes && (
                <span className="bg-[#f9f8ff] text-[#8d8db9] border border-[#e2e8f0] text-[10px] font-bold uppercase rounded-md px-2 py-1">
                  <strong className="text-[#0f172a] font-extrabold mr-1">Classes:</strong> {reference.data.classes}
                </span>
              )}
            </div>

            <div className="text-[#0f172a]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={baseMarkdownComponents}>
                {reference.data.description}
              </ReactMarkdown>
            </div>

            {reference.data.higherLevel && (
              <div className="bg-[#f9f8ff] border border-[#e2e8f0] rounded-lg p-4">
                <SectionHeader size="compact">
                  At Higher Levels
                </SectionHeader>
                <div className="text-[#0f172a]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={baseMarkdownComponents}>
                    {reference.data.higherLevel}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DialogShell>
  );
}
