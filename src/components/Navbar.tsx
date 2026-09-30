import React from 'react';
import { Zap, ShieldCheck, History, Settings, PlayCircle, QrCode, Download } from 'lucide-react';

interface NavbarProps {
  activeTab: 'recharge' | 'orders' | 'admin';
  setActiveTab: (tab: 'recharge' | 'orders' | 'admin') => void;
  onOpenTestSuite: () => void;
  onOpenDownloadApk?: () => void;
  merchantUpiVpa?: string;
  onOpenAdminUpiConfig?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenTestSuite,
  onOpenDownloadApk,
  merchantUpiVpa = 'rolexmars37-1@oksbi',
  onOpenAdminUpiConfig,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('recharge')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                BharatRecharge
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ₹5 OFF
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Jio & Airtel Instant UPI Recharge
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Download Android APK Button */}
          <button
            onClick={onOpenDownloadApk}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all hover:scale-102 cursor-pointer shadow-sm shadow-emerald-500/10"
            title="Download Android APK file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Download APK</span>
            <span className="sm:hidden">APK</span>
          </button>

          {/* Admin-only UPI Settings shortcut if in admin tab */}
          {activeTab === 'admin' && onOpenAdminUpiConfig && (
            <button
              onClick={onOpenAdminUpiConfig}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
              title="Admin: Change Receiving UPI ID"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]">
                UPI: {merchantUpiVpa}
              </span>
            </button>
          )}

          {/* Automated Test Suite Button */}
          <button
            onClick={onOpenTestSuite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all hover:scale-102 cursor-pointer shadow-sm"
            title="Run end-to-end automated test suite"
          >
            <PlayCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">E2E Tests</span>
            <span className="sm:hidden">Tests</span>
          </button>

          {/* Navigation Links */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('recharge')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'recharge'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Recharge</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
