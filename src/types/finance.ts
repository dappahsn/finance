export type TransactionType = 'income' | 'expense';

export type CategoryFilterId =
  | 'all'
  | 'makanan'
  | 'belanja'
  | 'transportasi'
  | 'gaji'
  | 'tagihan'
  | 'investasi';

export type PeriodFilter = 'Bulan Ini' | 'Minggu Ini' | 'Semua' | 'Kustom';

export type NavTabId = 'beranda' | 'transaksi' | 'anggaran' | 'pengaturan';

export interface CategoryChip {
  id: CategoryFilterId;
  label: string;
}

export interface TransactionItem {
  id: string;
  title: string;
  category: string;
  paymentMethod: string;
  time: string;
  dateLabel: string;
  amount: number;
  formattedAmount: string;
  type: TransactionType;
  icon: string;
  iconBgClass: string;
  iconTextClass: string;
  txCode: string;
  status: string;
}

export interface TransactionGroup {
  id: string;
  label: string;
  subLabel: string;
  items: TransactionItem[];
}

