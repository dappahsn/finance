import type { CategoryChip, PeriodFilter } from '../types/finance';

export const PERIOD_TABS: PeriodFilter[] = [
  'Bulan Ini',
  'Minggu Ini',
  'Semua',
  'Kustom',
];

export const CATEGORY_CHIPS: CategoryChip[] = [
  { id: 'all', label: 'Semua' },
  { id: 'makanan', label: '🍜 Makanan & Minuman' },
  { id: 'belanja', label: '🛍️ Belanja' },
  { id: 'transportasi', label: '🚗 Transportasi' },
  { id: 'gaji', label: '💼 Gaji & Bonus' },
  { id: 'tagihan', label: '⚡ Tagihan' },
  { id: 'investasi', label: '📈 Investasi' },
];
