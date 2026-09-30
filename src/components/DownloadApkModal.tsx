import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  X,
  FileCheck,
  Cpu,
} from 'lucide-react';

interface DownloadApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadApkModal: React.FC<DownloadApkModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const apkUrl = `${window.location.origin}/BharatRecharge.apk`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(apkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownload = () => {
    // Create an invisible anchor tag to trigger download with proper filename
    const link = document.createElement('a');
    link.href = '/BharatRecharge.apk';
    link.download = 'BharatRecharge.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center shadow-md font-black text-xl">
              <Smartphone className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">Bharat Recharge App</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                  Android APK
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Official signed Android application package (.apk)
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Main Download Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-mono font-bold text-slate-800 block">
                BharatRecharge.apk
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-500 font-medium">
                <span>Version 1.1.0</span>
                <span>•</span>
                <span className="font-semibold text-emerald-600">~193 KB (Embedded Offline Ready)</span>
                <span>•</span>
                <span>Android 5.0+</span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download APK v1.1</span>
            </button>
          </div>

          {/* Standalone Embedded Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">Fixed: Offline &amp; Mobile Error Resolved</p>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                App ke sabhi web assets APK ke andar bundle kar diye gaye hain. Ab mobile me install karne ke baad &ldquo;404 Page Not Found&rdquo; ya server error nahi aayega aur app turant open hoga.
              </p>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Package Name</span>
              <span className="font-mono font-bold text-slate-800 text-[11px] break-all">
                com.bharatrecharge.app
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Digital Signature</span>
              <div className="flex items-center gap-1 mt-0.5 text-emerald-600 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>v1 + v2 + v3 Signed</span>
              </div>
            </div>
          </div>

          {/* Installation Steps */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Easy 3-Step Installation on Phone</span>
            </h4>

            <ol className="text-xs text-indigo-900/90 space-y-1.5 list-decimal list-inside font-medium leading-relaxed">
              <li>
                Tap <strong>&quot;Download APK&quot;</strong> above to save <code className="bg-indigo-100/70 px-1 py-0.5 rounded text-[11px]">BharatRecharge.apk</code> to your device.
              </li>
              <li>
                Open the downloaded file from your browser notification or Downloads folder.
              </li>
              <li>
                If Android shows <em>&quot;Install unknown apps&quot;</em>, tap <strong>Settings</strong> &gt; enable <strong>&quot;Allow from this source&quot;</strong>, then tap <strong>Install</strong>.
              </li>
            </ol>
          </div>

          {/* Copy Direct Link */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-medium">Direct Download Link:</span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-mono text-[11px] truncate select-all">
              {apkUrl}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">Supports Jio &amp; Airtel Instant UPI Recharge</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
