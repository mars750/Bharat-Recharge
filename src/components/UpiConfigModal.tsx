import React, { useState } from 'react';
import { api } from '../services/api';
import { QrCode, CheckCircle2, AlertCircle, Sparkles, Building2, Save } from 'lucide-react';

interface UpiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVpa: string;
  currentName: string;
  onSaved: (newVpa: string, newName: string) => void;
  sampleAmount?: number;
}

const COMMON_HANDLES = [
  '@okaxis',
  '@okhdfcbank',
  '@okicici',
  '@oksbi',
  '@paytm',
  '@ybl',
  '@ibl',
  '@upi',
];

export const UpiConfigModal: React.FC<UpiConfigModalProps> = ({
  isOpen,
  onClose,
  currentVpa,
  currentName,
  onSaved,
  sampleAmount = 294,
}) => {
  const [vpa, setVpa] = useState(currentVpa || 'bharatrecharge.pay@okaxis');
  const [name, setName] = useState(currentName || 'Bharat Recharge Tech');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAppendHandle = (handle: string) => {
    if (vpa.includes('@')) {
      const prefix = vpa.split('@')[0];
      setVpa(`${prefix}${handle}`);
    } else {
      setVpa(`${vpa}${handle}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVpa = vpa.trim();
    if (!cleanVpa || !cleanVpa.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. yourname@okaxis, 9876543210@paytm, user@ybl)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.updateUpiSettings(cleanVpa, name.trim());
      setSuccessMsg(`UPI ID updated to ${cleanVpa}! All dynamic QRs will now use this UPI ID.`);
      onSaved(cleanVpa, name.trim());
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save UPI settings');
    } finally {
      setLoading(false);
    }
  };

  const previewUri = `upi://pay?pa=${vpa.trim()}&pn=${encodeURIComponent(name.trim() || 'Merchant')}&am=${sampleAmount.toFixed(2)}&cu=INR&tn=Recharge`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Configure Receiving UPI ID (Payee VPA)
              </h3>
              <p className="text-[11px] text-slate-500">
                Dynamic QR will be generated with this UPI ID for the exact Final Payable Amount
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Dynamic UPI QR Guarantee:</span>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Whenever the user reaches &ldquo;Proceed to Pay&rdquo;, the QR code is generated dynamically with <strong>this UPI ID</strong> and the exact <strong>Final Payable Amount (e.g. ₹{sampleAmount})</strong>. Money scanned will go directly to your UPI ID!
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your UPI ID / Payee VPA <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vpa}
              onChange={(e) => {
                setVpa(e.target.value);
                setError(null);
              }}
              placeholder="e.g. rolexmars37@okaxis, 9876543210@paytm, store@ybl"
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />

            {/* Quick Handle Buttons */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold">Quick Handles:</span>
              {COMMON_HANDLES.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleAppendHandle(h)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono cursor-pointer"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Payee Display Name (Shown in GPay / PhonePe)
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bharat Recharge Tech / Your Name or Store"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Live UPI Intent Preview */}
          <div className="p-3 bg-slate-900 rounded-xl text-white space-y-1 font-mono text-[10px]">
            <span className="text-slate-400 block font-bold uppercase tracking-wider">
              Generated Dynamic UPI String Preview:
            </span>
            <div className="p-2 bg-slate-950 rounded text-emerald-400 break-all select-all">
              {previewUri}
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1 text-[10px]">
              <span>Payee: <strong className="text-white">{vpa || '—'}</strong></span>
              <span>Amount: <strong className="text-amber-300">₹{sampleAmount.toFixed(2)}</strong></span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !vpa.includes('@')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Set Active UPI ID'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
