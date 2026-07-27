import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { IconButton } from './IconButton';
import { Button } from './Button';
import { ConfirmationDialog } from './ConfirmationDialog';
import { generateUuid } from '../../lib/uuid';
import { CardHeaderChevron } from './CardHeaderChevron';
import { formatActionMeta } from './NpcStatBlockSection';

interface NpcListEditorProps<T extends { name: string; _key?: string }> {
  title: string;           // section header e.g. "Traits"
  items: T[];              // current parsed list
  emptyItem: T;            // template for a new blank entry
  renderFields: (
    item: T,
    index: number,
    onChange: (updated: T) => void
  ) => React.ReactNode;    // renders the fields for one entry
  onChange: (updated: T[]) => void; // fires with full updated list
  defaultExpanded: boolean;
}

export function NpcListEditor<T extends { name: string; _key?: string }>({
  title,
  items,
  emptyItem,
  renderFields,
  onChange,
  defaultExpanded,
}: NpcListEditorProps<T>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  
  // Per-item collapse state. 
  // Initial state: expanded if items.length <= 3, otherwise collapsed.
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => {
    if (items.length > 3) {
      return new Set(items.map((item, i) => item._key ?? i.toString()));
    }
    return new Set();
  });

  const singularTitle = title.endsWith('s') ? title.slice(0, -1) : title;

  const handleAddItem = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Deep copy emptyItem to avoid accidental references
    const newItem = JSON.parse(JSON.stringify(emptyItem)) as T;
    newItem._key = generateUuid();
    // New items always start expanded (they won't be in collapsedKeys)
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, updatedItem: T) => {
    onChange(items.map((item, i) => (i === index ? updatedItem : item)));
  };

  const toggleItemCollapse = (key: string) => {
    setCollapsedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="border border-[#e2e8f0] rounded bg-[#f9f8ff] p-3 space-y-3">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8d8db9] group-hover:text-[#0f172a] transition-colors">
          {title}
        </h4>
        <div className="flex items-center gap-3">
          {isExpanded && (
            <Button
              type="button"
              onClick={handleAddItem}
              intent="tertiary"
              className="px-3 py-1.5 text-xs text-[#2563eb] hover:text-[#567eff] flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add {singularTitle}
            </Button>
          )}
          <CardHeaderChevron
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
            label={title}
            bordered={false}
            stopPropagation
          />
        </div>
      </div>

      {isExpanded && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, index) => {
            const itemKey = item._key ?? index.toString();
            const isItemCollapsed = collapsedKeys.has(itemKey);
            
            // Generate summary
            // For Actions/Bonus Actions/Legendary Actions, show meta.
            // formatActionMeta handles checking for relevant fields.
            const meta = formatActionMeta(item as any);
            const displayName = item.name.trim() || `(untitled ${singularTitle.toLowerCase()})`;

            return (
              <div
                key={itemKey}
                className="bg-[#ffffff] rounded border border-[#e2e8f0] p-3 relative"
              >
                {/* Per-item header for toggle */}
                <div 
                  className="flex items-center justify-between cursor-pointer group/item py-0.5"
                  onClick={() => toggleItemCollapse(itemKey)}
                >
                  <div className="flex items-baseline gap-2 flex-1 min-w-0 pr-8">
                    <span className="font-bold text-[#2563eb] italic text-sm truncate">
                      {displayName}
                    </span>
                    {isItemCollapsed && meta && (
                      <span className="text-xs text-[#8d8db9] font-medium truncate">
                        {meta}
                      </span>
                    )}
                  </div>
                  <CardHeaderChevron
                    isExpanded={!isItemCollapsed}
                    onToggleExpand={() => toggleItemCollapse(itemKey)}
                    label={displayName}
                    bordered={false}
                    stopPropagation={true}
                    className="w-4 h-4 text-[#8d8db9] group-hover/item:text-[#0f172a] transition-colors"
                  />
                </div>

                {!isItemCollapsed && (
                  <div className="mt-3 pt-3 border-t border-[#f1f5f9] space-y-3">
                    {renderFields(item, index, (updated) =>
                      handleItemChange(index, updated)
                    )}
                    <div className="flex justify-end pt-1">
                      <IconButton
                        icon={<Trash2 className="w-4 h-4" />}
                        intent="destructive"
                        onClick={() => setPendingDeleteIndex(index)}
                        aria-label={`Remove ${singularTitle}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pendingDeleteIndex !== null && items[pendingDeleteIndex] && (
        <ConfirmationDialog
          isOpen={true}
          title={`Delete ${singularTitle}?`}
          description={
            items[pendingDeleteIndex].name.trim()
              ? `This will permanently remove "${items[pendingDeleteIndex].name}". This cannot be undone.`
              : `This will permanently remove this ${singularTitle.toLowerCase()}. This cannot be undone.`
          }
          confirmLabel="Delete"
          onConfirm={() => {
            handleRemoveItem(pendingDeleteIndex);
            setPendingDeleteIndex(null);
          }}
          onClose={() => setPendingDeleteIndex(null)}
        />
      )}
    </div>
  );
}
