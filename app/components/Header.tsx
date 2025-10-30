"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/40 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center px-4">
        <button
          onClick={onMenuClick}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
