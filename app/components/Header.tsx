"use client";

import {
    Bell,
    ChevronDown,
    Menu,
    Search,
} from "lucide-react";

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="text-xs font-medium text-slate-400">
            Workspace
          </div>

          <div className="text-sm font-semibold text-slate-900">
            Overview
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white sm:flex sm:w-[220px]">
          <Search size={16} />

          <span className="flex-1">
            Search anything...
          </span>

          <kbd className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            ⌘ K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell size={19} strokeWidth={1.8} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white" />
        </button>

        {/* Profile */}
        <button className="ml-1 flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            A
          </div>

          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-slate-800">
              Administrator
            </div>

            <div className="text-[10px] text-slate-400">
              Admin
            </div>
          </div>

          <ChevronDown
            size={15}
            className="hidden text-slate-400 sm:block"
          />
        </button>
      </div>
    </header>
  );
}