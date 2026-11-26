import { useEffect, useState } from 'react';
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
import { requestAuth, type AuthUser } from './lib/auth';
import type {
  CategoryFilterId,
  NavTabId,
  PeriodFilter,
  TransactionItem,
} from './types/finance';

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [activeTab, setActiveTab] = useState<NavTabId>('beranda');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodFilter>('Bulan Ini');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterId>('all');
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    void requestAuth('session')
      .then((result) => {
        if (!isMounted) return;
        setUser(result.user ?? null);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setSessionError(
          error instanceof Error
            ? error.message
            : 'Tidak dapat menghubungi server API.',
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUserChange = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    setSessionError('');
    setActiveTab('beranda');
    setSelectedTransaction(null);
  };

  if (isLoadingSession) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-surface px-margin">
        <div aria-label="Memuat sesi akun" role="status">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">
            progress_activity
          </span>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen w-full flex-col justify-center overflow-x-hidden bg-surface px-margin py-8">
        <AccountPage
          initialError={sessionError}
          onUserChange={handleUserChange}
          user={null}
        />
      </main>
    );
  }

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
          <AccountPage onUserChange={handleUserChange} user={user} />
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
