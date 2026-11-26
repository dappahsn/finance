import { useState, type FC } from 'react';
import type { NavTabId } from '../types/finance';

interface NavbarProps {
  activeTab: NavTabId;
  onSelectTab?: (tab: NavTabId) => void;
}

const NAV_ITEMS: { id: NavTabId; label: string; icon: string }[] = [
  { id: 'beranda', label: 'Beranda', icon: 'dashboard' },
  { id: 'transaksi', label: 'Transaksi', icon: 'receipt_long' },
  { id: 'anggaran', label: 'Anggaran', icon: 'pie_chart' },
  { id: 'pengaturan', label: 'Akun', icon: 'settings' },
];

export const Navbar: FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const selectTab = (tab: NavTabId) => {
    onSelectTab?.(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav aria-label="Navigasi utama" className="hidden md:block">
        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <button
                aria-current={activeTab === item.id ? 'page' : undefined}
                className={`rounded-full px-4 py-2 font-body-md-medium text-body-md-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-container-high/50 hover:text-text-primary'
                }`}
                onClick={() => selectTab(item.id)}
                type="button"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative md:hidden">
        <button
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high/40"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {isMenuOpen && (
          <nav
            aria-label="Navigasi utama"
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border-subtle bg-surface-card p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
            id="mobile-navigation"
          >
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    aria-current={activeTab === item.id ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-body-md-medium text-body-md-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-surface-container-high/50 hover:text-text-primary'
                    }`}
                    onClick={() => selectTab(item.id)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </>
  );
};
