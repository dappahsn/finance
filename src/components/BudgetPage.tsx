import { useState, type FormEvent, type FC } from 'react';

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  spent: number;
  limit: number;
  color: string;
  background: string;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number) => CURRENCY_FORMATTER.format(amount);
const currentMonth = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
}).format(new Date());

const BudgetPage: FC = () => {
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [filter, setFilter] = useState<'semua' | 'mendekati'>('semua');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryLimit, setCategoryLimit] = useState('');
  const [formError, setFormError] = useState('');

  const totalSpent = budgets.reduce((total, budget) => total + budget.spent, 0);
  const totalLimit = budgets.reduce((total, budget) => total + budget.limit, 0);
  const remaining = Math.max(totalLimit - totalSpent, 0);
  const displayedBudgets =
    filter === 'mendekati'
      ? budgets.filter((budget) => budget.spent / budget.limit >= 0.8)
      : budgets;

  const addBudget = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryName.trim();
    const limit = Number(categoryLimit);

    if (!name || !Number.isFinite(limit) || limit <= 0) {
      setFormError('Isi nama kategori dan batas anggaran yang valid.');
      return;
    }

    if (budgets.some((budget) => budget.name.toLowerCase() === name.toLowerCase())) {
      setFormError('Kategori ini sudah memiliki anggaran.');
      return;
    }

    setBudgets((currentBudgets) => [
      ...currentBudgets,
      {
        id: `custom-${Date.now()}`,
        name,
        icon: 'savings',
        spent: 0,
        limit,
        color: 'text-primary',
        background: 'bg-primary-fixed',
      },
    ]);
    setCategoryName('');
    setCategoryLimit('');
    setFormError('');
    setIsFormOpen(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-[0.14em] text-text-muted">
            Atur dengan tenang
          </p>
          <h1 className="mt-2 font-headline-lg text-headline-lg text-text-primary">
            Anggaran bulanan
          </h1>
          <p className="mt-1 font-body-md text-body-md text-text-secondary">
            Pantau pengeluaran dan sisihkan ruang untuk hal yang penting.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-3 font-body-md-medium text-body-md-medium text-on-primary shadow-sm transition hover:bg-primary-container active:scale-[0.98] sm:self-auto"
          onClick={() => {
            setFormError('');
            setIsFormOpen(true);
          }}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Buat anggaran
        </button>
      </section>
      <p className="rounded-xl border border-primary/15 bg-primary-fixed/30 px-4 py-3 font-body-sm text-body-sm text-text-secondary">
        Data anggaran belum terhubung ke Supabase. Anggaran yang ditambahkan
        saat ini hanya tersimpan sementara di halaman ini.
      </p>

      <section
        aria-label="Ringkasan anggaran bulan ini"
        className="grid gap-4 sm:grid-cols-3"
      >
        <article className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-body-sm text-body-sm text-text-muted">
            Total anggaran
          </p>
          <p className="mt-2 font-financial-amount-md text-financial-amount-md text-text-primary">
            {formatCurrency(totalLimit)}
          </p>
          <p className="mt-1 font-body-sm text-body-sm text-text-muted">
            {budgets.length} kategori tersimpan
          </p>
        </article>
        <article className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-body-sm text-body-sm text-text-muted">
            Sudah digunakan
          </p>
          <p className="mt-2 font-financial-amount-md text-financial-amount-md text-text-primary">
            {formatCurrency(totalSpent)}
          </p>
          <p className="mt-1 font-body-sm text-body-sm text-income-green">
            {totalLimit ? `${Math.round((totalSpent / totalLimit) * 100)}% dari batas` : 'Belum ada data pemakaian'}
          </p>
        </article>
        <article className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm">
          <p className="font-body-sm text-body-sm text-text-muted">
            Sisa anggaran
          </p>
          <p className="mt-2 font-financial-amount-md text-financial-amount-md text-text-primary">
            {formatCurrency(remaining)}
          </p>
          <p className="mt-1 font-body-sm text-body-sm text-text-muted">
            {budgets.length ? 'Belum ada transaksi yang terhubung' : 'Belum ada anggaran'}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-text-muted">
              Periode
            </p>
            <h2 className="mt-1 font-headline-sm text-headline-sm text-text-primary">
              {currentMonth}
            </h2>
          </div>
          <div
            aria-label="Filter kategori anggaran"
            className="inline-flex self-start rounded-xl bg-surface-container-low p-1"
            role="group"
          >
            <button
              aria-pressed={filter === 'semua'}
              className={`rounded-lg px-3 py-2 font-body-md-medium text-body-md-medium transition ${
                filter === 'semua'
                  ? 'bg-surface-card text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setFilter('semua')}
              type="button"
            >
              Semua
            </button>
            <button
              aria-pressed={filter === 'mendekati'}
              className={`rounded-lg px-3 py-2 font-body-md-medium text-body-md-medium transition ${
                filter === 'mendekati'
                  ? 'bg-surface-card text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setFilter('mendekati')}
              type="button"
            >
              Mendekati batas
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {displayedBudgets.map((budget) => {
            const progress = (budget.spent / budget.limit) * 100;
            const isOverLimit = progress > 100;
            const isNearLimit = progress >= 80;
            const barColor = isOverLimit
              ? 'bg-expense-rose'
              : isNearLimit
                ? 'bg-primary'
                : 'bg-tertiary';

            return (
              <article
                className="rounded-xl border border-border-subtle bg-surface p-4 sm:p-5"
                key={budget.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${budget.background} ${budget.color}`}
                    >
                      <span className="material-symbols-outlined text-[21px]">
                        {budget.icon}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-body-md-medium text-body-md-medium text-text-primary">
                        {budget.name}
                      </h3>
                      <p className="mt-0.5 font-body-sm text-body-sm text-text-muted">
                        Batas {formatCurrency(budget.limit)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 font-label-sm text-label-sm ${
                      isOverLimit
                        ? 'bg-expense-rose-subtle text-expense-rose'
                        : isNearLimit
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-tertiary-fixed text-tertiary'
                    }`}
                  >
                    {Math.round(progress)}%
                  </span>
                </div>
                <div
                  aria-label={`${budget.name}: ${Math.round(progress)}% anggaran terpakai`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.min(Math.round(progress), 100)}
                  className="mt-5 h-2 overflow-hidden rounded-full bg-surface-container-high"
                  role="progressbar"
                >
                  <div
                    className={`h-full rounded-full transition-[width] ${barColor}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 font-body-sm text-body-sm">
                  <span className={isOverLimit ? 'font-semibold text-expense-rose' : 'text-text-secondary'}>
                    Terpakai {formatCurrency(budget.spent)}
                  </span>
                  <span className="text-right text-text-muted">
                    {isOverLimit
                      ? `Melebihi ${formatCurrency(budget.spent - budget.limit)}`
                      : `Sisa ${formatCurrency(budget.limit - budget.spent)}`}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
        {budgets.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-outline-variant bg-surface px-5 py-10 text-center">
            <span className="icon-tile mx-auto h-12 w-12 rounded-xl bg-tertiary-fixed text-tertiary">
              <span className="material-symbols-outlined text-[24px]">
                savings
              </span>
            </span>
            <h3 className="mt-3 font-body-md-medium text-body-md-medium text-text-primary">
              Belum ada anggaran
            </h3>
            <p className="mx-auto mt-1 max-w-md font-body-sm text-body-sm text-text-secondary">
              Anggaran yang kamu buat akan muncul di sini. Saat ini perubahan
              hanya tersimpan sementara di halaman ini.
            </p>
            <button
              className="mt-4 rounded-xl bg-primary px-4 py-2.5 font-body-md-medium text-body-md-medium text-on-primary transition hover:bg-primary-container"
              onClick={() => setIsFormOpen(true)}
              type="button"
            >
              Buat anggaran pertama
            </button>
          </div>
        ) : displayedBudgets.length === 0 ? (
          <p className="py-10 text-center font-body-md text-body-md text-text-muted">
            Belum ada kategori yang mendekati batas anggaran.
          </p>
        ) : null}
      </section>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsFormOpen(false);
          }}
        >
          <form
            aria-labelledby="budget-form-title"
            aria-modal="true"
            className="w-full max-w-md space-y-5 rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-2xl"
            onSubmit={addBudget}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-text-muted">
                  Anggaran baru
                </p>
                <h2
                  className="mt-1 font-headline-sm text-headline-sm text-text-primary"
                  id="budget-form-title"
                >
                  Tambah kategori
                </h2>
              </div>
              <button
                aria-label="Tutup form"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-container-low hover:text-text-primary"
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <label className="block space-y-1.5">
              <span className="font-body-md-medium text-body-md-medium text-text-primary">
                Nama kategori
              </span>
              <input
                autoFocus
                className="h-11 w-full rounded-xl border border-border-subtle bg-surface px-3 text-text-primary outline-none transition placeholder:text-text-muted focus:border-primary"
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Contoh: Perawatan diri"
                required
                value={categoryName}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="font-body-md-medium text-body-md-medium text-text-primary">
                Batas anggaran per bulan
              </span>
              <div className="flex h-11 items-center rounded-xl border border-border-subtle bg-surface px-3 focus-within:border-primary">
                <span className="mr-2 font-body-md text-body-md text-text-muted">
                  Rp
                </span>
                <input
                  className="h-full min-w-0 flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-muted"
                  inputMode="numeric"
                  min="1"
                  onChange={(event) => setCategoryLimit(event.target.value)}
                  placeholder="500000"
                  required
                  type="number"
                  value={categoryLimit}
                />
              </div>
            </label>
            {formError && (
              <p className="font-body-sm text-body-sm text-expense-rose" role="alert">
                {formError}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                className="flex-1 rounded-xl border border-border-subtle px-4 py-3 font-body-md-medium text-body-md-medium text-text-secondary transition hover:bg-surface-container-low"
                onClick={() => setIsFormOpen(false)}
                type="button"
              >
                Batal
              </button>
              <button
                className="flex-1 rounded-xl bg-primary px-4 py-3 font-body-md-medium text-body-md-medium text-on-primary transition hover:bg-primary-container"
                type="submit"
              >
                Simpan anggaran
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BudgetPage;
