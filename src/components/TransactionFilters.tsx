import React from 'react';
import type {
  CategoryChip,
  CategoryFilterId,
  PeriodFilter,
} from '../types/finance';

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  periodTabs: PeriodFilter[];
  selectedPeriod: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  categoryChips: CategoryChip[];
  selectedCategory: CategoryFilterId;
  onCategoryChange: (category: CategoryFilterId) => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  periodTabs,
  selectedPeriod,
  onPeriodChange,
  categoryChips,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <section className="space-y-space-sm">
      {/* Search Bar & Quick Filter Action */}
      <div className="flex items-center gap-space-xs">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">
            search
          </span>
          <input
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-card text-text-primary font-body-md text-body-md placeholder:text-text-muted shadow-sm focus:outline-none focus:bg-surface-card transition-all"
            id="search-input"
            placeholder="Cari riwayat transaksi..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button
          aria-label="Filter Lanjutan"
          className="h-11 px-3.5 rounded-xl bg-surface-card text-text-secondary shadow-sm flex items-center justify-center gap-1.5 hover:text-primary active:scale-95 transition-all"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      {/* Period Tabs */}
      <div className="flex items-center bg-surface-container-low p-1 rounded-xl">
        {periodTabs.map((period) => {
          const isActive = period === selectedPeriod;
          return (
            <button
              key={period}
              className={
                isActive
                  ? 'flex-1 py-1.5 text-center font-label-md text-label-md rounded-lg bg-surface-card text-primary shadow-sm font-semibold transition-all'
                  : 'flex-1 py-1.5 text-center font-label-md text-label-md rounded-lg text-text-muted hover:text-text-secondary transition-all'
              }
              type="button"
              onClick={() => onPeriodChange(period)}
            >
              {period}
            </button>
          );
        })}
      </div>

      {/* Horizontal Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-margin px-margin scrollbar-none">
        {categoryChips.map((chip) => {
          const isActive = chip.id === selectedCategory;
          return (
            <button
              key={chip.id}
              className={
                isActive
                  ? 'category-chip shrink-0 px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm transition-all'
                  : 'category-chip shrink-0 px-3.5 py-1.5 rounded-full bg-surface-card text-text-secondary font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-all'
              }
              data-category={chip.id}
              type="button"
              onClick={() => onCategoryChange(chip.id)}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

