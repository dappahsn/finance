import React from 'react';
import type { TransactionGroup, TransactionItem } from '../types/finance';

interface TransactionFeedProps {
  groups: TransactionGroup[];
  searchQuery: string;
  onSelectTransaction: (transaction: TransactionItem) => void;
}

function matchesSearch(item: TransactionItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const typeLabel = item.type === 'income' ? 'pemasukan' : 'pengeluaran';
  const searchable = [
    item.title,
    item.category,
    item.paymentMethod,
    item.time,
    item.formattedAmount,
    typeLabel,
  ]
    .join(' ')
    .toLowerCase();
  return searchable.includes(q);
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({
  groups,
  searchQuery,
  onSelectTransaction,
}) => {
  if (groups.length === 0) {
    return (
      <section className="rounded-2xl border border-border-subtle bg-surface-card px-6 py-12 text-center shadow-sm">
        <span className="icon-tile mx-auto h-14 w-14 rounded-2xl bg-surface-container-low text-primary">
          <span className="material-symbols-outlined text-[27px]">
            receipt_long
          </span>
        </span>
        <h2 className="mt-4 font-headline-sm text-headline-sm text-text-primary">
          Belum ada transaksi
        </h2>
        <p className="mx-auto mt-2 max-w-md font-body-md text-body-md text-text-secondary">
          Transaksi akan muncul di sini setelah data tersedia di Supabase.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-space-md">
      {groups.map((group) => (
        <div key={group.id} className="space-y-space-xs">
          <div className="flex items-center justify-between px-1">
            <span className="font-headline-sm text-headline-sm text-text-primary">
              {group.label}
            </span>
            <span className="font-body-sm text-body-sm text-text-muted">
              {group.subLabel}
            </span>
          </div>
          <div className="bg-surface-card rounded-xl shadow-sm overflow-hidden">
            {group.items.map((item, index) => {
              const isVisible = matchesSearch(item, searchQuery);
              const isIncome = item.type === 'income';
              return (
                <React.Fragment key={item.id}>
                  {index > 0 && (
                    <div className="h-[1px] bg-surface-container-low mx-3.5" />
                  )}
                  <div
                    className="transaction-item p-3.5 flex items-center justify-between hover:bg-surface-container-low/40 active:bg-surface-container-low transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    style={{ display: isVisible ? 'flex' : 'none' }}
                    onClick={() => onSelectTransaction(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectTransaction(item);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl ${item.iconBgClass} flex items-center justify-center shrink-0`}
                      >
                        <span
                          className={`material-symbols-outlined text-[22px] ${item.iconTextClass}`}
                        >
                          {item.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body-lg-bold text-body-lg-bold text-text-primary truncate">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-text-muted font-body-sm text-body-sm truncate">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span>{item.paymentMethod}</span>
                          <span>•</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span
                        className={`font-financial-amount-md text-financial-amount-md font-bold ${
                          isIncome ? 'text-income-green' : 'text-expense-rose'
                        }`}
                      >
                        {item.formattedAmount}
                      </span>
                      <p
                        className={`font-label-sm text-label-sm uppercase ${
                          isIncome
                            ? 'text-income-green font-semibold'
                            : 'text-text-muted'
                        }`}
                      >
                        {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
};
