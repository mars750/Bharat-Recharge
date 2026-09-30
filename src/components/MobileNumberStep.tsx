import React, { useState } from 'react';
import { OperatorId, RechargePlan } from '../types';
import {
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Zap,
  QrCode,
  Edit2,
  Check,
} from 'lucide-react';

interface MobileNumberStepProps {
  operator: OperatorId;
  plan: RechargePlan;
  circle: string;
  onBack: () => void;
  onSubmitOrder: (mobileNumber: string) => Promise<void>;
  isLoading: boolean;
  merchantUpiVpa: string;
  merchantUpiName: string;
}

export const MobileNumberStep: React.FC<MobileNumberStepProps> = ({
  operator,
  plan,
  circle,
  onBack,
  onSubmitOrder,
  isLoading,
  merchantUpiVpa = 'rolexmars37-1@oksbi',
  merchantUpiName = 'Rolex Mars',
}) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isJio = operator === 'jio';
  // Backend discount estimate for UI preview (backend calculates and enforces the real one)
  const discountEstimate = 5;
  const payableEstimate = Math.max(1, plan.price - discountEstimate);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(raw);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mobileNumber.length !== 10) {
      setError('Please enter a complete 10-digit mobile number');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError('Indian mobile numbers must start with 6, 7, 8, or 9');
      return;
    }

    try {
      await onSubmitOrder(mobileNumber);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    }
  };

  const handleQuickFill = (num: string) => {
    setMobileNumber(num);
    setError(null);
  };

  const isValidNumber = /^[6-9]\d{9}$/.test(mobileNumber);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button and title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Enter Mobile Number & Confirm Order
          </h2>
          <p className="text-xs text-slate-500">
            Step 3 of 4 • Official Telecom Gateway Recharging
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mobile Input Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            10-Digit Indian Mobile Number
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="text-slate-500 font-extrabold text-base flex items-center gap-1.5">
                <span className="text-lg">🇮🇳</span> +91
              </span>
            </div>

            <input
              type="tel"
              value={mobileNumber}
              onChange={handleInputChange}
              placeholder="98765 43210"
              maxLength={10}
              autoFocus
              disabled={isLoading}
              className={`w-full pl-22 pr-12 py-3.5 bg-slate-50 border rounded-xl text-lg font-mono font-bold tracking-wider text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-500 focus:ring-red-500/20'
                  : isValidNumber
                  ? 'border-emerald-500 focus:ring-emerald-500/20'
                  : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
            />

            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
              {isValidNumber ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Smartphone className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 mt-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {/* Quick test numbers */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400">Quick fill demo numbers:</span>
            <button
              type="button"
              onClick={() => handleQuickFill('9876543210')}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono cursor-pointer"
            >
              9876543210
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('9810012345')}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono cursor-pointer"
            >
              9810012345
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('7012345678')}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono cursor-pointer"
            >
              7012345678
            </button>
          </div>
        </div>

        {/* ORDER SUMMARY CONFIRMATION CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm sm:text-base">Order Confirmation Summary</h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
              ₹5 Instant Discount
            </span>
          </div>

          <div className="p-6 space-y-4">
            {/* Operator and Target Number */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">Telecom Operator:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded text-white ${
                    isJio ? 'bg-[#002B9A]' : 'bg-[#C80000]'
                  }`}
                >
                  {isJio ? 'JIO' : 'AIRTEL'}
                </span>
                <span className="font-bold text-slate-800">
                  {isJio ? 'Reliance Jio' : 'Bharti Airtel'} ({circle})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">Mobile Number:</span>
              <span className="font-mono font-bold text-slate-900">
                {mobileNumber ? `+91 ${mobileNumber}` : '— (Enter above)'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">Selected Plan:</span>
              <div className="text-right">
                <p className="font-bold text-slate-900">{plan.name}</p>
                <p className="text-xs text-slate-500">
                  {plan.validity} • {plan.data} • {plan.voice}
                </p>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">Plan Official Price:</span>
                <span className="font-semibold text-slate-900">₹{plan.price}.00</span>
              </div>

              <div className="flex items-center justify-between text-sm text-emerald-700 font-semibold">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  Special BharatRecharge Discount:
                </span>
                <span>- ₹{discountEstimate}.00</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Final Payable Amount
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Calculated & validated on server
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">
                    ₹{payableEstimate}.00
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    You Save ₹{discountEstimate}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Verified Receiving UPI ID Section for Dynamic QR */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-4 text-white space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-100">
                      Verified Payee UPI
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Dynamic QR generated for ₹{payableEstimate}.00 directly to verified merchant
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Merchant</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-black/30 px-3 py-2.5 rounded-lg border border-white/5">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Payee VPA (Admin Configured):</span>
                  <span className="font-mono text-xs font-bold text-emerald-300">
                    {merchantUpiVpa}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Payee Name:</span>
                  <span className="text-xs font-bold text-white">
                    {merchantUpiName}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="flex items-start gap-2 text-xs text-slate-500 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Important: You will pay <strong>₹{payableEstimate}</strong> via UPI QR. Your mobile will receive the full{' '}
                <strong>₹{plan.price}</strong> official carrier recharge value. Payment is cryptographically verified before telecom delivery.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading || !isValidNumber}
              className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isValidNumber && !isLoading
                  ? isJio
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:scale-[1.01]'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/25 hover:scale-[1.01]'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Secure Order...</span>
                </div>
              ) : (
                <>
                  <span>Proceed to Pay ₹{payableEstimate} (Dynamic UPI QR)</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
