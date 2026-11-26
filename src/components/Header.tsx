import React from 'react';
import type { NavTabId } from '../types/finance';
import { Navbar } from './Navbar';

interface HeaderProps {
  activeTab: NavTabId;
  onSelectTab?: (tab: NavTabId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(15,23,42,0.03)] pt-safe">
      <div className="h-16 px-margin flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="font-headline-sm text-headline-sm text-text-primary tracking-tight">
            finance
          </span>
        </div>
        <Navbar activeTab={activeTab} onSelectTab={onSelectTab} />
        <div className="flex items-center gap-space-xs">
          <button
            aria-label="Notifikasi"
            className="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high/40 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">
              notifications
            </span>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-expense-rose ring-2 ring-surface" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_8px_rgba(0,104,95,0.2)]">
            <span className="material-symbols-outlined text-on-primary text-[18px]">
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
