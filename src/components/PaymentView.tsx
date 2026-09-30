import React, { useState, useEffect } from 'react';
import { Order, PaymentDetails } from '../types';
import { api } from '../services/api';
import {
  QrCode,
  Smartphone,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface PaymentViewProps {
  order: Order;
  paymentDetails: PaymentDetails;
  onPaymentSuccess: (order: Order) => void;
  onCancel: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({
  order,
  paymentDetails: initialPaymentDetails,
  onPaymentSuccess,
  onCancel,
}) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(initialPaymentDetails);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [showUtrDrawer, setShowUtrDrawer] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [utrSubmitting, setUtrSubmitting] = useState<boolean>(false);
  const [utrFeedback, setUtrFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Polling state
  const [isPolling, setIsPolling] = useState<boolean>(true);

  // Format countdown mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Real-time server status polling effect
  useEffect(() => {
    if (!isPolling) return;

    let active = true;
    const pollInterval = setInterval(async () => {
      try {
        const statusData = await api.getPaymentStatus(order.orderId);
        if (!active) return;

        if (statusData.paymentStatus === 'SUCCESS') {
          setIsPolling(false);
          // Pass the updated order with success status
          onPaymentSuccess({
            ...order,
            paymentStatus: 'SUCCESS',
            rechargeStatus: statusData.rechargeStatus,
            operatorRefNum: statusData.operatorRefNum,
            rechargeTxnId: statusData.rechargeTxnId,
          });
        }
      } catch (err) {
        console.error('Polling payment status failed:', err);
      }
    }, 2500);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [order.orderId, isPolling, onPaymentSuccess, order]);

  // Copy VPA to clipboard
  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText(paymentDetails.upiVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Copy Amount to clipboard
  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(paymentDetails.payableAmount.toFixed(2));
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Submit UTR / UPI Reference
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = utrNumber.trim();
    if (clean.length < 10) {
      setUtrFeedback({
        type: 'error',
        message: 'Invalid UTR: Standard UPI reference (UTR / RRN) is 12 digits.',
      });
      return;
    }

    setUtrSubmitting(true);
    setUtrFeedback(null);

    try {
      const res = await api.submitUtr(order.orderId, clean);
      setUtrFeedback({
        type: 'success',
        message:
          'UTR submitted! Your submission is PENDING bank reconciliation. The admin panel can verify and approve it immediately.',
      });
    } catch (err: unknown) {
      setUtrFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'UTR submission failed',
      });
    } finally {
      setUtrSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>Scan Dynamic UPI QR to Pay</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Step 4 of 4
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Order ID: <span className="font-mono font-bold text-slate-700">{order.orderId}</span>
          </p>
        </div>

        {/* Expiry countdown timer */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          <span>Expires in {formattedTime}</span>
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        {/* Price Breakdown Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
              <span>{order.operator.toUpperCase()} PREPAID</span>
              <span>•</span>
              <span className="font-mono">+91 {order.mobileNumber}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black tracking-tight text-white">
                ₹{paymentDetails.payableAmount.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                ₹{order.discount} Instant Discount Applied
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Recharge Value: ₹{order.planPrice}.00 | You Pay: ₹{paymentDetails.payableAmount}.00
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>NPCI / UPI 2.0 Encrypted</span>
          </div>
        </div>

        {/* QR Code and Intent Area */}
        <div className="p-6 flex flex-col items-center">
          {/* Active Payee UPI ID Bar - Locked and Verified */}
          <div className="w-full max-w-md mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  UPI
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Official Merchant (Payee)</span>
                  <span className="font-mono font-bold text-slate-900">{paymentDetails.upiVpa}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Payee</span>
              </div>
            </div>
          </div>

          {/* Dynamic QR Frame */}
          <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-sm max-w-[280px]">
            <img
              src={paymentDetails.qrCodeUrl}
              alt={`UPI QR for ₹${paymentDetails.payableAmount}`}
              className="w-64 h-64 rounded-xl object-contain mx-auto"
            />

            {/* Center UPI logo watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center">
                <span className="text-[9px] font-black text-indigo-700 tracking-tighter">UPI</span>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-600 mt-3 text-center">
            Scan with any UPI App (GPay, PhonePe, Paytm, CRED, BHIM)
          </p>

          {/* VPA and Amount Copy Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleCopyVpa}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <span>{paymentDetails.upiVpa}</span>
              {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              onClick={handleCopyAmount}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              <span>₹{paymentDetails.payableAmount.toFixed(2)}</span>
              {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          {/* UPI Intent Deep Link Buttons (for mobile browsers) */}
          <div className="w-full mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Or Open Installed UPI App Directly
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href={paymentDetails.upiIntentUrl}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-slate-700 text-xs font-bold transition-all text-center"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Google Pay</span>
              </a>

              <a
                href={paymentDetails.upiIntentUrl}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 text-slate-700 text-xs font-bold transition-all text-center"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>PhonePe</span>
              </a>

              <a
                href={paymentDetails.upiIntentUrl}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 text-slate-700 text-xs font-bold transition-all text-center"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Paytm</span>
              </a>

              <a
                href={paymentDetails.upiIntentUrl}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 text-xs font-bold transition-all text-center"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>CRED / BHIM</span>
              </a>
            </div>
          </div>

          {/* Real-time Status Listening Indicator */}
          <div className="w-full mt-5 bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="font-semibold">
                Listening for bank webhook confirmation...
              </span>
            </div>
            <span className="text-[11px] text-blue-700 font-mono">Auto-detecting</span>
          </div>
        </div>

        {/* UTR / Transaction ID Submission Drawer */}
        <div className="border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setShowUtrDrawer(!showUtrDrawer)}
            className="w-full px-6 py-3 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span>Paid via UPI but screen didn&apos;t update? Enter 12-Digit UTR Number</span>
            </span>
            {showUtrDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showUtrDrawer && (
            <div className="px-6 pb-6 pt-2 border-t border-slate-200/60 bg-white">
              <p className="text-xs text-slate-500 mb-3">
                If your UPI app debited the amount without automatic callback, enter the 12-digit Bank Reference Number (UTR / RRN) from your payment receipt.
              </p>

              <form onSubmit={handleSubmitUtr} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                  placeholder="Enter 12-digit UTR (e.g. 428190382910)"
                  maxLength={22}
                  disabled={utrSubmitting}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wide focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />

                <button
                  type="submit"
                  disabled={utrSubmitting || utrNumber.trim().length < 10}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  {utrSubmitting ? 'Submitting...' : 'Submit UTR'}
                </button>
              </form>

              {utrFeedback && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
                    utrFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{utrFeedback.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order */}
      <div className="text-center pt-2">
        <button
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
        >
          Cancel this order and select different plan
        </button>
      </div>
    </div>
  );
};
