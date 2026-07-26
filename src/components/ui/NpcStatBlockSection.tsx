import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { NpcAction, NpcLegendaryAction } from '../../types';
import { SectionHeader } from './SectionHeader';
import { baseMarkdownComponents } from './markdownComponents';

export function formatActionMeta(action: NpcAction | NpcLegendaryAction): string {
  const parts: string[] = [];

  // Attack / Damage part
  if (action.attackBonus !== undefined && typeof action.attackBonus === 'number' && !isNaN(action.attackBonus)) {
    parts.push(`${action.attackBonus >= 0 ? '+' : ''}${action.attackBonus} to hit`);
  }
  if (action.damage && action.damage.trim() !== '') {
    parts.push(action.damage.trim());
  }

  // Save part
  if (action.saveDC !== undefined && typeof action.saveDC === 'number' && !isNaN(action.saveDC)) {
    const saveTypeStr = action.saveType && action.saveType.trim() !== '' ? ` ${action.saveType.trim()}` : '';
    parts.push(`DC ${action.saveDC}${saveTypeStr} save`);
  } else if (action.saveType && action.saveType.trim() !== '') {
    parts.push(`${action.saveType.trim()} save`);
  }

  // Let's join the core mechanical parts with ' | '
  const coreStr = parts.join(' | ');

  // Now recharge and range
  const finalParts: string[] = [];
  
  // Check if recharge property exists on action
  if ('recharge' in action && action.recharge && action.recharge.trim() !== '') {
    finalParts.push(action.recharge.trim());
  }
  
  if (coreStr !== '') {
    finalParts.push(coreStr);
  }
  
  if ('range' in action && action.range && action.range.trim() !== '') {
    finalParts.push(action.range.trim());
  }

  return finalParts.join(' | ');
}

export interface NpcStatBlockSectionProps {
  title: string;
  items: Array<{
    name: string;
    description: string;
    meta?: string;
  }>;
}

export const NpcStatBlockSection: React.FC<NpcStatBlockSectionProps> = ({ title, items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <SectionHeader>
        {title}
      </SectionHeader>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="leading-snug">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold text-[#2563eb] italic">
                {item.name}
              </span>
              {item.meta && (
                <span className="text-xs text-[#8d8db9] font-medium">
                  {item.meta}
                </span>
              )}
            </div>
            <div className="mt-0.5">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...baseMarkdownComponents,
                  p: ({ children }: any) => (
                    <p className="text-sm text-[#0f172a] leading-snug whitespace-pre-wrap mb-2 last:mb-0 font-normal">
                      {children}
                    </p>
                  ),
                  ul: ({ children }: any) => (
                    <ul className="list-disc pl-5 mb-2 space-y-1 text-[#0f172a] text-sm font-normal">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }: any) => (
                    <ol className="list-decimal pl-5 mb-2 space-y-1 text-[#0f172a] text-sm font-normal">
                      {children}
                    </ol>
                  ),
                }}
              >
                {item.description}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
