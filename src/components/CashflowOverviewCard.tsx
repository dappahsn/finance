import React from 'react';

export const CashflowOverviewCard: React.FC = () => {
  return (
    <section className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-card p-4 shadow-sm">
      <span className="material-symbols-outlined text-[21px] text-primary">
        info
      </span>
      <div>
        <h2 className="font-body-md-medium text-body-md-medium text-text-primary">
          Belum ada ringkasan transaksi
        </h2>
        <p className="mt-1 font-body-sm text-body-sm text-text-secondary">
          Ringkasan keuangan akan tampil setelah data transaksi tersedia.
        </p>
      </div>
    </section>
  );
};
