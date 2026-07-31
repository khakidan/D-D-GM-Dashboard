import React from 'react';

export const baseMarkdownComponents = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0 text-[#0f172a] text-sm leading-relaxed font-normal">{children}</p>,
  strong: ({ children }: any) => <strong className="font-bold text-[#0f172a]">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3 space-y-1 text-[#0f172a] text-sm font-normal">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-[#0f172a] text-sm font-normal">{children}</ol>,
  li: ({ children }: any) => <li className="mb-0.5 last:mb-0 leading-relaxed font-normal">{children}</li>,
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3 border border-[#e2e8f0] rounded-lg">
      <table className="min-w-full divide-y divide-[#e2e8f0] text-xs font-sans text-[#0f172a]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-[#f9f8ff]">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="divide-y divide-[#e2e8f0]">{children}</tbody>,
  tr: ({ children }: any) => <tr className="hover:bg-[#f9f8ff]/50 transition-colors">{children}</tr>,
  th: ({ children }: any) => <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wider text-[#0f172a] border-r border-[#e2e8f0] last:border-r-0">{children}</th>,
  td: ({ children }: any) => <td className="px-3 py-1.5 border-r border-[#e2e8f0] last:border-r-0 leading-normal">{children}</td>,
};
