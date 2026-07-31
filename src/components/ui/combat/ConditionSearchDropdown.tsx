import React from 'react';

interface ConditionSearchDropdownProps {
  dropdownStyle: React.CSSProperties;
  conditionResults: Array<{ label: string }>;
  effectResults: Array<{ label: string }>;
  showCustomEntry: boolean;
  query: string;
  isImmune: (label: string) => boolean;
  onSelect: (label: string) => void;
}

export const ConditionSearchDropdown: React.FC<ConditionSearchDropdownProps> = ({
  dropdownStyle,
  conditionResults,
  effectResults,
  showCustomEntry,
  query,
  isImmune,
  onSelect,
}) => {
  return (
    <div 
      id="condition-chips-dropdown"
      className="bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
      style={dropdownStyle}
    >
      {conditionResults.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest
                          text-red-600 bg-red-50 border-b border-[#f0f0f0]">
            Conditions
          </div>
          {conditionResults.map(opt => (
            <button
              key={opt.label}
              type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(opt.label); }}
              className="w-full text-left px-3 py-2 text-xs font-sans text-red-700
                         hover:bg-red-50 transition-colors capitalize"
            >
              {opt.label}
              {isImmune(opt.label) && (
                <span className="ml-2 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                  immune
                </span>
              )}
            </button>
          ))}
        </>
      )}

      {effectResults.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest
                          text-blue-600 bg-blue-50 border-b border-[#f0f0f0]">
            Effects
          </div>
          {effectResults.map(opt => (
            <button
              key={opt.label}
              type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(opt.label); }}
              className="w-full text-left px-3 py-2 text-xs font-sans text-blue-700
                         hover:bg-blue-50 transition-colors capitalize"
            >
              {opt.label}
            </button>
          ))}
        </>
      )}

      {showCustomEntry && (
        <>
          <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest
                          text-[#8d8db9] bg-[#e2e8f0] border-b border-[#e2e8f0]">
            Custom
          </div>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onSelect(query); }}
            className="w-full text-left px-3 py-2 text-xs font-sans text-[#8d8db9]
                       hover:bg-[#e2e8f0] transition-colors"
          >
            Add "{query}"
          </button>
        </>
      )}
    </div>
  );
};
