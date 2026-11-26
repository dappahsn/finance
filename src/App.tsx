import { useState } from 'react';
import AccountPage from './components/AccountPage';
import { CashflowOverviewCard } from './components/CashflowOverviewCard';
import BudgetPage from './components/BudgetPage';
import { Header } from './components/Header';
import HomePage from './components/HomePage';
import { ReceiptModal } from './components/ReceiptModal';
import { TransactionFeed } from './components/TransactionFeed';
import { TransactionFilters } from './components/TransactionFilters';
import {
  CATEGORY_CHIPS,
  PERIOD_TABS,
} from './data/transactionFilters';
import type {
  CategoryFilterId,
  NavTabId,
  PeriodFilter,
  TransactionItem,
} from './types/finance';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('beranda');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodFilter>('Bulan Ini');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterId>('all');
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionItem | null>(null);

  return (
    <>
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />
      <main className="relative flex w-full flex-1 flex-col bg-surface px-margin pb-8 pt-24">
        {activeTab === 'beranda' ? (
          <HomePage onNavigate={setActiveTab} />
        ) : activeTab === 'transaksi' ? (
          <div className="mx-auto flex w-full max-w-6xl flex-col space-y-space-lg">
            <CashflowOverviewCard />
            <TransactionFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              periodTabs={PERIOD_TABS}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              categoryChips={CATEGORY_CHIPS}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <TransactionFeed
              groups={[]}
              searchQuery={searchQuery}
              onSelectTransaction={setSelectedTransaction}
            />
          </div>
        ) : activeTab === 'anggaran' ? (
          <BudgetPage />
        ) : (
          <AccountPage />
        )}
      </main>
      <ReceiptModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}

export default App;
