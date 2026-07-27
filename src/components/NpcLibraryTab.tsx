import { DAMAGE_TYPE_OPTIONS, CONDITION_OPTIONS } from '../lib/conditions';
import React, { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useNpcLibrary } from './NpcLibraryTab/hooks/useNpcLibrary';
import { BookOpen, Plus, Filter, X, Shield, Activity, Award } from 'lucide-react';
import { Callout } from './ui/Callout';
import { EmptyState } from './ui/EmptyState';
import { SearchInput } from './ui/SearchInput';
import { cn } from '../lib/utils';
import { NewNpcDialog } from './NpcLibraryTab/NewNpcDialog';
import { NpcCard } from './NpcLibraryTab/NpcCard';
import { checkIrvMatch } from '../lib/combatLogic';
import { DashboardLayout } from './ui/DashboardLayout';
import { crToNumber } from '../lib/dndUtils';

export function NpcLibraryTab() {
  const { state: appState, updateState } = useAppState();
  const {
    state,
    syncingId,
    globalError,
    handleAddNpc,
    handleUpdateNpc,
    handleDeleteNpc,
  } = useNpcLibrary();

  const [isNewNpcDialogOpen, setIsNewNpcDialogOpen] = useState(false);

  useEffect(() => {
    if (appState.openDialog === 'newNpc') {
      setIsNewNpcDialogOpen(true);
      updateState(prev => ({ ...prev, openDialog: null }));
    }
  }, [appState.openDialog, updateState]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResistances, setFilterResistances] = useState('');
  const [filterImmunities, setFilterImmunities] = useState('');
  const [filterVulnerabilities, setFilterVulnerabilities] = useState('');
  const [filterCr, setFilterCr] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);

  // Reset currentPage to 1 when any filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterResistances, filterImmunities, filterVulnerabilities, filterCr, pageSize]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterResistances('');
    setFilterImmunities('');
    setFilterVulnerabilities('');
    setFilterCr('');
  };

  const filteredNpcs = useMemo(() => {
    return state.npcs.filter(npc => {
      const matchesSearch = !searchQuery || npc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRes = !filterResistances || checkIrvMatch(filterResistances, npc.resistances);
      const matchesImm = !filterImmunities || checkIrvMatch(filterImmunities, npc.immunities);
      const matchesVul = !filterVulnerabilities || checkIrvMatch(filterVulnerabilities, npc.vulnerabilities);
      const matchesCr = !filterCr || npc.challengeRating === filterCr;
      return matchesSearch && matchesRes && matchesImm && matchesVul && matchesCr;
    });
  }, [state.npcs, searchQuery, filterResistances, filterImmunities, filterVulnerabilities, filterCr]);

  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredNpcs.length / pageSize));
  }, [filteredNpcs.length, pageSize]);

  // Sync currentPage if it somehow exceeds totalPages (e.g., due to background mutations of npcs)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedNpcs = useMemo(() => {
    if (pageSize === 'all') return filteredNpcs;
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * pageSize;
    return filteredNpcs.slice(startIndex, startIndex + pageSize);
  }, [filteredNpcs, currentPage, totalPages, pageSize]);

  const hasActiveFilters = Boolean(
    searchQuery || filterResistances || filterImmunities || filterVulnerabilities || filterCr
  );

  const crOptions = useMemo(() => {
    const uniqueCrs = Array.from(new Set(state.npcs.map(n => n.challengeRating).filter(Boolean) as string[]));
    return uniqueCrs.sort((a, b) => crToNumber(a) - crToNumber(b));
  }, [state.npcs]);

  const renderFilterSelect = (icon: React.ReactNode, placeholder: string, value: string, setter: (v: string) => void, options?: string[], testId?: string) => (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
        {icon}
      </div>
      <select
        data-testid={testId}
        aria-label={placeholder}
        value={value}
        onChange={e => setter(e.target.value)}
        className="w-full bg-[#ffffff]/50 border border-[#e2e8f0] rounded-xl pl-9 pr-3 py-2.5 text-sm focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all appearance-auto cursor-pointer text-[#0f172a]"
      >
        <option value="">{placeholder}: none</option>
        {options ? (
          options.map(opt => <option key={opt} value={opt}>{opt}</option>)
        ) : (
          <>
            <optgroup label="Damage Types">
              {DAMAGE_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </optgroup>
            <optgroup label="Conditions">
              {CONDITION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </optgroup>
          </>
        )}
      </select>
    </div>
  );

  return (
    <DashboardLayout
      title="NPC Library"
      description="Reference NPCs loaded from your campaign sheets. Directly inspect stats and health status."
      actions={
        <button
          onClick={() => setIsNewNpcDialogOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2563eb] hover:bg-[#567eff] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex-shrink-0 whitespace-nowrap"
          id="add-npc-btn"
        >
          <Plus className="w-4 h-4" />
          New NPC
        </button>
      }
      filterControls={
        <div className="flex flex-col md:flex-row gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name..."
            id="npc-search-input"
            className="flex-1"
          />
          
          <div className="grid grid-cols-2 md:flex gap-3 flex-wrap">
            {renderFilterSelect(<Shield className="w-4 h-4 text-blue-500/60" />, "Resist", filterResistances, setFilterResistances, undefined, "resist-filter")}
            {renderFilterSelect(<Shield className="w-4 h-4 text-green-600/60" />, "Immune", filterImmunities, setFilterImmunities, undefined, "immune-filter")}
            {renderFilterSelect(<Shield className="w-4 h-4 text-red-500/60" />, "Vulnerable", filterVulnerabilities, setFilterVulnerabilities, undefined, "vulnerable-filter")}
            {renderFilterSelect(<Award className="w-4 h-4 text-amber-500/60" />, "Challenge Rating", filterCr, setFilterCr, crOptions, "cr-filter")}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-[#8d8db9] hover:text-[#0f172a] text-xs font-bold uppercase tracking-widest transition-colors"
              id="clear-filters-btn"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      }
    >
      {globalError && (
        <Callout severity="error" className="mb-6">
          <p>{globalError}</p>
        </Callout>
      )}

      <div className="space-y-4">
        {filteredNpcs.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No NPCs in library"
            description="Add NPCs to build your library. They will be available to add to any encounter."
            actionLabel="Add New NPC"
            onAction={() => setIsNewNpcDialogOpen(true)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              {paginatedNpcs.map(npc => (
                <NpcCard
                  key={npc.id}
                  npc={npc}
                  isSyncing={syncingId === npc.id}
                  isExpanded={expandedIds.has(npc.id)}
                  onToggleExpand={() => toggleExpand(npc.id)}
                  onUpdate={(updates) => handleUpdateNpc(npc.id, updates)}
                  onDelete={() => handleDeleteNpc(npc.id)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredNpcs.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#e2e8f0]">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748b] font-medium whitespace-nowrap">Show:</span>
                  <select
                    data-testid="page-size-select"
                    aria-label="Page Size"
                    value={pageSize}
                    onChange={e => {
                      const val = e.target.value;
                      setPageSize(val === 'all' ? 'all' : Number(val));
                    }}
                    className="bg-[#ffffff]/50 border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all cursor-pointer text-[#0f172a]"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                    <option value="all">All</option>
                  </select>
                  <span className="text-xs text-[#64748b] ml-1">
                    Showing {paginatedNpcs.length} of {filteredNpcs.length} NPC{filteredNpcs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={pageSize === 'all' || currentPage <= 1}
                    data-testid="prev-page-btn"
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all select-none",
                      (pageSize === 'all' || currentPage <= 1)
                        ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-[#0f172a] border-[#e2e8f0] hover:bg-gray-50 active:scale-95 cursor-pointer"
                    )}
                  >
                    Previous
                  </button>
                  
                  <span className="text-xs text-[#64748b] font-medium" data-testid="page-indicator">
                    Page {pageSize === 'all' ? 1 : Math.min(currentPage, totalPages)} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={pageSize === 'all' || currentPage >= totalPages}
                    data-testid="next-page-btn"
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all select-none",
                      (pageSize === 'all' || currentPage >= totalPages)
                        ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-[#0f172a] border-[#e2e8f0] hover:bg-gray-50 active:scale-95 cursor-pointer"
                    )}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <NewNpcDialog 
        isOpen={isNewNpcDialogOpen}
        onClose={() => setIsNewNpcDialogOpen(false)}
        onConfirm={(data) => {
          handleAddNpc(data);
          setIsNewNpcDialogOpen(false);
        }}
      />
    </DashboardLayout>
  );
}
