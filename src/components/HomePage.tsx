import type { FC } from 'react';
import type { NavTabId } from '../types/finance';

interface HomePageProps {
  onNavigate: (tab: NavTabId) => void;
}

const HomePage: FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-[0.14em] text-text-muted">
            Ringkasan keuangan
          </p>
          <h1 className="mt-2 font-headline-lg text-headline-lg text-text-primary">
            Selamat datang
          </h1>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-3 font-body-md-medium text-body-md-medium text-on-primary shadow-sm transition hover:bg-primary-container active:scale-[0.98] sm:self-auto"
          onClick={() => onNavigate('transaksi')}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Lihat transaksi
        </button>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="relative flex min-h-56 flex-col justify-between overflow-hidden rounded-2xl bg-primary p-6 text-on-primary shadow-[0_16px_40px_rgba(87,53,39,0.12)] sm:p-8">
          <div
            aria-hidden="true"
            className="absolute -right-14 -top-20 h-56 w-56 rounded-full border border-white/10"
          />
          <div className="relative">
            <span className="icon-tile h-11 w-11 rounded-xl bg-white/10 text-on-primary">
              <span className="material-symbols-outlined text-[22px]">
                account_balance_wallet
              </span>
            </span>
            <h2 className="mt-6 font-headline-sm text-headline-sm">
              Datamu akan tampil di sini
            </h2>
            <p className="mt-2 max-w-md font-body-md text-body-md text-on-primary/75">
              Saldo, pemasukan, dan pengeluaran akan dihitung dari transaksi
              milik akunmu setelah database terhubung.
            </p>
          </div>
        </article>

        <article className="flex min-h-56 flex-col justify-between rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm sm:p-8">
          <div>
            <span className="icon-tile h-11 w-11 rounded-xl bg-tertiary-fixed text-tertiary">
              <span className="material-symbols-outlined text-[22px]">
                pie_chart
              </span>
            </span>
            <h2 className="mt-5 font-headline-sm text-headline-sm text-text-primary">
              Anggaranmu
            </h2>
            <p className="mt-2 font-body-md text-body-md text-text-secondary">
              Buat anggaran untuk merencanakan pengeluaran setelah data akunmu
              siap.
            </p>
          </div>
          <button
            className="mt-5 self-start font-body-md-medium text-body-md-medium text-primary transition hover:text-secondary"
            onClick={() => onNavigate('anggaran')}
            type="button"
          >
            Buka Anggaran
          </button>
        </article>
      </section>

      <section className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="icon-tile h-10 w-10 rounded-xl bg-surface-container-low text-primary">
            <span className="material-symbols-outlined text-[20px]">
              receipt_long
            </span>
          </span>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-text-primary">
              Aktivitas terbaru
            </h2>
            <p className="mt-0.5 font-body-sm text-body-sm text-text-muted">
              Belum ada transaksi untuk ditampilkan.
            </p>
          </div>
        </div>
        <button
          className="mt-5 rounded-xl border border-border-subtle px-4 py-2.5 font-body-md-medium text-body-md-medium text-text-secondary transition hover:bg-surface-container-low"
          onClick={() => onNavigate('transaksi')}
          type="button"
        >
          Buka transaksi
        </button>
      </section>
    </div>
  );
};

export default HomePage;
