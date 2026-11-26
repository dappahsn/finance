import React from 'react';
import type { TransactionItem } from '../types/finance';

interface ReceiptModalProps {
  transaction: TransactionItem | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/40 backdrop-blur-sm"
      id="receipt-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-surface-card p-space-xl shadow-2xl"
        id="receipt-container"
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-surface-container-high rounded-full mx-auto -mt-2" />

        {/* Receipt Header */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-income-green-subtle text-primary mx-auto flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[28px]">
              receipt
            </span>
          </div>
          <p
            className="font-headline-sm text-headline-sm text-text-primary pt-2"
            id="modal-title"
          >
            {transaction.title}
          </p>
          <p
            className="font-body-sm text-body-sm text-text-muted"
            id="modal-date"
          >
            {transaction.dateLabel}
          </p>
        </div>

        {/* Amount Highlight */}
        <div className="bg-surface-container-low rounded-xl p-space-md text-center">
          <p className="font-label-sm text-label-sm text-text-secondary uppercase">
            Nominal
          </p>
          <p
            className="font-financial-amount-lg text-financial-amount-lg text-text-primary font-bold mt-1"
            id="modal-amount"
          >
            {transaction.formattedAmount}
          </p>
        </div>

        {/* Detail rows */}
        <div className="space-y-space-xs text-body-md font-body-md">
          <div className="flex justify-between py-1 border-b border-surface-container-low">
            <span className="text-text-muted">Kategori</span>
            <span className="text-text-primary font-medium" id="modal-category">
              {transaction.category}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-surface-container-low">
            <span className="text-text-muted">Metode Pembayaran</span>
            <span className="text-text-primary font-medium" id="modal-method">
              {transaction.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-surface-container-low">
            <span className="text-text-muted">ID Transaksi</span>
            <span
              className="text-text-secondary font-mono text-body-sm"
              id="modal-tx-id"
            >
              {transaction.txCode}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-muted">Status</span>
            <span className="inline-flex items-center gap-1 text-income-green font-semibold text-body-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-income-green" />
              {transaction.status}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-space-sm pt-space-xs">
          <button
            className="flex-1 py-3 rounded-xl bg-surface-container text-text-secondary font-body-lg-bold hover:bg-surface-container-high transition-colors"
            id="close-modal"
            type="button"
            onClick={onClose}
          >
            Tutup
          </button>
          <button
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-body-lg-bold shadow-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            Bagikan
          </button>
        </div>
      </div>
    </div>
  );
};
